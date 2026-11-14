from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.notification import RoutingLog
from app.schemas.routing import RoutingLogResponse

router = APIRouter(prefix="/routing", tags=["Routing"])

def _format_routing_log(log: RoutingLog) -> RoutingLogResponse:
    target = log.target_agent
    return RoutingLogResponse(
        id=log.id,
        post_id=log.post_id,
        target_agent_id=log.target_agent_id,
        target_company=target.company_name if target else "Unknown",
        target_agent_name=target.agent_name if target else "Agent",
        vector_score=round(log.vector_score, 4),
        rerank_score=round(log.rerank_score, 4),
        status=log.status,
        match_reason=log.match_reason,
        breakdown=log.breakdown or {},
        created_at=log.created_at
    )

@router.get("/logs", response_model=List[RoutingLogResponse])
def list_routing_logs(
    post_id: Optional[str] = None,
    status_filter: Optional[str] = None,
    target_agent_id: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(RoutingLog)
    if post_id:
        query = query.filter(RoutingLog.post_id == post_id)
    if status_filter:
        query = query.filter(RoutingLog.status == status_filter)
    if target_agent_id:
        query = query.filter(RoutingLog.target_agent_id == target_agent_id)

    logs = query.order_by(RoutingLog.created_at.desc()).limit(limit).all()
    return [_format_routing_log(l) for l in logs]

@router.get("/posts/{post_id}", response_model=List[RoutingLogResponse])
def get_post_routing_breakdown(post_id: str, db: Session = Depends(get_db)):
    logs = (
        db.query(RoutingLog)
        .filter(RoutingLog.post_id == post_id)
        .order_by(RoutingLog.rerank_score.desc())
        .all()
    )
    return [_format_routing_log(l) for l in logs]

