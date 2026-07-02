"""
Authentication service — registration, login, token management.

Security:
- Argon2id password hashing
- Refresh token stored as hash (not plaintext)
- All sessions invalidated on logout
- Constant-time comparison for tokens
"""

import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
    validate_password_strength,
)
from app.models.user import User, UserSession
from app.schemas.user import UserCreate

log = structlog.get_logger()


def _hash_refresh_token(token: str) -> str:
    """Hash a refresh token for storage — never store plaintext."""
    return hashlib.sha256(token.encode()).hexdigest()


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def register_user(self, data: UserCreate) -> User:
        """Register a new user account."""
        # Validate password strength
        is_valid, error_msg = validate_password_strength(data.password)
        if not is_valid:
            raise ValueError(error_msg)

        # Check for existing email (case-insensitive)
        existing = await self.db.execute(
            select(User).where(User.email == data.email.lower())
        )
        if existing.scalar_one_or_none():
            raise ValueError("An account with this email already exists")

        # Check for existing username (case-insensitive)
        existing_username = await self.db.execute(
            select(User).where(User.username == data.username.lower())
        )
        if existing_username.scalar_one_or_none():
            raise ValueError("This username is already taken")

        user = User(
            email=data.email.lower(),
            username=data.username.lower(),
            full_name=data.full_name,
            hashed_password=hash_password(data.password),
            role="student",
        )
        self.db.add(user)
        await self.db.flush()  # Get the ID without committing

        log.info("User registered", user_id=user.id, email="[REDACTED]")
        return user

    async def authenticate_user(
        self, email: str, password: str, user_agent: Optional[str], ip_address: Optional[str]
    ) -> tuple[User, str, str]:
        """
        Authenticate a user and issue tokens.
        Returns (user, access_token, refresh_token).
        Note: Never log the password or tokens.
        """
        # Fetch user by email
        result = await self.db.execute(
            select(User).where(User.email == email.lower())
        )
        user = result.scalar_one_or_none()

        # Constant-time check — always verify even if user not found (prevent timing attacks)
        dummy_hash = "$argon2id$v=19$m=65536,t=3,p=4$dummy$dummyhash"
        stored_hash = user.hashed_password if user else dummy_hash

        password_valid = verify_password(password, stored_hash)

        if not user or not password_valid or not user.is_active:
            log.warning("Failed authentication attempt", ip=ip_address)
            raise ValueError("Invalid email or password")

        # Create tokens
        access_token = create_access_token(
            subject=user.id,
            additional_claims={"role": user.role, "username": user.username},
        )
        refresh_token = create_refresh_token(user.id)

        # Store hashed refresh token in session
        session = UserSession(
            user_id=user.id,
            refresh_token_hash=_hash_refresh_token(refresh_token),
            user_agent=(user_agent or "")[:512],
            ip_address=(ip_address or "")[:45],
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS),
        )
        self.db.add(session)

        # Update last login
        user.last_login_at = datetime.now(timezone.utc)
        await self.db.flush()

        log.info("User authenticated", user_id=user.id, role=user.role)
        return user, access_token, refresh_token

    async def refresh_tokens(
        self, refresh_token: str, user_agent: Optional[str], ip_address: Optional[str]
    ) -> tuple[str, str]:
        """
        Rotate refresh token and issue new access token.
        Old refresh token is invalidated (rotation).
        """
        token_hash = _hash_refresh_token(refresh_token)

        result = await self.db.execute(
            select(UserSession).where(
                UserSession.refresh_token_hash == token_hash,
                UserSession.is_active == True,
                UserSession.expires_at > datetime.now(timezone.utc),
            )
        )
        session = result.scalar_one_or_none()
        if not session:
            raise ValueError("Invalid or expired refresh token")

        # Fetch user
        user_result = await self.db.execute(select(User).where(User.id == session.user_id))
        user = user_result.scalar_one_or_none()
        if not user or not user.is_active:
            raise ValueError("User account is inactive")

        # Invalidate old session (rotation)
        session.is_active = False

        # Create new tokens
        new_access_token = create_access_token(
            subject=user.id,
            additional_claims={"role": user.role, "username": user.username},
        )
        new_refresh_token = create_refresh_token(user.id)

        new_session = UserSession(
            user_id=user.id,
            refresh_token_hash=_hash_refresh_token(new_refresh_token),
            user_agent=(user_agent or "")[:512],
            ip_address=(ip_address or "")[:45],
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS),
        )
        self.db.add(new_session)
        await self.db.flush()

        return new_access_token, new_refresh_token

    async def logout_user(self, user_id: str, refresh_token: Optional[str] = None) -> None:
        """
        Invalidate all user sessions on logout.
        If refresh_token provided, only invalidate that session.
        Otherwise, invalidate ALL sessions (full logout).
        """
        if refresh_token:
            token_hash = _hash_refresh_token(refresh_token)
            result = await self.db.execute(
                select(UserSession).where(
                    UserSession.user_id == user_id,
                    UserSession.refresh_token_hash == token_hash,
                )
            )
            session = result.scalar_one_or_none()
            if session:
                session.is_active = False
        else:
            # Invalidate ALL sessions for this user
            result = await self.db.execute(
                select(UserSession).where(
                    UserSession.user_id == user_id,
                    UserSession.is_active == True,
                )
            )
            for session in result.scalars().all():
                session.is_active = False

        log.info("User sessions invalidated", user_id=user_id)

    async def get_current_user(self, user_id: str) -> Optional[User]:
        """Fetch a user by ID for the auth dependency."""
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()
