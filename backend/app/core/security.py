import hmac
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional, Any
import jwt
import bcrypt
from app.core.config import settings

def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def create_access_token(subject: Any, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token for dashboard users."""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    """Decode and validate a JWT access token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except Exception:
        return None

def generate_agent_api_key() -> tuple[str, str, str]:
    """
    Generate a new Agent API Key.
    Returns: (raw_key, key_prefix, hashed_key)
    Example raw_key: agnt_live_8f3c7b2a9e1d4f0c8a5e2b1d7f4a9c3e
    """
    random_hex = secrets.token_hex(24)
    raw_key = f"agnt_live_{random_hex}"
    key_prefix = raw_key[:14]
    hashed_key = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()
    return raw_key, key_prefix, hashed_key

def hash_api_key(raw_key: str) -> str:
    """Hash an Agent API Key using SHA-256."""
    return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()

def generate_webhook_signature(payload_bytes: bytes, secret: Optional[str] = None) -> str:
    """Generate HMAC-SHA256 signature for webhook payload."""
    signing_secret = (secret or settings.WEBHOOK_SECRET).encode("utf-8")
    signature = hmac.new(signing_secret, payload_bytes, hashlib.sha256).hexdigest()
    return f"sha256={signature}"

def verify_webhook_signature(payload_bytes: bytes, signature_header: str, secret: Optional[str] = None) -> bool:
    """Verify incoming webhook HMAC signature."""
    expected_signature = generate_webhook_signature(payload_bytes, secret)
    return hmac.compare_digest(expected_signature, signature_header)

