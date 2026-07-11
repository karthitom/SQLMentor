from fastapi import APIRouter, Depends
from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.services.gamification_service import GamificationService

router = APIRouter()

@router.get("/progress")
async def get_my_progress(current_user: User = Depends(get_current_user), db = Depends(get_db)):
    gamification = GamificationService(db)
    progress = await gamification.get_or_create_progress(current_user.id)
    return progress

@router.get("/my-achievements")
async def get_my_achievements(current_user: User = Depends(get_current_user), db = Depends(get_db)):
    docs = db.collection("user_achievements").where("user_id", "==", current_user.id).stream()
    return {"achievements": [doc.to_dict() for doc in docs]}

@router.get("/leaderboard")
async def get_leaderboard(db = Depends(get_db)):
    """Get top 10 users by XP."""
    docs = db.collection("user_progress").order_by("xp", direction="DESCENDING").limit(10).stream()
    return {"leaderboard": [doc.to_dict() for doc in docs]}
