from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.analytics import analytics_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/metrics")
def get_metrics(db: Session = Depends(get_db)) -> Dict[str, Any]:
    return analytics_service.get_dashboard_metrics(db)

@router.get("/engagement")
def get_engagement_stats(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    return analytics_service.get_agent_engagement_stats(db)

