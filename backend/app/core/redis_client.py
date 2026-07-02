"""Redis client for caching and rate limiting."""

from typing import Optional

import redis.asyncio as redis
import structlog

from app.core.config import settings

log = structlog.get_logger()

_redis_client: Optional[redis.Redis] = None


async def init_redis() -> None:
    """Initialize the Redis connection pool."""
    global _redis_client
    try:
        _redis_client = redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
        )
        await _redis_client.ping()
        log.info("Redis connection established")
    except Exception as exc:
        log.warning("Redis not available — rate limiting and caching disabled", error=str(exc))
        _redis_client = None


async def close_redis() -> None:
    """Close the Redis connection pool."""
    global _redis_client
    if _redis_client:
        await _redis_client.aclose()
        _redis_client = None
        log.info("Redis connection closed")


def get_redis() -> Optional[redis.Redis]:
    """Get the Redis client (may be None if Redis is unavailable)."""
    return _redis_client


async def cache_set(key: str, value: str, ttl_seconds: int = 300) -> None:
    """Set a cache value with TTL."""
    client = get_redis()
    if client:
        await client.setex(key, ttl_seconds, value)


async def cache_get(key: str) -> Optional[str]:
    """Get a cached value."""
    client = get_redis()
    if client:
        return await client.get(key)
    return None


async def cache_delete(key: str) -> None:
    """Delete a cache key."""
    client = get_redis()
    if client:
        await client.delete(key)


async def rate_limit_check(key: str, max_requests: int, window_seconds: int = 60) -> tuple[bool, int]:
    """
    Sliding window rate limiter.
    Returns (is_allowed, remaining_requests).
    """
    client = get_redis()
    if not client:
        return True, max_requests  # Allow if Redis is unavailable

    pipe = client.pipeline()
    pipe.incr(key)
    pipe.expire(key, window_seconds)
    results = await pipe.execute()
    count = results[0]

    if count > max_requests:
        return False, 0
    return True, max_requests - count
