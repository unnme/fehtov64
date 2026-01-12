import sentry_sdk
from fastapi import FastAPI, Response
from fastapi.routing import APIRoute
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.api.main import api_router
from app.core.config import settings
from app.core.ip_blocking import IPBlockingMiddleware
from app.core.rate_limit import RateLimitMiddleware


def custom_generate_unique_id(route: APIRoute) -> str:
    return f"{route.tags[0]}-{route.name}"


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        if settings.ENVIRONMENT != "local":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


if settings.SENTRY_DSN and settings.ENVIRONMENT != "local":
    sentry_sdk.init(dsn=str(settings.SENTRY_DSN), enable_tracing=True)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    generate_unique_id_function=custom_generate_unique_id,
)

# Add security headers middleware
app.add_middleware(SecurityHeadersMiddleware)

# Add IP blocking middleware (must be before rate limiting)
# Blocks IP after 5 failed login attempts for 1 hour
# In local development: 10 attempts, block for 30 minutes
if settings.ENVIRONMENT == "local":
    app.add_middleware(
        IPBlockingMiddleware,
        max_failed_attempts=10,
        block_duration=1800,  # 30 minutes
        window_period=900,  # 15 minutes
    )
else:
    app.add_middleware(
        IPBlockingMiddleware,
        max_failed_attempts=5,
        block_duration=3600,  # 1 hour
        window_period=900,  # 15 minutes
    )

# Add rate limiting for auth endpoints
# In production: 5 requests per minute, 3 login attempts in 5 minutes
# In local development: 10 requests per minute, 5 login attempts in 5 minutes
if settings.ENVIRONMENT == "local":
    app.add_middleware(RateLimitMiddleware, calls=10, period=60, login_calls=5, login_period=300)
else:
    app.add_middleware(RateLimitMiddleware, calls=5, period=60, login_calls=3, login_period=300)

# Set all CORS enabled origins
if settings.all_cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.all_cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization", "Accept"],
        expose_headers=["Content-Type"],
        max_age=3600,
    )

# Include public news router first (bypasses auth) - must be before api_router
from app.api.routes.news import public_router
app.include_router(public_router, prefix=settings.API_V1_STR)

app.include_router(api_router, prefix=settings.API_V1_STR)

# Mount static files for uploaded images
static_dir = settings.UPLOAD_DIR
if static_dir and not static_dir.startswith("/"):
    import os
    static_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), static_dir)
    if os.path.exists(static_path):
        app.mount("/static", StaticFiles(directory=static_path), name="static")
