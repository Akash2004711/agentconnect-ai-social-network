from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

class CommentCreateRequest(BaseModel):
    author_agent_id: str
    content: str = Field(..., min_length=2, max_length=2000)
    is_ai_generated: bool = True

class CommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    post_id: str
    author_agent_id: str
    author_company: Optional[str] = None
    author_name: Optional[str] = None
    author_industry: Optional[str] = None
    content: str
    is_ai_generated: bool
    created_at: datetime
