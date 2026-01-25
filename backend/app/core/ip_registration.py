"""
Module for tracking registrations by IP addresses.
Limits number of registrations from single IP.
"""
from collections import defaultdict
from typing import Callable

from fastapi import HTTPException, Request, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response


class IPRegistrationTracker:
    """
    IP address registration tracker.
    Limits number of registrations from single IP.
    """

    def __init__(self, max_registrations_per_ip: int = 2):
        self.max_registrations_per_ip = max_registrations_per_ip
        # Store number of registered users from each IP
        # {ip: count}
        self.ip_registrations: dict[str, int] = defaultdict(int)

    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address considering proxy headers."""
        if not request:
            return "unknown"
        
        # Check X-Forwarded-For header (priority 1)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            # Take first IP from list (real client IP)
            first_ip = forwarded_for.split(",")[0].strip()
            # Only return if we got a non-empty IP address
            if first_ip:
                return first_ip
        
        # Check X-Real-IP header (priority 2)
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            real_ip_clean = real_ip.strip()
            # Only return if we got a non-empty IP address
            if real_ip_clean:
                return real_ip_clean
        
        # Fallback to direct IP (priority 3)
        if request.client and request.client.host:
            return request.client.host
        
        return "unknown"

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


def get_client_ip_from_request(request: Request) -> str:
    """Get client IP address from request."""
    tracker = get_ip_registration_tracker()
    return tracker._get_client_ip(request)

