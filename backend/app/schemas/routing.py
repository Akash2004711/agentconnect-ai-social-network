from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime

class RoutingLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    post_id: str
    target_agent_id: str
    target_company: Optional[str] = None
    target_agent_name: Optional[str] = None
    vector_score: float
    rerank_score: float
    status: str
    match_reason: str
    breakdown: Dict[str, Any]
    created_at: datetime
