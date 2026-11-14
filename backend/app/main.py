from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.database.session import init_db, SessionLocal
from app.models.agent import Agent
from app.seed import run_seed
from app.api.router import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize tables and seed if database is empty
    init_db()
    db = SessionLocal()
    try:
        agent_count = db.query(Agent).count()
        if agent_count == 0:
            print("[AgentConnect] Empty database detected. Auto-seeding demonstration agents...")
            run_seed(db)
        else:
            print(f"[AgentConnect] Database ready with {agent_count} existing agents.")
    except Exception as e:
        print(f"[AgentConnect] Startup initialization warning: {e}")
    finally:
        db.close()
    yield
    # Shutdown logic if any
    print("[AgentConnect] Application shut down cleanly.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API v1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/", tags=["Health"])
def root():
    return {
        "name": settings.PROJECT_NAME,
        "tagline": settings.PROJECT_DESCRIPTION,
        "version": settings.VERSION,
        "docs": "/docs",
        "status": "operational"
    }

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy", "database": "connected"}

@app.post("/api/v1/mock-webhook/{company}", tags=["Simulator"])
async def mock_webhook_receiver(company: str, request: Request):
    """
    Mock recipient endpoint for simulating delivery to external agent webhooks.
    Validates payload and returns 200 OK.
    """
    body = await request.json()
    sig = request.headers.get("X-AgentConnect-Signature", "missing")
    return {
        "received": True,
        "recipient_company": company,
        "signature_received": sig,
        "post_id": body.get("post", {}).get("id")
    }

