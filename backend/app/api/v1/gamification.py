"""Gamification and Progress API router."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
import structlog
from typing import List

from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()
log = structlog.get_logger()

class ModuleCompletionRequest(BaseModel):
    module_id: str
    xp_earned: int = Field(..., ge=0, le=1000)

class ModuleCompletionResponse(BaseModel):
    message: str
    xp_awarded: int
    new_total_xp: int
    level_up: bool
    new_level: int
    badges_earned: List[str]

@router.post("/complete-module", response_model=ModuleCompletionResponse)
async def complete_module(
    request: ModuleCompletionRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Mark a module as completed and award XP.
    Handles level-up logic automatically.
    """
    if request.module_id in current_user.completed_modules:
        return ModuleCompletionResponse(
            message="Module already completed",
            xp_awarded=0,
            new_total_xp=current_user.xp,
            level_up=False,
            new_level=current_user.level,
            badges_earned=[]
        )

    # Award XP
    current_user.xp += request.xp_earned
    current_user.completed_modules.append(request.module_id)
    
    # Simple Leveling curve (e.g. 500 XP per level)
    new_level = (current_user.xp // 500) + 1
    level_up = new_level > current_user.level
    current_user.level = new_level

    # Check for badges
    badges_earned = []
    if len(current_user.completed_modules) == 1 and "First Steps" not in current_user.badges:
        badges_earned.append("First Steps")
        current_user.badges.append("First Steps")
    
    if level_up and f"Level {new_level}" not in current_user.badges:
        badges_earned.append(f"Level {new_level}")
        current_user.badges.append(f"Level {new_level}")

    # Note: In a real app, we would save current_user to Firestore here.
    log.info("module_completed", user_id=current_user.id, module_id=request.module_id, xp=request.xp_earned)

    return ModuleCompletionResponse(
        message="Module completed successfully",
        xp_awarded=request.xp_earned,
        new_total_xp=current_user.xp,
        level_up=level_up,
        new_level=current_user.level,
        badges_earned=badges_earned
    )
