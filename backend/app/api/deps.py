"""
FastAPI dependency for current user authentication.
Reads JWT from HttpOnly cookie — not Authorization header (which would be vulnerable to XSS).
"""

from typing import Annotated, Optional

import structlog
from fastapi import Cookie, Depends, HTTPException, Request, status
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import COOKIE_NAME_ACCESS, decode_access_token
from app.models.user import User
from app.services.auth_service import AuthService

log = structlog.get_logger()


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Extract and validate JWT from HttpOnly cookie.
    Raises 401 if token is missing, invalid, or expired.
    """
    token = request.cookies.get(COOKIE_NAME_ACCESS)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    try:
        payload = decode_access_token(token)
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    auth_service = AuthService(db)
    user = await auth_service.get_current_user(user_id)

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found or inactive",
        )

    return user


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive")
    return current_user


async def require_admin(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


async def require_instructor_or_admin(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    if current_user.role not in ("instructor", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor or admin access required",
        )
    return current_user
