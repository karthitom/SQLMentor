"""Users API router using Firestore."""

from fastapi import APIRouter, Depends
from firebase_admin import firestore

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate

router = APIRouter()

@router.get("/me", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse.model_validate(current_user.model_dump())

@router.patch("/me", response_model=UserResponse)
async def update_profile(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: firestore.firestore.Client = Depends(get_db),
) -> UserResponse:
    update_data = data.model_dump(exclude_unset=True)
    if update_data:
        from datetime import datetime, timezone
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        db.collection("users").document(current_user.id).update(update_data)
        
        # update the local object for response
        for k, v in update_data.items():
            setattr(current_user, k, v)
            
    return UserResponse.model_validate(current_user.model_dump())
