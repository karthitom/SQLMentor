"""Health, readiness and version endpoints."""

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str

@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Health check for load balancers."""
    return HealthResponse(status="ok", service="SQLMentor API", version="1.0.0")

@router.get("/readiness", response_model=HealthResponse)
async def readiness_check() -> HealthResponse:
    """Readiness check to verify backend can serve traffic."""
    return HealthResponse(status="ready", service="SQLMentor API", version="1.0.0")

@router.get("/version", response_model=dict)
async def version_check() -> dict:
    """Returns application version."""
    return {"version": "1.0.0", "environment": "production"}
