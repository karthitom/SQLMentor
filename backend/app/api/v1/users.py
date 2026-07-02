"""Users API router."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_admin
from app.core.database import get_db
from app.core.security import hash_password, verify_password, validate_password_strength
from app.models.user import User
from app.schemas.common import MessageResponse
from app.schemas.user import UserResponse, UserUpdate, ChangePasswordRequest

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse.model_validate(current_user)


@router.patch("/me", response_model=UserResponse)
async def update_profile(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(current_user, key, value)
    await db.flush()
    await db.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.post("/me/change-password", response_model=MessageResponse)
async def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Change user password. Requires current password verification."""
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    is_valid, error_msg = validate_password_strength(data.new_password)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=error_msg)

    current_user.hashed_password = hash_password(data.new_password)
    await db.flush()
    return MessageResponse(message="Password changed successfully")
