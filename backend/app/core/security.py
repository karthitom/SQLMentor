"""
Security utilities: JWT, password hashing (Argon2), CSRF tokens.

Security guarantees:
- JWT: HS256 hardcoded, 'none' algorithm rejected, exp claim validated
- Passwords: Argon2id via passlib with per-user salts
- CSRF: HMAC-SHA256 double-submit tokens
"""

import hashlib
import hmac
import secrets
import time
from datetime import datetime, timedelta, timezone
from typing import Any

import structlog
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

log = structlog.get_logger()

# ── Password Hashing ──────────────────────────────────────────────────────────
# Argon2id is memory-hard — resistant to GPU brute force
pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto",
    argon2__memory_cost=65536,   # 64MB
    argon2__time_cost=3,
    argon2__parallelism=4,
    argon2__hash_len=32,
    argon2__type="ID",
)


def hash_password(password: str) -> str:
    """Hash a plaintext password using Argon2id."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against its Argon2id hash."""
    return pwd_context.verify(plain_password, hashed_password)


def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Validate password strength.
    Returns (is_valid, error_message).
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if len(password) > 128:
        return False, "Password must not exceed 128 characters"
    # Allow all characters — don't restrict character sets per NIST 800-63B
    return True, ""


# ── JWT ───────────────────────────────────────────────────────────────────────
_JWT_SECRET: str | None = None


def _get_jwt_secret() -> str:
    global _JWT_SECRET
    if _JWT_SECRET is None:
        _JWT_SECRET = settings.get_jwt_secret()
    return _JWT_SECRET


def create_access_token(subject: str, additional_claims: dict[str, Any] | None = None) -> str:
    """
    Create a signed JWT access token.

    Security:
    - Algorithm hardcoded to HS256 (never derived from token)
    - 'exp' claim always set
    - 'iat' claim set for issued-at tracking
    """
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)

    payload: dict[str, Any] = {
        "sub": str(subject),
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "type": "access",
    }
    if additional_claims:
        payload.update(additional_claims)

    return jwt.encode(payload, _get_jwt_secret(), algorithm="HS256")  # Hardcoded HS256


def create_refresh_token(subject: str) -> str:
    """Create a long-lived refresh token (opaque random string stored in DB)."""
    return secrets.token_urlsafe(48)


def decode_access_token(token: str) -> dict[str, Any]:
    """
    Decode and validate a JWT access token.

    Security:
    - Algorithm hardcoded to HS256 — rejects 'none' and any other algorithm
    - Expiry validated automatically by python-jose
    - Type claim validated
    """
    try:
        payload = jwt.decode(
            token,
            _get_jwt_secret(),
            algorithms=["HS256"],  # Explicit allowlist — rejects 'none'
            options={"require": ["exp", "sub", "iat"]},
        )
        if payload.get("type") != "access":
            raise JWTError("Invalid token type")
        return payload
    except JWTError as exc:
        raise JWTError(f"Token validation failed: {exc}") from exc


# ── CSRF Tokens ───────────────────────────────────────────────────────────────
_CSRF_SECRET: str | None = None


def _get_csrf_secret() -> str:
    global _CSRF_SECRET
    if _CSRF_SECRET is None:
        _CSRF_SECRET = settings.get_csrf_secret()
    return _CSRF_SECRET


def generate_csrf_token(user_id: str, session_id: str) -> str:
    """
    Generate a CSRF token using HMAC-SHA256.
    Binds the token to the user session for double-submit validation.
    """
    timestamp = str(int(time.time()))
    nonce = secrets.token_hex(16)
    message = f"{user_id}:{session_id}:{timestamp}:{nonce}"
    sig = hmac.new(
        _get_csrf_secret().encode(),
        message.encode(),
        hashlib.sha256,
    ).hexdigest()
    return f"{message}:{sig}"


def validate_csrf_token(token: str, user_id: str, session_id: str, max_age_seconds: int = 3600) -> bool:
    """
    Validate a CSRF token.
    Checks HMAC signature, user/session binding, and token age.
    """
    try:
        parts = token.rsplit(":", 1)
        if len(parts) != 2:
            return False
        message, sig = parts
        expected_sig = hmac.new(
            _get_csrf_secret().encode(),
            message.encode(),
            hashlib.sha256,
        ).hexdigest()
        if not hmac.compare_digest(sig, expected_sig):
            return False

        msg_parts = message.split(":")
        if len(msg_parts) != 4:
            return False
        token_user_id, token_session_id, timestamp, _ = msg_parts
        if token_user_id != user_id or token_session_id != session_id:
            return False
        if int(time.time()) - int(timestamp) > max_age_seconds:
            return False

        return True
    except Exception:
        return False


# ── Cookie Helpers ────────────────────────────────────────────────────────────
COOKIE_NAME_ACCESS = "__Host-access_token"    # __Host- prefix for security
COOKIE_NAME_REFRESH = "__Host-refresh_token"
COOKIE_NAME_CSRF = "__Host-csrf_token"


def cookie_options(expires_seconds: int, httponly: bool = True) -> dict:
    """Standard secure cookie options."""
    return {
        "httponly": httponly,
        "secure": True,
        "samesite": "lax",
        "max_age": expires_seconds,
        # 'domain' intentionally not set — __Host- prefix requires no domain
    }
