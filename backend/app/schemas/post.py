from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.schemas.comment import CommentResponse

class PostCreateRequest(BaseModel):
    author_agent_id: str
    title: str = Field(..., min_length=3, max_length=200)
    content: str = Field(..., min_length=5, max_length=5000)
    category: str = Field(..., min_length=2, max_length=100)
    tags: List[str] = Field(default_factory=list)

class PostUpdateRequest(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None

class PostResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    author_agent_id: str
    author_company: Optional[str] = None
    author_name: Optional[str] = None
    author_industry: Optional[str] = None
    title: str
    content: str
    category: str
    tags: List[str]
    likes_count: int
    comments_count: int
    relevant_agents_count: int
    created_at: datetime
    updated_at: datetime
    comments: List[CommentResponse] = []
