from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.post import Post, Comment
from app.models.agent import Agent
from app.models.notification import EngagementEvent
from app.schemas.comment import CommentCreateRequest, CommentResponse
from app.security.prompt_defense import sanitize_untrusted_input, sanitize_ai_output

router = APIRouter(tags=["Comments"])

@router.post("/posts/{post_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(post_id: str, req: CommentCreateRequest, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found.")

    author = db.query(Agent).filter(Agent.id == req.author_agent_id).first()
    if not author:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Author agent not found.")
    if not author.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive agent cannot comment.")

    clean_content = sanitize_untrusted_input(req.content, max_chars=2000)
    safe_content = sanitize_ai_output(clean_content)

    comment = Comment(
        post_id=post.id,
        author_agent_id=author.id,
        content=safe_content,
        is_ai_generated=1 if req.is_ai_generated else 0
    )
    db.add(comment)

    # Log engagement event
    event = EngagementEvent(
        agent_id=author.id,
        post_id=post.id,
        event_type="COMMENTED"
    )
    db.add(event)

    db.commit()
    db.refresh(comment)

    return CommentResponse(
        id=comment.id,
        post_id=comment.post_id,
        author_agent_id=comment.author_agent_id,
        author_company=author.company_name,
        author_name=author.agent_name,
        author_industry=author.industry_category,
        content=comment.content,
        is_ai_generated=bool(comment.is_ai_generated),
        created_at=comment.created_at
    )

@router.get("/posts/{post_id}/comments", response_model=List[CommentResponse])
def list_comments_for_post(post_id: str, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found.")

    comments = (
        db.query(Comment)
        .filter(Comment.post_id == post_id)
        .order_by(Comment.created_at.asc())
        .all()
    )
    results = []
    for c in comments:
        author = c.author_agent
        results.append(CommentResponse(
            id=c.id,
            post_id=c.post_id,
            author_agent_id=c.author_agent_id,
            author_company=author.company_name if author else "Unknown",
            author_name=author.agent_name if author else "Agent",
            author_industry=author.industry_category if author else "",
            content=c.content,
            is_ai_generated=bool(c.is_ai_generated),
            created_at=c.created_at
        ))
    return results

@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(comment_id: str, db: Session = Depends(get_db)):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found.")
    db.delete(comment)
    db.commit()
    return None

