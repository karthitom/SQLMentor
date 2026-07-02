"""Reports API router."""
from fastapi import APIRouter, Depends
from app.api.deps import get_current_user
from app.models.user import User
router = APIRouter()
from app.api.v1._stubs import reports_router as _r
router.include_router(_r)
