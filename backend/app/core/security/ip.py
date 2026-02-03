"""IP-based security: blocking and registration tracking."""

from collections import defaultdict
from collections.abc import Callable
from dataclasses import dataclass, field
from time import time
from typing import Any

from fastapi import HTTPException, Request, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response


def get_client_ip(request: Request) -> str:
    """
    Get client IP address considering proxy headers.

    Priority:
    1. X-Forwarded-For header (first IP)
    2. X-Real-IP header
    3. Direct client IP
    """
    if not request:
        return "unknown"

    # Check X-Forwarded-For header (priority 1)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        first_ip = forwarded_for.split(",")[0].strip()
        if first_ip:
            return first_ip

    # Check X-Real-IP header (priority 2)
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        real_ip_clean = real_ip.strip()
        if real_ip_clean:
            return real_ip_clean

    # Fallback to direct IP (priority 3)
    if request.client and request.client.host:
        return request.client.host

    return "unknown"


# =============================================================================
# IP Blocking
# =============================================================================

# Global instance for access from routers
_ip_blocking_instance: "IPBlockingMiddleware | None" = None


@dataclass
class IPBlockInfo:
    """IP blocking information."""

    ip: str
    blocked_until: float
    failed_attempts_count: int
    first_attempt_time: float | None = None
    last_attempt_time: float | None = None
    block_reason: str = "multiple_failed_logins"  # multiple_failed_logins, honeypot
    user_agent: str | None = None
    attempted_emails: list[str] = field(default_factory=list)


class IPBlockingMiddleware(BaseHTTPMiddleware):
    """
    Middleware for blocking IP addresses after multiple failed login attempts.
    Tracks failed authentication attempts and blocks IP for specified duration.
    """

    def __init__(
        self,
        app: Any,
        max_failed_attempts: int = 5,
        block_duration: int = 3600,  # 1 hour by default
        window_period: int = 900,  # 15 minutes for counting attempts
    ):
        super().__init__(app)
        self.max_failed_attempts = max_failed_attempts
        self.block_duration = block_duration
        self.window_period = window_period
        # Store failed attempts: {ip: [timestamps]}
        self.failed_attempts: dict[str, list[float]] = {}
        # Store blocked IPs with full info: {ip: IPBlockInfo}
        self.blocked_ips: dict[str, IPBlockInfo] = {}
        # Store additional attempt metadata: {ip: {user_agent, attempted_emails}}
        self.ip_metadata: dict[str, dict[str, Any]] = {}

        # Save instance globally for access from routers
        global _ip_blocking_instance
        _ip_blocking_instance = self

    def _is_ip_blocked(self, ip: str) -> bool:
        """Check if IP is blocked."""
        if ip not in self.blocked_ips:
            return False

        block_info = self.blocked_ips[ip]
        now = time()

        # If block expired, remove it
        if now >= block_info.blocked_until:
            del self.blocked_ips[ip]
            # Also clear failed attempts and metadata
            if ip in self.failed_attempts:
                del self.failed_attempts[ip]
            if ip in self.ip_metadata:
                del self.ip_metadata[ip]
            return False

        return True

    def _record_failed_attempt(
        self, ip: str, user_agent: str | None = None, attempted_email: str | None = None
    ) -> None:
        """Record failed login attempt."""
        now = time()

        if ip not in self.failed_attempts:
            self.failed_attempts[ip] = []

        # Add current attempt
        self.failed_attempts[ip].append(now)

        # Save metadata
        if ip not in self.ip_metadata:
            self.ip_metadata[ip] = {"user_agent": user_agent, "attempted_emails": []}

        if user_agent and not self.ip_metadata[ip].get("user_agent"):
            self.ip_metadata[ip]["user_agent"] = user_agent

        if (
            attempted_email
            and attempted_email not in self.ip_metadata[ip]["attempted_emails"]
        ):
            self.ip_metadata[ip]["attempted_emails"].append(attempted_email)

        # Clean old attempts (older than window_period)
        self.failed_attempts[ip] = [
            timestamp
            for timestamp in self.failed_attempts[ip]
            if now - timestamp < self.window_period
        ]

        # If limit exceeded, block IP
        if len(self.failed_attempts[ip]) >= self.max_failed_attempts:
            block_until = now + self.block_duration
            metadata = self.ip_metadata.get(ip, {})
            first_attempt = (
                min(self.failed_attempts[ip]) if self.failed_attempts[ip] else now
            )

            self.blocked_ips[ip] = IPBlockInfo(
                ip=ip,
                blocked_until=block_until,
                failed_attempts_count=len(self.failed_attempts[ip]),
                first_attempt_time=first_attempt,
                last_attempt_time=now,
                block_reason="multiple_failed_logins",
                user_agent=metadata.get("user_agent"),
                attempted_emails=metadata.get("attempted_emails", [])[:5],  # Limit to 5
            )
            # Clear failed attempts after blocking
            del self.failed_attempts[ip]

    def _clear_successful_login(self, ip: str) -> None:
        """Clear failed attempts after successful login."""
        if ip in self.failed_attempts:
            del self.failed_attempts[ip]
        if ip in self.ip_metadata:
            del self.ip_metadata[ip]

    def _block_ip_honeypot(self, ip: str, request: Request) -> None:
        """Immediately block IP on honeypot trigger."""
        now = time()
        block_until = now + self.block_duration * 2  # Block for double duration

        user_agent = request.headers.get("User-Agent")

        self.blocked_ips[ip] = IPBlockInfo(
            ip=ip,
            blocked_until=block_until,
            failed_attempts_count=0,
            first_attempt_time=now,
            last_attempt_time=now,
            block_reason="honeypot",
            user_agent=user_agent,
            attempted_emails=[],
        )

        # Clear failed attempts if any
        if ip in self.failed_attempts:
            del self.failed_attempts[ip]
        if ip in self.ip_metadata:
            del self.ip_metadata[ip]

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Check honeypot endpoint
        if request.url.path == "/api/v1/auth/honeypot" and request.method == "POST":
            client_ip = get_client_ip(request)
            # Immediately block IP on honeypot trigger
            self._block_ip_honeypot(client_ip, request)
            # Return success response so bot doesn't realize it was caught
            from fastapi.responses import JSONResponse

            return JSONResponse(
                content={"message": "OK"},
                status_code=200,
            )

        # Check only login endpoint
        if request.url.path == "/api/v1/auth/access-token" and request.method == "POST":
            client_ip = get_client_ip(request)

            # Check if IP is blocked
            if self._is_ip_blocked(client_ip):
                block_info = self.blocked_ips[client_ip]
                remaining_time = int(block_info.blocked_until - time())
                hours = remaining_time // 3600
                minutes = (remaining_time % 3600) // 60

                reason_msg = (
                    "multiple failed login attempts"
                    if block_info.block_reason == "multiple_failed_logins"
                    else "suspicious activity detected"
                )

                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"IP address blocked due to {reason_msg}. "
                    f"Please try again in {hours}h {minutes}m.",
                )

            # Get metadata from request
            user_agent = request.headers.get("User-Agent")

            # Execute request and catch exceptions
            try:
                response = await call_next(request)

                # If login failed (400 or 401), record attempt
                if response.status_code in (400, 401):
                    self._record_failed_attempt(client_ip, user_agent, None)
                # If login successful (200), clear failed attempts
                elif response.status_code == 200:
                    self._clear_successful_login(client_ip)

                return response
            except HTTPException as e:
                # If 400 or 401 error, record failed attempt
                if e.status_code in (400, 401):
                    self._record_failed_attempt(client_ip, user_agent, None)
                raise
            except Exception:
                raise

        return await call_next(request)

    def unblock_ip(self, ip: str) -> bool:
        """Unblock IP address (for admins)."""
        if ip in self.blocked_ips:
            del self.blocked_ips[ip]
            if ip in self.failed_attempts:
                del self.failed_attempts[ip]
            if ip in self.ip_metadata:
                del self.ip_metadata[ip]
            return True
        return False

    def get_blocked_ips(self) -> dict[str, IPBlockInfo]:
        """Get list of blocked IPs (for admins)."""
        now = time()
        # Clear expired blocks
        expired_ips = [
            ip
            for ip, block_info in self.blocked_ips.items()
            if now >= block_info.blocked_until
        ]
        for ip in expired_ips:
            del self.blocked_ips[ip]
            if ip in self.failed_attempts:
                del self.failed_attempts[ip]
            if ip in self.ip_metadata:
                del self.ip_metadata[ip]

        return self.blocked_ips.copy()


def get_ip_blocking_middleware() -> IPBlockingMiddleware | None:
    """Get IP blocking middleware instance for use in routers."""
    return _ip_blocking_instance


# =============================================================================
# IP Registration Tracking
# =============================================================================


class IPRegistrationTracker:
    """
    IP address registration tracker.
    Limits number of registrations from single IP.
    """

    def __init__(self, max_registrations_per_ip: int = 2):
        self.max_registrations_per_ip = max_registrations_per_ip
        # Store number of registered users from each IP: {ip: count}
        self.ip_registrations: dict[str, int] = defaultdict(int)

    def can_register(self, ip: str) -> bool:
        """Check if IP can register a new user."""
        # Ignore "unknown" IP for softer validation
        if ip == "unknown":
            return True
        return self.ip_registrations[ip] < self.max_registrations_per_ip

    def record_registration(self, ip: str) -> None:
        """Record registration from IP."""
        if ip != "unknown":
            self.ip_registrations[ip] += 1

    def get_registration_count(self, ip: str) -> int:
        """Get registration count from IP."""
        return self.ip_registrations.get(ip, 0)


# Global tracker instance
_ip_registration_tracker = IPRegistrationTracker(max_registrations_per_ip=2)


def get_ip_registration_tracker() -> IPRegistrationTracker:
    """Get global registration tracker instance."""
    return _ip_registration_tracker
