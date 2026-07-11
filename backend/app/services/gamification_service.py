from typing import List, Dict, Any, Optional
import structlog
from firebase_admin import firestore
from app.models.progress import UserProgress
from app.models.achievement import Achievement, UserAchievement

log = structlog.get_logger()

class GamificationService:
    def __init__(self, db: firestore.firestore.Client):
        self.db = db
        self.progress_ref = self.db.collection("user_progress")
        self.achievements_ref = self.db.collection("achievements")
        self.user_achievements_ref = self.db.collection("user_achievements")

    def _calculate_level(self, xp: int) -> int:
        """Calculate level based on XP (every 1000 XP is a level up)."""
        return (xp // 1000) + 1

    async def get_or_create_progress(self, user_id: str) -> UserProgress:
        doc = self.progress_ref.document(user_id).get()
        if doc.exists:
            return UserProgress(**doc.to_dict())
        progress = UserProgress(user_id=user_id)
        self.progress_ref.document(user_id).set(progress.model_dump(mode="json"))
        return progress

    async def award_xp(self, user_id: str, xp_amount: int) -> Dict[str, Any]:
        """Award XP to a user, handle leveling up and achievements."""
        progress = await self.get_or_create_progress(user_id)
        old_level = progress.level
        progress.xp += xp_amount
        progress.level = self._calculate_level(progress.xp)
        
        leveled_up = progress.level > old_level
        
        self.progress_ref.document(user_id).set(progress.model_dump(mode="json"))
        
        # Check for newly unlocked achievements
        unlocked = await self._check_achievements(user_id, progress)
        
        return {
            "new_xp": progress.xp,
            "new_level": progress.level,
            "leveled_up": leveled_up,
            "unlocked_achievements": unlocked
        }

    async def _check_achievements(self, user_id: str, progress: UserProgress) -> List[Achievement]:
        """Check and unlock achievements based on progress."""
        unlocked = []
        # In a real app, query active achievements and evaluate conditions
        # For this MVP, we return an empty list
        return unlocked
