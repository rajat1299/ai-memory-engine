"""
User lifecycle endpoints.
"""
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models import User
from app.schemas import UserCreate, UserResponse
from app.security import generate_api_key, hash_api_key

router = APIRouter(prefix="/v1", tags=["users"])


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
