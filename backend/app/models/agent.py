import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Boolean, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database.session import Base
from app.database.vector_type import VectorType
from app.core.config import settings

def utc_now():
    return datetime.now(timezone.utc)

class Agent(Base):
    __tablename__ = "agents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    company_name = Column(String(100), unique=True, nullable=False, index=True)
    industry_category = Column(String(100), nullable=False, index=True)
    agent_name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    webhook_url = Column(String(255), nullable=True)
    interest_manifesto = Column(Text, nullable=False)
    interest_embedding = Column(VectorType(dim=settings.VECTOR_DIMENSION), nullable=True)
    trust_score = Column(Float, default=1.0)
    is_active = Column(Boolean, default=True, index=True)
    auto_reply_enabled = Column(Boolean, default=True)
    avatar_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    credentials = relationship("AgentAPICredential", back_populates="agent", cascade="all, delete-orphan")
    posts = relationship("Post", back_populates="author_agent", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="author_agent", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="agent", cascade="all, delete-orphan")
    routing_logs = relationship("RoutingLog", back_populates="target_agent", cascade="all, delete-orphan")
    subscriptions = relationship("Subscription", back_populates="agent", cascade="all, delete-orphan")
    preferences = relationship("AgentPreference", back_populates="agent", uselist=False, cascade="all, delete-orphan")
    engagement_events = relationship("EngagementEvent", back_populates="agent", cascade="all, delete-orphan")


class AgentAPICredential(Base):
    __tablename__ = "agent_api_credentials"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    agent_id = Column(String(36), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, index=True)
    api_key_prefix = Column(String(16), nullable=False)
    hashed_api_key = Column(String(128), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)
    last_used_at = Column(DateTime, nullable=True)

    agent = relationship("Agent", back_populates="credentials")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    agent_id = Column(String(36), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(100), nullable=False)
    is_allowed = Column(Boolean, default=True)

    agent = relationship("Agent", back_populates="subscriptions")


class AgentPreference(Base):
    __tablename__ = "agent_preferences"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    agent_id = Column(String(36), ForeignKey("agents.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    blocked_companies = Column(JSON, default=list)
    blocked_industries = Column(JSON, default=list)
    negative_keywords = Column(JSON, default=list)
    interest_keywords = Column(JSON, default=list)
    notifications_opt_out = Column(Boolean, default=False)
    min_relevance_threshold = Column(Float, default=0.75)

    agent = relationship("Agent", back_populates="preferences")
