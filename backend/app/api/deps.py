from typing import Optional
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.security import decode_access_token, hash_api_key
from app.models.user import User
from app.models.agent import Agent, AgentAPICredential

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

def get_current_user(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme)
) -> Optional[User]:
    """Validates JWT bearer token for dashboard users."""
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication credentials."
        )
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive."
        )
    return user

def require_current_user(user: Optional[User] = Depends(get_current_user)) -> User:
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required."
        )
    return user

def get_current_agent(
    x_agent_api_key: Optional[str] = Header(None, alias="X-Agent-API-Key"),
    db: Session = Depends(get_db)
) -> Optional[Agent]:
    """Validates X-Agent-API-Key header for agent-authenticated API calls."""
    if not x_agent_api_key:
        return None
    hashed = hash_api_key(x_agent_api_key)
    cred = db.query(AgentAPICredential).filter(
        AgentAPICredential.hashed_api_key == hashed,
        AgentAPICredential.is_active == True
    ).first()
    if not cred:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Agent API Key."
        )
    agent = db.query(Agent).filter(Agent.id == cred.agent_id).first()
    if not agent or not agent.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Agent is inactive or deleted."
        )
    return agent

