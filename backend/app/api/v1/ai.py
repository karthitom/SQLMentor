"""AI chat and explanation API router."""

from typing import Optional

import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.api.deps import get_current_user
from app.core.config import settings
from app.models.user import User
from app.services.ai_service import AIService

router = APIRouter()
log = structlog.get_logger()


class ChatMessage(BaseModel):
    role: str = Field(..., pattern=r"^(user|assistant)$")
    content: str = Field(..., min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(..., max_length=50)
    context: Optional[str] = Field(None, max_length=2000)


class ChatResponse(BaseModel):
    reply: str
    disclaimer: str = (
        "⚠️ Educational use only. Apply these concepts only on systems you own "
        "or have explicit written authorization to test."
    )


class ExplainConceptRequest(BaseModel):
    concept: str = Field(..., min_length=1, max_length=200)
    skill_level: str = Field("beginner", pattern=r"^(beginner|intermediate|advanced)$")


@router.post("/chat", response_model=ChatResponse)
async def ai_chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
) -> ChatResponse:
    """
    Educational AI chat assistant for SQL injection learning.
    ⚠️ For educational purposes only.
    """
    if not settings.FEATURE_AI_CHAT_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI chat is currently disabled",
        )

    ai_svc = AIService()
    messages_dict = [{"role": m.role, "content": m.content} for m in request.messages]

    reply = await ai_svc.chat(messages=messages_dict, context=request.context)

    return ChatResponse(reply=reply)


@router.post("/explain")
async def explain_concept(
    request: ExplainConceptRequest,
    current_user: User = Depends(get_current_user),
) -> dict:
    """Get an educational explanation of a security concept."""
    ai_svc = AIService()

    prompt = (
        f"Explain the concept of '{request.concept}' at the {request.skill_level} level "
        f"in the context of SQL injection and web security education. "
        f"Focus on understanding and prevention. "
        f"Format as a structured educational explanation with examples and secure coding guidance."
    )

    reply = await ai_svc.chat(
        messages=[{"role": "user", "content": prompt}]
    )

    return {
        "concept": request.concept,
        "skill_level": request.skill_level,
        "explanation": reply,
        "disclaimer": (
            "⚠️ This explanation is for educational purposes only. "
            "Only test against systems you own or have explicit written authorization to test."
        ),
    }
