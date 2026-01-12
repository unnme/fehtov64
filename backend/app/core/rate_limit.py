from collections import defaultdict
from time import time
from typing import Callable

from fastapi import status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Simple in-memory rate limiter for auth endpoints.
    For production, consider using Redis-based rate limiting.
    """

    def __init__(self, app, calls: int = 5, period: int = 60, login_calls: int = 3, login_period: int = 300):
        super().__init__(app)
        self.calls = calls
        self.period = period
        self.login_calls = login_calls  # Stricter limit for login
        self.login_period = login_period  # 5 minutes for login
        self.clients: dict[str, list[float]] = defaultdict(list)
        self.login_attempts: dict[str, list[float]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        client_ip = request.client.host if request.client else "unknown"
        
        # Only rate limit auth endpoints
        if request.url.path.startswith("/api/v1/auth/"):
            now = time()

            # Special handling for login endpoint
            if request.url.path == "/api/v1/auth/access-token" and request.method == "POST":
                # Clean old login attempts
                self.login_attempts[client_ip] = [
                    timestamp
                    for timestamp in self.login_attempts[client_ip]
                    if now - timestamp < self.login_period
                ]

                # Check login rate limit (stricter)
                if len(self.login_attempts[client_ip]) >= self.login_calls:
                    return JSONResponse(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        content={
                            "detail": f"Too many login attempts. Please try again in {self.login_period // 60} minutes."
                        },
                    )

                # Add current login attempt (will be removed on successful login)
                self.login_attempts[client_ip].append(now)

            # General rate limit for all auth endpoints
            # Clean old entries
            self.clients[client_ip] = [
                timestamp
                for timestamp in self.clients[client_ip]
                if now - timestamp < self.period
            ]

            # Check rate limit
            if len(self.clients[client_ip]) >= self.calls:
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={
                        "detail": f"Rate limit exceeded: {self.calls} requests per {self.period} seconds"
                    },
                )

            # Add current request
            self.clients[client_ip].append(now)

        # Execute request
        response = await call_next(request)

        # If login successful (200), clear attempt counter for this IP
        if (
            request.url.path == "/api/v1/auth/access-token"
            and request.method == "POST"
            and response.status_code == 200
        ):
            # Clear all attempts on successful login
            if client_ip in self.login_attempts:
                self.login_attempts[client_ip] = []

        return response

