from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.agent import Agent
from app.models.post import Post, Comment
from app.services.embedding import embedding_service
from app.routing.evaluator import (
    get_industry_synergy,
    calculate_keyword_overlap,
    evaluate_negative_penalties,
    build_explainable_reason
)
from app.database.vector_type import cosine_similarity
from app.services.llm import llm_service
from app.core.config import settings

router = APIRouter(prefix="/simulator", tags=["Simulator"])

class SimulationRequest(BaseModel):
    author_agent_id: str
    title: str = Field(..., json_schema_extra={"example": "Get 5% off on all food deliveries during Diwali."})
    content: str = Field(..., json_schema_extra={"example": "Celebrate this festive season with Swiggy! Enjoy flat 5% off on all restaurant orders above ₹299 across India."})
    category: str = Field(..., json_schema_extra={"example": "Food & Hyperlocal"})
    tags: List[str] = Field(default=["diwali", "food-delivery", "festive-offers", "discount"])
    custom_threshold: float = Field(default=0.75, ge=0.0, le=1.0)

@router.post("/simulate")
def run_simulation(req: SimulationRequest, db: Session = Depends(get_db)) -> Dict[str, Any]:
    author = db.query(Agent).filter(Agent.id == req.author_agent_id).first()
    if not author:
        raise HTTPException(status_code=404, detail="Selected author agent not found.")

    post_text = f"{req.title}. {req.content} Category: {req.category}. Tags: {' '.join(req.tags)}"
    post_vec = embedding_service.get_embedding(post_text)

    all_agents = db.query(Agent).all()
    evaluation_results = []

    for target_agent in all_agents:
        if target_agent.id == author.id:
            continue

        # Stage A: Metadata checks
        if not target_agent.is_active:
            evaluation_results.append({
                "agent_id": target_agent.id,
                "agent_name": target_agent.agent_name,
                "company_name": target_agent.company_name,
                "industry": target_agent.industry_category,
                "stage": "STAGE_A_FILTERED",
                "vector_score": 0.0,
                "rerank_score": 0.0,
                "decision": "FILTERED_OUT",
                "reason": f"Agent {target_agent.agent_name} is inactive.",
                "comment_preview": None
            })
            continue

        prefs = target_agent.preferences
        if prefs and prefs.notifications_opt_out:
            evaluation_results.append({
                "agent_id": target_agent.id,
                "agent_name": target_agent.agent_name,
                "company_name": target_agent.company_name,
                "industry": target_agent.industry_category,
                "stage": "STAGE_A_FILTERED",
                "vector_score": 0.0,
                "rerank_score": 0.0,
                "decision": "FILTERED_OUT",
                "reason": f"{target_agent.company_name} has opted out of notifications.",
                "comment_preview": None
            })
            continue

        # Stage B: Vector search
        v_score = cosine_similarity(post_vec, target_agent.interest_embedding or [])

        # Stage C: Reranking
        declared_kws = (prefs.interest_keywords if prefs else []) or []
        neg_kws = (prefs.negative_keywords if prefs else []) or []
        threshold = req.custom_threshold or (prefs.min_relevance_threshold if prefs else 0.75)

        kw_score, matched_kws = calculate_keyword_overlap(post_text, declared_kws)
        ind_synergy = get_industry_synergy(author.industry_category, target_agent.industry_category)
        neg_penalty, matched_negs = evaluate_negative_penalties(post_text, neg_kws)

        raw_score = (v_score * 0.40) + (kw_score * 0.35) + (ind_synergy * 0.25) - neg_penalty
        final_score = max(0.0, min(1.0, float(raw_score)))

        decision = "NOTIFY" if final_score >= threshold else "DO_NOT_NOTIFY"
        reason = build_explainable_reason(
            agent_name=target_agent.agent_name,
            company_name=target_agent.company_name,
            decision=decision,
            vector_score=v_score,
            final_score=final_score,
            threshold=threshold,
            matched_keywords=matched_kws,
            matched_negatives=matched_negs,
            industry_synergy=ind_synergy,
            post_title=req.title
        )

        comment_preview = None
        if decision == "NOTIFY" and target_agent.auto_reply_enabled:
            agent_dict = {
                "id": target_agent.id,
                "agent_name": target_agent.agent_name,
                "company_name": target_agent.company_name,
                "industry_category": target_agent.industry_category,
                "interest_manifesto": target_agent.interest_manifesto,
                "auto_reply_enabled": target_agent.auto_reply_enabled
            }
            post_dict = {
                "id": "sim-post-id",
                "title": req.title,
                "content": req.content,
                "category": req.category,
                "author_company": author.company_name
            }
            comment_preview = llm_service.generate_agent_response(agent_dict, post_dict, final_score)

        evaluation_results.append({
            "agent_id": target_agent.id,
            "agent_name": target_agent.agent_name,
            "company_name": target_agent.company_name,
            "industry": target_agent.industry_category,
            "stage": "STAGE_C_EVALUATED",
            "vector_score": round(v_score, 4),
            "rerank_score": round(final_score, 4),
            "threshold": threshold,
            "decision": decision,
            "reason": reason,
            "breakdown": {
                "vector_score": round(v_score, 4),
                "keyword_score": round(kw_score, 4),
                "matched_keywords": matched_kws,
                "industry_synergy": round(ind_synergy, 4),
                "negative_penalty": round(neg_penalty, 4)
            },
            "comment_preview": comment_preview
        })

    evaluation_results.sort(key=lambda x: x["rerank_score"], reverse=True)

    return {
        "simulation_title": req.title,
        "author_company": author.company_name,
        "author_industry": author.industry_category,
        "threshold_used": req.custom_threshold,
        "evaluations": evaluation_results
    }

@router.post("/reset-seed")
def reset_seed_data(db: Session = Depends(get_db)):
    """Triggers database re-seed with realistic demo agents and posts."""
    from app.seed import run_seed
    run_seed(db)
    return {"status": "success", "message": "Demo data successfully seeded."}
