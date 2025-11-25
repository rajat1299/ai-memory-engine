"""
API authentication utilities.
Enforces per-user API key checks using stored hashes.
"""
import hashlib
import secrets
import time
from uuid import UUID
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import User
from app.config import settings
import redis.asyncio as aioredis

_rate_limiter_client: aioredis.Redis | None = None


async def _get_rate_limiter() -> aioredis.Redis:
    global _rate_limiter_client
    if _rate_limiter_client is None:
        _rate_limiter_client = aioredis.from_url(str(settings.REDIS_URL))
    return _rate_limiter_client

API_KEY_HEADER = "X-API-Key"


def hash_api_key(api_key: str) -> str:
    """Hash an API key using SHA-256 for storage/compare."""
    return hashlib.sha256(api_key.encode("utf-8")).hexdigest()


async def ensure_user_authorized(user_id: UUID, api_key: str | None, db: AsyncSession) -> User:
    """
    Verify that the provided API key matches the user. Raises HTTP errors on failure.
    """
    if not api_key:
        raise HTTPException(status_code=401, detail="Missing API key")
    
    hashed = hash_api_key(api_key)
    stmt = select(User).where(User.id == user_id, User.api_key_hash == hashed)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        # Avoid timing attacks by always running a constant-time compare
        secrets.compare_digest(hashed, hashed)
        raise HTTPException(status_code=403, detail="Invalid API key")
    
    await _enforce_rate_limit(hashed)
    
    return user


async def _enforce_rate_limit(api_key_hash: str):
    """
    Fixed-window rate limit per API key hash.
    """
    limit = settings.RATE_LIMIT_REQUESTS_PER_MIN
    if limit <= 0:
        return
    redis = await _get_rate_limiter()
    epoch_minute = int(time.time() // 60)
    key = f"rl:{api_key_hash}:{epoch_minute}"
    current = await redis.incr(key)
    if current == 1:
        await redis.expire(key, 90)
    if current > limit:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")


def generate_api_key() -> str:
    """Generate a new API key string."""
    return "memori_" + secrets.token_urlsafe(32)
