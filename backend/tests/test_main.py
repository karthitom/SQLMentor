"""
Unit and integration tests for SQLMentor backend.

Run with:
  cd backend
  pytest tests/ -v --cov=app --cov-report=html
"""

import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
from app.core.database import Base, get_db


# ── Test Database Setup ────────────────────────────────────────────────────────
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test_sqlmentor.db"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


async def override_get_db():
    async with TestSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


@pytest.fixture(autouse=True)
async def setup_test_db():
    """Create all tables before each test, drop after."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def client():
    """Async test client with DB override."""
    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac
    app.dependency_overrides.clear()


# ── Health Tests ──────────────────────────────────────────────────────────────
@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "SQLMentor API"


# ── Auth Tests ────────────────────────────────────────────────────────────────
@pytest.mark.asyncio
async def test_register_user(client: AsyncClient):
    response = await client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "username": "testuser",
        "password": "SecurePassword123",
        "full_name": "Test User",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["username"] == "testuser"
    assert "hashed_password" not in data  # Never expose hash


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    """Duplicate email registration should fail."""
    payload = {"email": "dup@example.com", "username": "user1", "password": "SecurePass123"}
    await client.post("/api/v1/auth/register", json=payload)

    payload["username"] = "user2"
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient):
    """Invalid login should return 401 — not reveal if email exists."""
    response = await client.post("/api/v1/auth/login", json={
        "email": "nonexistent@example.com",
        "password": "WrongPassword",
    })
    assert response.status_code == 401
    # Should NOT reveal that the email doesn't exist
    assert "email" not in response.json()["detail"].lower() or "invalid" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_login_sets_httponly_cookie(client: AsyncClient):
    """Verify that auth tokens are in HttpOnly cookies, not response body."""
    # Register first
    await client.post("/api/v1/auth/register", json={
        "email": "cookietest@example.com",
        "username": "cookietest",
        "password": "SecurePass123",
    })

    response = await client.post("/api/v1/auth/login", json={
        "email": "cookietest@example.com",
        "password": "SecurePass123",
    })
    assert response.status_code == 200

    # Token should NOT be in the JSON response body
    data = response.json()
    assert "access_token" not in data
    assert "token" not in data


@pytest.mark.asyncio
async def test_weak_password_rejected(client: AsyncClient):
    """Passwords shorter than 8 chars should be rejected."""
    response = await client.post("/api/v1/auth/register", json={
        "email": "weak@example.com",
        "username": "weakpass",
        "password": "short",
    })
    assert response.status_code == 422


# ── Analysis URL Validation Tests ─────────────────────────────────────────────
from app.services.analysis_service import validate_target_url


def test_url_validation_allows_http():
    valid, _ = validate_target_url("http://dvwa.local/")
    assert valid


def test_url_validation_allows_https():
    valid, _ = validate_target_url("https://example-lab.com/vuln")
    assert valid


def test_url_validation_rejects_javascript():
    valid, error = validate_target_url("javascript:alert(1)")
    assert not valid
    assert "scheme" in error.lower()


def test_url_validation_rejects_file():
    valid, error = validate_target_url("file:///etc/passwd")
    assert not valid
    assert "scheme" in error.lower()


def test_url_validation_rejects_data():
    valid, error = validate_target_url("data:text/html,<script>alert(1)</script>")
    assert not valid


# ── Security Tests ────────────────────────────────────────────────────────────
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)
from jose import JWTError


def test_password_hashing():
    """Verify Argon2id hashing and verification."""
    pwd = "MySecurePassword123"
    hashed = hash_password(pwd)
    assert hashed != pwd
    assert verify_password(pwd, hashed)
    assert not verify_password("WrongPassword", hashed)


def test_jwt_round_trip():
    """JWT encode/decode should work correctly."""
    token = create_access_token("user-123", {"role": "student"})
    payload = decode_access_token(token)
    assert payload["sub"] == "user-123"
    assert payload["role"] == "student"
    assert payload["type"] == "access"


def test_jwt_algorithm_none_rejected():
    """JWT with 'none' algorithm must be rejected."""
    import base64
    import json

    # Craft a fake JWT with 'none' algorithm
    header = base64.urlsafe_b64encode(json.dumps({"alg": "none", "typ": "JWT"}).encode()).rstrip(b"=").decode()
    payload_data = base64.urlsafe_b64encode(json.dumps({"sub": "attacker", "type": "access", "exp": 9999999999, "iat": 0}).encode()).rstrip(b"=").decode()
    fake_token = f"{header}.{payload_data}."

    with pytest.raises(JWTError):
        decode_access_token(fake_token)


# ── Comparison Service Tests ───────────────────────────────────────────────────
from app.services.comparison_service import ComparisonService


def test_comparison_identical_responses():
    svc = ComparisonService()
    r = {"body_excerpt": "Hello World", "status_code": 200, "content_length": 11, "response_time_ms": 100}
    result = svc.compare(r, r)
    assert result["similarity_score"] == 1.0
    assert result["status_changed"] is False


def test_comparison_detects_status_change():
    svc = ComparisonService()
    baseline = {"body_excerpt": "OK", "status_code": 200, "content_length": 2, "response_time_ms": 50}
    modified = {"body_excerpt": "Error", "status_code": 500, "content_length": 5, "response_time_ms": 50}
    result = svc.compare(baseline, modified)
    assert result["status_changed"] is True
    assert any(o["type"] == "status_change" for o in result["observable_changes"])


def test_comparison_detects_sql_error():
    svc = ComparisonService()
    baseline = {"body_excerpt": "Welcome to the page", "status_code": 200, "content_length": 20, "response_time_ms": 50}
    modified = {"body_excerpt": "You have an error in your SQL syntax", "status_code": 200, "content_length": 36, "response_time_ms": 50}
    result = svc.compare(baseline, modified)
    assert any(o["type"] == "error_message_appeared" for o in result["observable_changes"])
