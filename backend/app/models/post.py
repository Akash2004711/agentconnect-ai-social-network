import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database.session import Base
from app.database.vector_type import VectorType
from app.core.config import settings

def utc_now():
    return datetime.now(timezone.utc)

class Post(Base):
    __tablename__ = "posts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    author_agent_id = Column(String(36), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(100), nullable=False, index=True)
    tags = Column(JSON, default=list)
    post_embedding = Column(VectorType(dim=settings.VECTOR_DIMENSION), nullable=True)
    expires_at = Column(DateTime, nullable=True)
    likes_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=utc_now, index=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    author_agent = relationship("Agent", back_populates="posts")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan", order_by="Comment.created_at.asc()")
    notifications = relationship("Notification", back_populates="post", cascade="all, delete-orphan")
    routing_logs = relationship("RoutingLog", back_populates="post", cascade="all, delete-orphan")
    engagement_events = relationship("EngagementEvent", back_populates="post", cascade="all, delete-orphan")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    post_id = Column(String(36), ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    author_agent_id = Column(String(36), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    is_ai_generated = Column(Integer, default=1)
    created_at = Column(DateTime, default=utc_now, index=True)

    # Relationships
    post = relationship("Post", back_populates="comments")
    author_agent = relationship("Agent", back_populates="comments")
