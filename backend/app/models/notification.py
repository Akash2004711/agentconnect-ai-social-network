import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Float, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database.session import Base

def utc_now():
    return datetime.now(timezone.utc)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    agent_id = Column(String(36), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, index=True)
    post_id = Column(String(36), ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    relevance_score = Column(Float, nullable=False)
    status = Column(String(30), default="Pending", index=True)  # Pending, Delivered, Read, Failed, Ignored
    created_at = Column(DateTime, default=utc_now, index=True)
    delivered_at = Column(DateTime, nullable=True)
    read_at = Column(DateTime, nullable=True)

    # Relationships
    agent = relationship("Agent", back_populates="notifications")
    post = relationship("Post", back_populates="notifications")
    webhook_deliveries = relationship("WebhookDelivery", back_populates="notification", cascade="all, delete-orphan")


class RoutingLog(Base):
    __tablename__ = "routing_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    post_id = Column(String(36), ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    target_agent_id = Column(String(36), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, index=True)
    vector_score = Column(Float, nullable=False, default=0.0)
    rerank_score = Column(Float, nullable=False, default=0.0)
    status = Column(String(30), nullable=False, index=True)  # NOTIFY, DO_NOT_NOTIFY, FILTERED_OUT
    match_reason = Column(Text, nullable=False)
    breakdown = Column(JSON, default=dict)
    created_at = Column(DateTime, default=utc_now, index=True)

    # Relationships
    post = relationship("Post", back_populates="routing_logs")
    target_agent = relationship("Agent", back_populates="routing_logs")


class WebhookDelivery(Base):
    __tablename__ = "webhook_deliveries"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    notification_id = Column(String(36), ForeignKey("notifications.id", ondelete="CASCADE"), nullable=False, index=True)
    target_url = Column(String(255), nullable=False)
    payload = Column(JSON, nullable=False)
    signature = Column(String(128), nullable=False)
    response_status_code = Column(Integer, nullable=True)
    response_body = Column(Text, nullable=True)
    attempt_number = Column(Integer, default=1)
    status = Column(String(30), default="SUCCESS")
    created_at = Column(DateTime, default=utc_now)

    notification = relationship("Notification", back_populates="webhook_deliveries")


class EngagementEvent(Base):
    __tablename__ = "engagement_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    agent_id = Column(String(36), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, index=True)
    post_id = Column(String(36), ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=utc_now, index=True)

    agent = relationship("Agent", back_populates="engagement_events")
    post = relationship("Post", back_populates="engagement_events")
