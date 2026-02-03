"""Security package: authentication, IP protection, rate limiting."""

from app.core.security.auth import (
    ALGORITHM,
    create_access_token,
    generate_password_reset_token,
    get_password_hash,
    verify_password,
    verify_password_reset_token,
)
from app.core.security.decorators import prevent_timing_attacks
from app.core.security.ip import (
    IPBlockInfo,
    IPBlockingMiddleware,
    IPRegistrationTracker,
    get_client_ip,
    get_ip_blocking_middleware,
    get_ip_registration_tracker,
)
from app.core.security.rate_limit import (
    AUTH_RATE_LIMIT,
    LOGIN_RATE_LIMIT,
    RateLimitExceeded,
    _rate_limit_exceeded_handler,
    limiter,
)

__all__ = [
    # auth
    "ALGORITHM",
    "create_access_token",
    "generate_password_reset_token",
    "get_password_hash",
    "verify_password",
    "verify_password_reset_token",
    # decorators
    "prevent_timing_attacks",
    # ip
    "IPBlockInfo",
    "IPBlockingMiddleware",
    "IPRegistrationTracker",
    "get_client_ip",
    "get_ip_blocking_middleware",
    "get_ip_registration_tracker",
    # rate_limit
    "AUTH_RATE_LIMIT",
    "LOGIN_RATE_LIMIT",
    "RateLimitExceeded",
    "_rate_limit_exceeded_handler",
    "limiter",
]
