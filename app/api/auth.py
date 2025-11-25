"""
API key lifecycle endpoints (rotate/revoke).
"""
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from app.database import get_db
from app.models import User
from app.security import ensure_user_authorized, API_KEY_HEADER, generate_api_key, hash_api_key

router = APIRouter(prefix="/v1", tags=["auth"])


@router.post("/users/{user_id}/api-key/rotate")
async def rotate_api_key(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    api_key: str | None = Header(default=None, alias=API_KEY_HEADER)
):
    """
    Rotate API key for a user. Requires existing key.
    Returns the new key plaintext once.
    """
    await ensure_user_authorized(user_id, api_key, db)
    
    new_key = generate_api_key()
    hashed = hash_api_key(new_key)
    
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.api_key_hash = hashed
    db.add(user)
    await db.commit()
    
    return {"api_key": new_key}


@router.delete("/users/{user_id}/api-key", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_api_key(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    api_key: str | None = Header(default=None, alias=API_KEY_HEADER)
):
    """
    Revoke API key for a user. Requires existing key.
    """
    await ensure_user_authorized(user_id, api_key, db)
    
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.api_key_hash = None
    db.add(user)
    await db.commit()
