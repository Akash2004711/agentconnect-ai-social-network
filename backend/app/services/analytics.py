from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.agent import Agent
from app.models.post import Post, Comment
from app.models.notification import Notification, RoutingLog, EngagementEvent

class AnalyticsService:
    def get_dashboard_metrics(self, db: Session) -> Dict[str, Any]:
        """Calculates comprehensive platform KPIs from real database persistence."""
        total_agents = db.query(Agent).count()
        active_agents = db.query(Agent).filter(Agent.is_active == True).count()
        total_posts = db.query(Post).count()
        total_notifications = db.query(Notification).count()
        delivered_notifications = db.query(Notification).filter(Notification.status == "Delivered").count()
        read_notifications = db.query(Notification).filter(Notification.status == "Read").count()
        ai_comments = db.query(Comment).filter(Comment.is_ai_generated == 1).count()
        total_comments = db.query(Comment).count()

        # Routing performance
        relevant_matches = db.query(RoutingLog).filter(RoutingLog.status == "NOTIFY").count()
        irrelevant_matches = db.query(RoutingLog).filter(RoutingLog.status.in_(["DO_NOT_NOTIFY", "FILTERED_OUT"])).count()
        total_routing_evals = db.query(RoutingLog).count()

        avg_score_res = db.query(func.avg(RoutingLog.rerank_score)).filter(RoutingLog.status == "NOTIFY").scalar()
        avg_relevance_score = round(float(avg_score_res or 0.0), 3)

        # Engagement rates
        engagement_rate = round((read_notifications / max(1, delivered_notifications)) * 100, 1)

        # Category distribution
        cat_counts = (
            db.query(Post.category, func.count(Post.id))
            .group_by(Post.category)
            .all()
        )
        category_distribution = [{"category": cat, "count": count} for cat, count in cat_counts]

        # Activity summary
        recent_posts = (
            db.query(Post)
            .order_by(Post.created_at.desc())
            .limit(5)
            .all()
        )

        return {
            "total_agents": total_agents,
            "active_agents": active_agents,
            "total_posts": total_posts,
            "total_notifications": total_notifications,
            "delivered_notifications": delivered_notifications,
            "read_notifications": read_notifications,
            "relevant_matches": relevant_matches,
            "irrelevant_matches": irrelevant_matches,
            "total_routing_evaluations": total_routing_evals,
            "ai_generated_comments": ai_comments,
            "total_comments": total_comments,
            "average_relevance_score": avg_relevance_score,
            "engagement_rate_percent": engagement_rate,
            "category_distribution": category_distribution,
        }

    def get_agent_engagement_stats(self, db: Session) -> List[Dict[str, Any]]:
        """Calculates per-agent engagement breakdown."""
        agents = db.query(Agent).all()
        stats = []
        for agent in agents:
            notifs = db.query(Notification).filter(Notification.agent_id == agent.id).count()
            comments = db.query(Comment).filter(Comment.author_agent_id == agent.id).count()
            posts = db.query(Post).filter(Post.author_agent_id == agent.id).count()
            avg_score = db.query(func.avg(RoutingLog.rerank_score)).filter(
                RoutingLog.target_agent_id == agent.id,
                RoutingLog.status == "NOTIFY"
            ).scalar()

            stats.append({
                "agent_id": agent.id,
                "agent_name": agent.agent_name,
                "company_name": agent.company_name,
                "industry": agent.industry_category,
                "is_active": agent.is_active,
                "posts_count": posts,
                "notifications_received": notifs,
                "comments_posted": comments,
                "avg_matched_score": round(float(avg_score or 0.0), 3)
            })
        return stats

analytics_service = AnalyticsService()

