"""Rate limiting configuration using slowapi."""
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.core.config import settings

# Initialize limiter
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["1000/hour"],
    storage_uri="memory://",  # Can be changed to Redis: "redis://localhost:6379"
)

# Rate limit configurations based on environment
if settings.ENVIRONMENT == "local":
    AUTH_RATE_LIMIT = "10/minute"
    LOGIN_RATE_LIMIT = "5/5minutes"
else:
    AUTH_RATE_LIMIT = "5/minute"
    LOGIN_RATE_LIMIT = "3/5minutes"
