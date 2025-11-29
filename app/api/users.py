"""
User lifecycle endpoints.
"""
from uuid import UUID
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from app.database import get_db
from app.models import User
from app.schemas import UserCreate, UserResponse
from app.security import generate_api_key, hash_api_key, ensure_user_authorized, API_KEY_HEADER
from app.worker.queue import get_redis_pool

router = APIRouter(prefix="/v1", tags=["users"])


class ConsolidationResponse(BaseModel):
    """Response after triggering consolidation."""
    status: str
    message: str
    job_id: str | None = None


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    _: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new user and issue an API key (returned once).
    """
    api_key = generate_api_key()
    hashed = hash_api_key(api_key)
    user = User(api_key_hash=hashed)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return UserResponse(id=user.id, api_key=api_key)


@router.post("/users/{user_id}/consolidate", response_model=ConsolidationResponse)
async def trigger_consolidation(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    api_key: str | None = Header(default=None, alias=API_KEY_HEADER),
):
    """
    POST /v1/users/{user_id}/consolidate
    
    Trigger memory consolidation for a user. This:
    - Merges semantically duplicate facts
    - Promotes frequently-refreshed facts to essential
    - Generates/updates a profile summary
    
    The consolidation runs as a background job. Use this endpoint
    to manually trigger consolidation instead of waiting for the
    weekly scheduled run.
    """
    await ensure_user_authorized(user_id, api_key, db)
    
    redis = await get_redis_pool()
    job = await redis.enqueue_job("consolidate_user_memory", str(user_id))
    
    return ConsolidationResponse(
        status="queued",
        message="Memory consolidation job has been queued",
        job_id=job.job_id if job else None,
    )
