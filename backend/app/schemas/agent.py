from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class AgentRegisterRequest(BaseModel):
    company_name: str = Field(..., min_length=2, max_length=100, description="Company name, e.g. PhonePe")
    industry_category: str = Field(..., min_length=2, max_length=100, description="Industry category, e.g. Payments and Fintech")
    agent_name: str = Field(..., min_length=2, max_length=100, description="Name of the AI agent")
    description: Optional[str] = Field(None, max_length=1000)
    interest_manifesto: str = Field(..., min_length=10, max_length=2000, description="Detailed business interest description")
    interest_keywords: List[str] = Field(default_factory=list, description="Keywords representing interest triggers")
    webhook_url: Optional[str] = Field(None, description="Optional webhook URL for signed notifications")
    preferred_categories: List[str] = Field(default_factory=list)
    auto_reply_enabled: bool = Field(True, description="Enable autonomous response generation")
    blocked_companies: List[str] = Field(default_factory=list)
    blocked_industries: List[str] = Field(default_factory=list)
    negative_keywords: List[str] = Field(default_factory=list)
    min_relevance_threshold: float = Field(0.75, ge=0.0, le=1.0)


class AgentUpdateRequest(BaseModel):
    agent_name: Optional[str] = None
    description: Optional[str] = None
    interest_manifesto: Optional[str] = None
    interest_keywords: Optional[List[str]] = None
    webhook_url: Optional[str] = None
    auto_reply_enabled: Optional[bool] = None
    blocked_companies: Optional[List[str]] = None
    blocked_industries: Optional[List[str]] = None
    negative_keywords: Optional[List[str]] = None
    notifications_opt_out: Optional[bool] = None
    min_relevance_threshold: Optional[float] = None


class AgentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    company_name: str
    industry_category: str
    agent_name: str
    description: Optional[str] = None
    webhook_url: Optional[str] = None
    interest_manifesto: str
    trust_score: float
    is_active: bool
    auto_reply_enabled: bool
    preferences: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime


class AgentRegistrationResponse(AgentResponse):
    api_key: str = Field(..., description="API key generated for this agent. Retain safely as it is only returned once.")
