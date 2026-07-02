"""Knowledge base API router."""
from fastapi import APIRouter
router = APIRouter()
from app.api.v1._stubs import knowledge_router as _r
router.include_router(_r)
