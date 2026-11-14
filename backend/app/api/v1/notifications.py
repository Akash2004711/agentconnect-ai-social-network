import json
import asyncio
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.notification import Notification, EngagementEvent
from app.models.agent import Agent
from app.models.post import Post
from app.schemas.notification import NotificationResponse
from app.services.notification import notification_broadcaster

router = APIRouter(tags=["Notifications"])

def _format_notification_response(n: Notification, db: Session) -> NotificationResponse:
    target_agent = n.agent
    post = n.post
    author = post.author_agent if post else None

    return NotificationResponse(
        id=n.id,
        agent_id=n.agent_id,
        target_company=target_agent.company_name if target_agent else "Unknown",
        target_agent_name=target_agent.agent_name if target_agent else "Agent",
        post_id=n.post_id,
        post_title=post.title if post else "Untitled Post",
        author_company=author.company_name if author else "Unknown",
        relevance_score=round(n.relevance_score, 4),
        status=n.status,
        created_at=n.created_at,
        delivered_at=n.delivered_at,
        read_at=n.read_at
    )

@router.get("/notifications", response_model=List[NotificationResponse])
def list_all_notifications(
    status_filter: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(Notification)
    if status_filter:
        query = query.filter(Notification.status == status_filter)
    notifs = query.order_by(Notification.created_at.desc()).limit(limit).all()
    return [_format_notification_response(n, db) for n in notifs]

@router.get("/agents/{agent_id}/notifications", response_model=List[NotificationResponse])
def list_agent_notifications(agent_id: str, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found.")
    notifs = (
        db.query(Notification)
        .filter(Notification.agent_id == agent_id)
        .order_by(Notification.created_at.desc())
        .all()
    )
    return [_format_notification_response(n, db) for n in notifs]

@router.post("/notifications/{id}/read", response_model=NotificationResponse)
def mark_notification_as_read(id: str, db: Session = Depends(get_db)):
    notif = db.query(Notification).filter(Notification.id == id).first()
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")

    notif.status = "Read"
    notif.read_at = datetime.utcnow()

    # Log engagement event
    event = EngagementEvent(
        agent_id=notif.agent_id,
        post_id=notif.post_id,
        event_type="OPENED"
    )
    db.add(event)
    db.commit()
    db.refresh(notif)
    return _format_notification_response(notif, db)

@router.get("/notifications/stream")
async def stream_notifications(request: Request):
    """
    Server-Sent Events (SSE) streaming endpoint for real-time frontend notification pushes.
    """
    queue = await notification_broadcaster.subscribe()

    async def event_generator():
        try:
            # Send initial keepalive
            yield f"event: ping\ndata: {json.dumps({'status': 'connected'})}\n\n"
            while True:
                if await request.is_disconnected():
                    break
                try:
                    payload = await asyncio.wait_for(queue.get(), timeout=20.0)
                    yield f"event: {payload['event']}\ndata: {json.dumps(payload)}\n\n"
                except asyncio.TimeoutError:
                    yield f"event: ping\ndata: {json.dumps({'status': 'heartbeat'})}\n\n"
        finally:
            notification_broadcaster.unsubscribe(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

