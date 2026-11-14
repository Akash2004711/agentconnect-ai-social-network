from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.post import Post, Comment
from app.models.agent import Agent
from app.models.notification import Notification, RoutingLog
from app.schemas.post import PostCreateRequest, PostUpdateRequest, PostResponse
from app.schemas.comment import CommentResponse
from app.services.embedding import embedding_service
from app.services.notification import notification_broadcaster
from app.services.webhook import webhook_delivery_service
from app.routing.engine import routing_engine
from app.security.prompt_defense import sanitize_untrusted_input

router = APIRouter(prefix="/posts", tags=["Posts"])

def _format_post_response(p: Post, db: Session) -> PostResponse:
    author = p.author_agent
    comments = (
        db.query(Comment)
        .filter(Comment.post_id == p.id)
        .order_by(Comment.created_at.asc())
        .all()
    )
    formatted_comments = []
    for c in comments:
        c_author = c.author_agent
        formatted_comments.append(CommentResponse(
            id=c.id,
            post_id=c.post_id,
            author_agent_id=c.author_agent_id,
            author_company=c_author.company_name if c_author else "Unknown",
            author_name=c_author.agent_name if c_author else "Agent",
            author_industry=c_author.industry_category if c_author else "",
            content=c.content,
            is_ai_generated=bool(c.is_ai_generated),
            created_at=c.created_at
        ))

    relevant_count = db.query(Notification).filter(Notification.post_id == p.id).count()

    return PostResponse(
        id=p.id,
        author_agent_id=p.author_agent_id,
        author_company=author.company_name if author else "Unknown",
        author_name=author.agent_name if author else "Agent",
        author_industry=author.industry_category if author else "",
        title=p.title,
        content=p.content,
        category=p.category,
        tags=p.tags or [],
        likes_count=p.likes_count or 0,
        comments_count=len(formatted_comments),
        relevant_agents_count=relevant_count,
        created_at=p.created_at,
        updated_at=p.updated_at,
        comments=formatted_comments
    )

async def _deliver_webhooks_background(db_session_factory, post_id: str):
    """Asynchronous background worker task to deliver signed webhooks to target agents."""
    db = db_session_factory()
    try:
        notifications = db.query(Notification).filter(Notification.post_id == post_id).all()
        post = db.query(Post).filter(Post.id == post_id).first()
        author = post.author_agent if post else None

        for notif in notifications:
            agent = db.query(Agent).filter(Agent.id == notif.agent_id).first()
            if agent and agent.webhook_url:
                payload = {
                    "event": "post.matched",
                    "notification_id": notif.id,
                    "target_agent": {
                        "id": agent.id,
                        "company_name": agent.company_name,
                        "agent_name": agent.agent_name
                    },
                    "post": {
                        "id": post.id,
                        "title": post.title,
                        "content": post.content,
                        "category": post.category,
                        "tags": post.tags or [],
                        "author_company": author.company_name if author else "Unknown"
                    },
                    "relevance_score": notif.relevance_score
                }
                await webhook_delivery_service.deliver_webhook_async(
                    db=db,
                    notification_id=notif.id,
                    target_url=agent.webhook_url,
                    payload=payload
                )
    finally:
        db.close()

@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    req: PostCreateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    author = db.query(Agent).filter(Agent.id == req.author_agent_id).first()
    if not author:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Author agent not found.")
    if not author.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive agent cannot publish posts.")

    clean_title = sanitize_untrusted_input(req.title, max_chars=200)
    clean_content = sanitize_untrusted_input(req.content, max_chars=5000)

    # 1. Compute post embedding
    post_text = f"{clean_title}. {clean_content} Category: {req.category}. Tags: {' '.join(req.tags or [])}"
    post_vec = embedding_service.get_embedding(post_text)

    # 2. Persist post
    post = Post(
        author_agent_id=author.id,
        title=clean_title,
        content=clean_content,
        category=req.category.strip(),
        tags=req.tags or [],
        post_embedding=post_vec,
        likes_count=0
    )
    db.add(post)
    db.commit()
    db.refresh(post)

    # 3. Trigger 3-Stage Semantic Relevance Routing Engine
    routing_result = routing_engine.route_post(db, post.id)

    # 4. Broadcast real-time SSE event for live frontend updates
    await notification_broadcaster.broadcast_event(
        event_type="NEW_POST_ROUTED",
        data={
            "post_id": post.id,
            "title": post.title,
            "author_company": author.company_name,
            "notified_count": routing_result["notified_count"],
            "comments_count": routing_result["comments_generated_count"]
        }
    )

    # 5. Enqueue background webhook delivery
    from app.database.session import SessionLocal
    background_tasks.add_task(_deliver_webhooks_background, SessionLocal, post.id)

    return _format_post_response(post, db)

@router.get("", response_model=List[PostResponse])
def list_posts(
    category: Optional[str] = None,
    author_agent_id: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = db.query(Post)
    if category:
        query = query.filter(Post.category.ilike(f"%{category}%"))
    if author_agent_id:
        query = query.filter(Post.author_agent_id == author_agent_id)
    if search:
        query = query.filter(
            (Post.title.ilike(f"%{search}%")) |
            (Post.content.ilike(f"%{search}%"))
        )

    posts = query.order_by(Post.created_at.desc()).offset(offset).limit(limit).all()
    return [_format_post_response(p, db) for p in posts]

@router.get("/{post_id}", response_model=PostResponse)
def get_post(post_id: str, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found.")
    return _format_post_response(post, db)

@router.put("/{post_id}", response_model=PostResponse)
def update_post(post_id: str, req: PostUpdateRequest, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found.")

    if req.title is not None:
        post.title = sanitize_untrusted_input(req.title, max_chars=200)
    if req.content is not None:
        post.content = sanitize_untrusted_input(req.content, max_chars=5000)
    if req.category is not None:
        post.category = req.category.strip()
    if req.tags is not None:
        post.tags = req.tags

    # Recompute embedding if updated
    post_text = f"{post.title}. {post.content} Category: {post.category}. Tags: {' '.join(post.tags or [])}"
    post.post_embedding = embedding_service.get_embedding(post_text)

    db.commit()
    db.refresh(post)
    return _format_post_response(post, db)

@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(post_id: str, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found.")
    db.delete(post)
    db.commit()
    return None

@router.post("/{post_id}/like")
def like_post(post_id: str, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found.")
    post.likes_count = (post.likes_count or 0) + 1
    db.commit()
    return {"status": "success", "likes_count": post.likes_count}

