"""
API authentication utilities.
Enforces per-user API key checks using stored hashes.
"""
import hashlib
import secrets
from uuid import UUID
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import User

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
    
    return user
