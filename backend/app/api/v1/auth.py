"""Authentication API router."""

from typing import Annotated

import structlog
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    COOKIE_NAME_ACCESS,
    COOKIE_NAME_CSRF,
    COOKIE_NAME_REFRESH,
    cookie_options,
    generate_csrf_token,
)
from app.models.user import User
from app.schemas.common import MessageResponse
from app.schemas.user import UserCreate, UserResponse
from app.services.auth_service import AuthService

router = APIRouter()
log = structlog.get_logger()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    data: UserCreate,
    response: Response,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """
    Register a new user account.
    Requires FEATURE_REGISTRATION_ENABLED=true.
    """
    if not settings.FEATURE_REGISTRATION_ENABLED:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Registration is currently disabled")

    auth_service = AuthService(db)
    try:
        user = await auth_service.register_user(data)
        await db.commit()
        await db.refresh(user)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))

    # Auto-login after registration
    try:
        user, access_token, refresh_token = await auth_service.authenticate_user(
            email=data.email,
            password=data.password,
            user_agent=request.headers.get("User-Agent"),
            ip_address=request.client.host if request.client else None,
        )
        await db.commit()
        _set_auth_cookies(response, access_token, refresh_token, str(user.id), "new-session")
    except ValueError:
        pass  # Registration succeeded, login can be done manually

    return UserResponse.model_validate(user)


@router.post("/login", response_model=UserResponse)
async def login(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """
    Authenticate user with email/password (JSON body).
    Issues JWT in HttpOnly cookie + CSRF token.
    Credentials are NOT accepted via URL parameters.
    """
    body = await request.json()
    email = body.get("email", "")
    password = body.get("password", "")

    # Validate inputs (never log credentials)
    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Email and password are required",
        )

    auth_service = AuthService(db)
    try:
        user, access_token, refresh_token = await auth_service.authenticate_user(
            email=email,
            password=password,
            user_agent=request.headers.get("User-Agent"),
            ip_address=request.client.host if request.client else None,
        )
        await db.commit()
    except ValueError:
        # Generic error — never reveal whether email exists
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    _set_auth_cookies(response, access_token, refresh_token, str(user.id), str(user.id))
    return UserResponse.model_validate(user)


@router.post("/refresh", response_model=MessageResponse)
async def refresh_token(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Rotate refresh token and issue new access token."""
    refresh_token = request.cookies.get(COOKIE_NAME_REFRESH)
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No refresh token")

    auth_service = AuthService(db)
    try:
        new_access, new_refresh = await auth_service.refresh_tokens(
            refresh_token=refresh_token,
            user_agent=request.headers.get("User-Agent"),
            ip_address=request.client.host if request.client else None,
        )
        await db.commit()
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    _set_auth_cookies(response, new_access, new_refresh, "", "")
    return MessageResponse(message="Token refreshed")


@router.post("/logout", response_model=MessageResponse)
async def logout(
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """
    Logout: invalidate all sessions and clear cookies.
    Triggers full page redirect on client side to clear cached state.
    """
    refresh_token = request.cookies.get(COOKIE_NAME_REFRESH)

    auth_service = AuthService(db)
    await auth_service.logout_user(str(current_user.id), refresh_token)
    await db.commit()

    # Clear all auth cookies
    response.delete_cookie(COOKIE_NAME_ACCESS)
    response.delete_cookie(COOKIE_NAME_REFRESH)
    response.delete_cookie(COOKIE_NAME_CSRF)

    return MessageResponse(message="Logged out successfully")


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    """Get the currently authenticated user's profile."""
    return UserResponse.model_validate(current_user)


def _set_auth_cookies(
    response: Response,
    access_token: str,
    refresh_token: str,
    user_id: str,
    session_id: str,
) -> None:
    """Set secure auth cookies with proper flags."""
    access_max_age = settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60
    refresh_max_age = settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS * 86400

    # Access token — short-lived, HttpOnly
    response.set_cookie(
        key=COOKIE_NAME_ACCESS,
        value=access_token,
        **cookie_options(access_max_age, httponly=True),
    )

    # Refresh token — long-lived, HttpOnly
    response.set_cookie(
        key=COOKIE_NAME_REFRESH,
        value=refresh_token,
        **cookie_options(refresh_max_age, httponly=True),
    )

    # CSRF token — readable by JS (needed for double-submit), NOT HttpOnly
    if user_id and session_id:
        csrf_token = generate_csrf_token(user_id, session_id)
        response.set_cookie(
            key=COOKIE_NAME_CSRF,
            value=csrf_token,
            **cookie_options(access_max_age, httponly=False),  # Readable by JS for double-submit
        )
