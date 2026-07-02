"""Authentication API router for Firebase Auth."""

from fastapi import APIRouter, Depends
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.user import UserResponse

router = APIRouter()

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    """Get the currently authenticated user's profile."""
    return UserResponse.model_validate(current_user.model_dump())
