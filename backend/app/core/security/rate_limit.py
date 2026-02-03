"""Rate limiting configuration using slowapi."""

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.core.config import settings

__all__ = [
    "limiter",
    "_rate_limit_exceeded_handler",
    "RateLimitExceeded",
    "AUTH_RATE_LIMIT",
    "LOGIN_RATE_LIMIT",
]

# Initialize limiter
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["1000/hour"],
    storage_uri="memory://",
)

# Rate limit configurations based on environment
if settings.ENVIRONMENT == "local":
    AUTH_RATE_LIMIT = "10/minute"
    LOGIN_RATE_LIMIT = "5/5minutes"
else:
    AUTH_RATE_LIMIT = "5/minute"
    LOGIN_RATE_LIMIT = "3/5minutes"
