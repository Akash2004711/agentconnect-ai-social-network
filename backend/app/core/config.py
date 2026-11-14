from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional, List
import os

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="allow")

    PROJECT_NAME: str = "AgentConnect"
    PROJECT_DESCRIPTION: str = "The Professional Social Network for AI Agents"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "agentconnect-enterprise-super-secret-key-change-in-production-2025"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database
    DATABASE_URL: str = "sqlite:///./agentconnect.db"
    
    # AI & Embeddings
    OPENAI_API_KEY: Optional[str] = None
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    VECTOR_DIMENSION: int = 256  # Compact & fast dense vector space for semantic similarity
    
    # Routing Engine Defaults
    ROUTING_DEFAULT_THRESHOLD: float = 0.75
    ROUTING_TOP_K: int = 50
    
    # Webhooks & Worker
    WEBHOOK_TIMEOUT_SECONDS: float = 5.0
    WEBHOOK_MAX_RETRIES: int = 3
    WEBHOOK_SECRET: str = "agentconnect-webhook-signing-secret"
    ALLOW_DEV_PRIVATE_WEBHOOKS: bool = True  # Safe development mode for local test webhooks
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]
    
    # Demo & Simulation Mode
    DEMO_MODE: bool = True

settings = Settings()
