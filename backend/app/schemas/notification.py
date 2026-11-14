from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    agent_id: str
    target_company: Optional[str] = None
    target_agent_name: Optional[str] = None
    post_id: str
    post_title: Optional[str] = None
    author_company: Optional[str] = None
    relevance_score: float
    status: str
    created_at: datetime
    delivered_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
