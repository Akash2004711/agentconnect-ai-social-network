from typing import List, Dict, Any, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models.agent import Agent, AgentPreference, Subscription
from app.models.post import Post, Comment
from app.models.notification import Notification, RoutingLog, EngagementEvent
from app.database.vector_type import cosine_similarity
from app.core.config import settings
from app.routing.evaluator import (
    get_industry_synergy,
    calculate_keyword_overlap,
    evaluate_negative_penalties,
    build_explainable_reason
)
from app.services.llm import llm_service

class RoutingEngine:
    def __init__(self):
        self.default_threshold = settings.ROUTING_DEFAULT_THRESHOLD
        self.top_k = settings.ROUTING_TOP_K

    def route_post(self, db: Session, post_id: str) -> Dict[str, Any]:
        """
        Executes the three-stage semantic relevance routing pipeline for a published post.
        Returns a detailed summary of routing results, matched agents, decisions, and comments.
        """
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            raise ValueError(f"Post with ID {post_id} not found.")

        author_agent = db.query(Agent).filter(Agent.id == post.author_agent_id).first()
        author_company = author_agent.company_name if author_agent else "Unknown"
        author_industry = author_agent.industry_category if author_agent else "General"

        full_post_text = f"{post.title} {post.content} {' '.join(post.tags or [])}"

        # -------------------------------------------------------------
        # STAGE A: SQL METADATA FILTERING
        # -------------------------------------------------------------
        all_agents = db.query(Agent).all()
        stage_a_passed_agents: List[Agent] = []
        filtered_out_logs: List[RoutingLog] = []

        for agent in all_agents:
            # 1. Author exclusion
            if agent.id == post.author_agent_id:
                continue

            # 2. Inactive agent exclusion
            if not agent.is_active:
                log = RoutingLog(
                    post_id=post.id,
                    target_agent_id=agent.id,
                    vector_score=0.0,
                    rerank_score=0.0,
                    status="FILTERED_OUT",
                    match_reason=f"Agent {agent.agent_name} ({agent.company_name}) is currently inactive.",
                    breakdown={"stage": "STAGE_A", "filter_reason": "INACTIVE_AGENT"}
                )
                filtered_out_logs.append(log)
                continue

            # 3. Preference checks
            prefs = agent.preferences
            if prefs:
                # Opted out of notifications
                if prefs.notifications_opt_out:
                    log = RoutingLog(
                        post_id=post.id,
                        target_agent_id=agent.id,
                        vector_score=0.0,
                        rerank_score=0.0,
                        status="FILTERED_OUT",
                        match_reason=f"{agent.company_name} has opted out of platform notifications.",
                        breakdown={"stage": "STAGE_A", "filter_reason": "NOTIFICATIONS_OPT_OUT"}
                    )
                    filtered_out_logs.append(log)
                    continue

                # Blocked company check
                blocked_companies = [c.lower() for c in (prefs.blocked_companies or [])]
                if author_company.lower() in blocked_companies:
                    log = RoutingLog(
                        post_id=post.id,
                        target_agent_id=agent.id,
                        vector_score=0.0,
                        rerank_score=0.0,
                        status="FILTERED_OUT",
                        match_reason=f"Publishing company '{author_company}' is in {agent.company_name}'s blocked companies list.",
                        breakdown={"stage": "STAGE_A", "filter_reason": "BLOCKED_COMPANY"}
                    )
                    filtered_out_logs.append(log)
                    continue

                # Blocked industry check
                blocked_industries = [i.lower() for i in (prefs.blocked_industries or [])]
                if author_industry.lower() in blocked_industries or post.category.lower() in blocked_industries:
                    log = RoutingLog(
                        post_id=post.id,
                        target_agent_id=agent.id,
                        vector_score=0.0,
                        rerank_score=0.0,
                        status="FILTERED_OUT",
                        match_reason=f"Industry category '{post.category}' is in {agent.company_name}'s blocked industries list.",
                        breakdown={"stage": "STAGE_A", "filter_reason": "BLOCKED_INDUSTRY"}
                    )
                    filtered_out_logs.append(log)
                    continue

            # 4. Subscription check for category
            cat_sub = db.query(Subscription).filter(
                Subscription.agent_id == agent.id,
                Subscription.category == post.category
            ).first()
            if cat_sub and not cat_sub.is_allowed:
                log = RoutingLog(
                    post_id=post.id,
                    target_agent_id=agent.id,
                    vector_score=0.0,
                    rerank_score=0.0,
                    status="FILTERED_OUT",
                    match_reason=f"{agent.company_name} subscription preferences disallow category '{post.category}'.",
                    breakdown={"stage": "STAGE_A", "filter_reason": "DISALLOWED_SUBSCRIPTION_CATEGORY"}
                )
                filtered_out_logs.append(log)
                continue

            stage_a_passed_agents.append(agent)

        for log in filtered_out_logs:
            db.add(log)

        # -------------------------------------------------------------
        # STAGE B: SEMANTIC VECTOR SEARCH
        # -------------------------------------------------------------
        post_embedding = post.post_embedding or []
        candidates_with_vector_score: List[Tuple[Agent, float]] = []

        for agent in stage_a_passed_agents:
            agent_embedding = agent.interest_embedding or []
            v_score = cosine_similarity(post_embedding, agent_embedding)
            candidates_with_vector_score.append((agent, v_score))

        # Sort by vector similarity descending and take top K
        candidates_with_vector_score.sort(key=lambda x: x[1], reverse=True)
        top_candidates = candidates_with_vector_score[:self.top_k]

        # -------------------------------------------------------------
        # STAGE C: RELEVANCE RERANKING
        # -------------------------------------------------------------
        matched_results = []
        notifications_created = []
        auto_comments_created = []

        for agent, v_score in top_candidates:
            prefs = agent.preferences
            declared_keywords = (prefs.interest_keywords if prefs else []) or []
            negative_keywords = (prefs.negative_keywords if prefs else []) or []
            threshold = (prefs.min_relevance_threshold if prefs else None) or self.default_threshold

            # Multi-factor components
            kw_score, matched_kws = calculate_keyword_overlap(full_post_text, declared_keywords)
            ind_synergy = get_industry_synergy(author_industry, agent.industry_category)
            neg_penalty, matched_negs = evaluate_negative_penalties(full_post_text, negative_keywords)

            # Historical engagement rate calculation
            past_notifs = db.query(Notification).filter(Notification.agent_id == agent.id).count()
            past_opened = db.query(Notification).filter(
                Notification.agent_id == agent.id,
                Notification.status.in_(["Read", "Delivered"])
            ).count()
            engagement_rate = (past_opened / past_notifs) if past_notifs > 0 else 0.5
            engagement_boost = (engagement_rate - 0.5) * 0.10  # -0.05 to +0.05

            # Final composite score formulation:
            # 40% vector similarity + 35% keyword overlap + 25% industry synergy - negative penalties
            raw_rerank = (
                (v_score * 0.40) +
                (kw_score * 0.35) +
                (ind_synergy * 0.25) -
                neg_penalty
            )
            final_relevance_score = max(0.0, min(1.0, float(raw_rerank)))

            decision = "NOTIFY" if final_relevance_score >= threshold else "DO_NOT_NOTIFY"

            reason = build_explainable_reason(
                agent_name=agent.agent_name,
                company_name=agent.company_name,
                decision=decision,
                vector_score=v_score,
                final_score=final_relevance_score,
                threshold=threshold,
                matched_keywords=matched_kws,
                matched_negatives=matched_negs,
                industry_synergy=ind_synergy,
                post_title=post.title
            )

            breakdown = {
                "stage": "STAGE_C",
                "vector_score": round(v_score, 4),
                "keyword_score": round(kw_score, 4),
                "matched_keywords": matched_kws,
                "industry_synergy": round(ind_synergy, 4),
                "author_industry": author_industry,
                "agent_industry": agent.industry_category,
                "engagement_rate": round(engagement_rate, 4),
                "negative_penalty": round(neg_penalty, 4),
                "matched_negatives": matched_negs,
                "threshold": threshold,
                "final_score": round(final_relevance_score, 4)
            }

            routing_log = RoutingLog(
                post_id=post.id,
                target_agent_id=agent.id,
                vector_score=v_score,
                rerank_score=final_relevance_score,
                status=decision,
                match_reason=reason,
                breakdown=breakdown
            )
            db.add(routing_log)

            match_entry = {
                "agent_id": agent.id,
                "agent_name": agent.agent_name,
                "company_name": agent.company_name,
                "industry": agent.industry_category,
                "vector_score": round(v_score, 4),
                "relevance_score": round(final_relevance_score, 4),
                "decision": decision,
                "reason": reason,
                "breakdown": breakdown
            }
            matched_results.append(match_entry)

            # If NOTIFY: Create Notification
            if decision == "NOTIFY":
                notification = Notification(
                    agent_id=agent.id,
                    post_id=post.id,
                    relevance_score=final_relevance_score,
                    status="Delivered",  # in-app delivery
                    delivered_at=datetime.utcnow()
                )
                db.add(notification)
                db.flush()  # assign ID

                notifications_created.append({
                    "notification_id": notification.id,
                    "agent_id": agent.id,
                    "company_name": agent.company_name,
                    "relevance_score": round(final_relevance_score, 4)
                })

                # Record engagement notification event
                event = EngagementEvent(
                    agent_id=agent.id,
                    post_id=post.id,
                    event_type="NOTIFIED"
                )
                db.add(event)

                # Check Autonomous AI Response
                agent_dict = {
                    "id": agent.id,
                    "agent_name": agent.agent_name,
                    "company_name": agent.company_name,
                    "industry_category": agent.industry_category,
                    "interest_manifesto": agent.interest_manifesto,
                    "auto_reply_enabled": agent.auto_reply_enabled
                }
                post_dict = {
                    "id": post.id,
                    "title": post.title,
                    "content": post.content,
                    "category": post.category,
                    "author_company": author_company
                }

                should_reply, reply_reason = llm_service.should_generate_response(
                    agent_dict, post_dict, final_relevance_score
                )
                if should_reply:
                    comment_text = llm_service.generate_agent_response(
                        agent_dict, post_dict, final_relevance_score
                    )
                    if comment_text:
                        comment = Comment(
                            post_id=post.id,
                            author_agent_id=agent.id,
                            content=comment_text,
                            is_ai_generated=1
                        )
                        db.add(comment)
                        auto_comments_created.append({
                            "author_company": agent.company_name,
                            "agent_name": agent.agent_name,
                            "comment": comment_text
                        })

                        # Record comment engagement event
                        cmt_event = EngagementEvent(
                            agent_id=agent.id,
                            post_id=post.id,
                            event_type="COMMENTED"
                        )
                        db.add(cmt_event)

        db.commit()

        return {
            "post_id": post.id,
            "title": post.title,
            "author_company": author_company,
            "total_evaluated": len(all_agents),
            "stage_a_passed": len(stage_a_passed_agents),
            "stage_b_candidates": len(top_candidates),
            "notified_count": len(notifications_created),
            "comments_generated_count": len(auto_comments_created),
            "matches": matched_results,
            "notifications": notifications_created,
            "comments": auto_comments_created
        }

routing_engine = RoutingEngine()
