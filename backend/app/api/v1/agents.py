from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.agent import Agent, AgentAPICredential, AgentPreference, Subscription
from app.schemas.agent import (
    AgentRegisterRequest,
    AgentUpdateRequest,
    AgentResponse,
    AgentRegistrationResponse
)
from app.core.security import generate_agent_api_key
from app.services.embedding import embedding_service
from app.security.ssrf_guard import is_safe_webhook_url

router = APIRouter(prefix="/agents", tags=["Agents"])

@router.post("/register", response_model=AgentRegistrationResponse, status_code=status.HTTP_201_CREATED)
def register_agent(req: AgentRegisterRequest, db: Session = Depends(get_db)):
    # 1. Prevent duplicate company registrations
    existing = db.query(Agent).filter(Agent.company_name.ilike(req.company_name.strip())).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An agent for company '{req.company_name}' is already registered."
        )

    # 2. SSRF check on webhook_url if provided
    if req.webhook_url:
        is_safe, msg = is_safe_webhook_url(req.webhook_url)
        if not is_safe:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid webhook URL: {msg}"
            )

    # 3. Generate dense semantic embedding for agent's manifesto & profile
    combined_profile_text = f"{req.company_name} {req.industry_category}. {req.interest_manifesto} {' '.join(req.interest_keywords)}"
    interest_vec = embedding_service.get_embedding(combined_profile_text)

    # 4. Create Agent entity
    agent = Agent(
        company_name=req.company_name.strip(),
        industry_category=req.industry_category.strip(),
        agent_name=req.agent_name.strip(),
        description=req.description,
        webhook_url=req.webhook_url,
        interest_manifesto=req.interest_manifesto.strip(),
        interest_embedding=interest_vec,
        trust_score=1.0,
        is_active=True,
        auto_reply_enabled=req.auto_reply_enabled
    )
    db.add(agent)
    db.flush()

    # 5. Create Preferences
    prefs = AgentPreference(
        agent_id=agent.id,
        blocked_companies=req.blocked_companies or [],
        blocked_industries=req.blocked_industries or [],
        negative_keywords=req.negative_keywords or [],
        interest_keywords=req.interest_keywords or [],
        min_relevance_threshold=req.min_relevance_threshold,
        notifications_opt_out=False
    )
    db.add(prefs)

    # 6. Create Subscriptions
    for cat in (req.preferred_categories or []):
        sub = Subscription(agent_id=agent.id, category=cat, is_allowed=True)
        db.add(sub)

    # 7. Generate secure API key
    raw_api_key, prefix, hashed_key = generate_agent_api_key()
    cred = AgentAPICredential(
        agent_id=agent.id,
        api_key_prefix=prefix,
        hashed_api_key=hashed_key,
        is_active=True
    )
    db.add(cred)
    db.commit()
    db.refresh(agent)

    # Format response
    pref_dict = {
        "interest_keywords": prefs.interest_keywords,
        "blocked_companies": prefs.blocked_companies,
        "blocked_industries": prefs.blocked_industries,
        "negative_keywords": prefs.negative_keywords,
        "min_relevance_threshold": prefs.min_relevance_threshold,
        "notifications_opt_out": prefs.notifications_opt_out
    }

    return AgentRegistrationResponse(
        id=agent.id,
        company_name=agent.company_name,
        industry_category=agent.industry_category,
        agent_name=agent.agent_name,
        description=agent.description,
        webhook_url=agent.webhook_url,
        interest_manifesto=agent.interest_manifesto,
        trust_score=agent.trust_score,
        is_active=agent.is_active,
        auto_reply_enabled=agent.auto_reply_enabled,
        preferences=pref_dict,
        created_at=agent.created_at,
        updated_at=agent.updated_at,
        api_key=raw_api_key
    )

@router.get("", response_model=List[AgentResponse])
def list_agents(
    is_active: Optional[bool] = None,
    industry: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Agent)
    if is_active is not None:
        query = query.filter(Agent.is_active == is_active)
    if industry:
        query = query.filter(Agent.industry_category.ilike(f"%{industry}%"))
    if search:
        query = query.filter(
            (Agent.company_name.ilike(f"%{search}%")) |
            (Agent.agent_name.ilike(f"%{search}%")) |
            (Agent.interest_manifesto.ilike(f"%{search}%"))
        )

    agents = query.order_by(Agent.created_at.desc()).all()
    results = []
    for a in agents:
        pref = a.preferences
        pref_dict = {
            "interest_keywords": pref.interest_keywords if pref else [],
            "blocked_companies": pref.blocked_companies if pref else [],
            "blocked_industries": pref.blocked_industries if pref else [],
            "negative_keywords": pref.negative_keywords if pref else [],
            "min_relevance_threshold": pref.min_relevance_threshold if pref else 0.75,
            "notifications_opt_out": pref.notifications_opt_out if pref else False
        } if pref else None

        results.append(AgentResponse(
            id=a.id,
            company_name=a.company_name,
            industry_category=a.industry_category,
            agent_name=a.agent_name,
            description=a.description,
            webhook_url=a.webhook_url,
            interest_manifesto=a.interest_manifesto,
            trust_score=a.trust_score,
            is_active=a.is_active,
            auto_reply_enabled=a.auto_reply_enabled,
            preferences=pref_dict,
            created_at=a.created_at,
            updated_at=a.updated_at
        ))
    return results

@router.get("/{agent_id}", response_model=AgentResponse)
def get_agent(agent_id: str, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found.")
    pref = agent.preferences
    pref_dict = {
        "interest_keywords": pref.interest_keywords if pref else [],
        "blocked_companies": pref.blocked_companies if pref else [],
        "blocked_industries": pref.blocked_industries if pref else [],
        "negative_keywords": pref.negative_keywords if pref else [],
        "min_relevance_threshold": pref.min_relevance_threshold if pref else 0.75,
        "notifications_opt_out": pref.notifications_opt_out if pref else False
    } if pref else None

    return AgentResponse(
        id=agent.id,
        company_name=agent.company_name,
        industry_category=agent.industry_category,
        agent_name=agent.agent_name,
        description=agent.description,
        webhook_url=agent.webhook_url,
        interest_manifesto=agent.interest_manifesto,
        trust_score=agent.trust_score,
        is_active=agent.is_active,
        auto_reply_enabled=agent.auto_reply_enabled,
        preferences=pref_dict,
        created_at=agent.created_at,
        updated_at=agent.updated_at
    )

@router.put("/{agent_id}", response_model=AgentResponse)
def update_agent(agent_id: str, req: AgentUpdateRequest, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found.")

    manifesto_changed = False
    if req.agent_name is not None:
        agent.agent_name = req.agent_name.strip()
    if req.description is not None:
        agent.description = req.description
    if req.interest_manifesto is not None:
        agent.interest_manifesto = req.interest_manifesto.strip()
        manifesto_changed = True
    if req.webhook_url is not None:
        if req.webhook_url:
            is_safe, msg = is_safe_webhook_url(req.webhook_url)
            if not is_safe:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)
        agent.webhook_url = req.webhook_url
    if req.auto_reply_enabled is not None:
        agent.auto_reply_enabled = req.auto_reply_enabled

    # Preferences update
    prefs = agent.preferences
    if not prefs:
        prefs = AgentPreference(agent_id=agent.id)
        db.add(prefs)

    if req.interest_keywords is not None:
        prefs.interest_keywords = req.interest_keywords
        manifesto_changed = True
    if req.blocked_companies is not None:
        prefs.blocked_companies = req.blocked_companies
    if req.blocked_industries is not None:
        prefs.blocked_industries = req.blocked_industries
    if req.negative_keywords is not None:
        prefs.negative_keywords = req.negative_keywords
    if req.notifications_opt_out is not None:
        prefs.notifications_opt_out = req.notifications_opt_out
    if req.min_relevance_threshold is not None:
        prefs.min_relevance_threshold = req.min_relevance_threshold

    # Recalculate embedding if manifesto or keywords changed
    if manifesto_changed:
        text_to_embed = f"{agent.company_name} {agent.industry_category}. {agent.interest_manifesto} {' '.join(prefs.interest_keywords or [])}"
        agent.interest_embedding = embedding_service.get_embedding(text_to_embed)

    db.commit()
    db.refresh(agent)
    return get_agent(agent.id, db)

@router.delete("/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_agent(agent_id: str, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found.")
    db.delete(agent)
    db.commit()
    return None

@router.post("/{agent_id}/activate", response_model=AgentResponse)
def activate_agent(agent_id: str, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found.")
    agent.is_active = True
    db.commit()
    return get_agent(agent_id, db)

@router.post("/{agent_id}/deactivate", response_model=AgentResponse)
def deactivate_agent(agent_id: str, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found.")
    agent.is_active = False
    db.commit()
    return get_agent(agent_id, db)

