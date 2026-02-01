"""Utility schemas."""
from sqlmodel import SQLModel


class BlockedIPInfo(SQLModel):
    """Blocked IP address information."""
    ip: str
    blocked_until: float
    remaining_seconds: int
    failed_attempts_count: int
    first_attempt_time: float | None = None
    last_attempt_time: float | None = None
    block_reason: str
    user_agent: str | None = None
    attempted_emails: list[str] = []


class BlockedIPsList(SQLModel):
    """List of blocked IP addresses."""
    blocked_ips: list[BlockedIPInfo]
    count: int


class PrivateUserCreate(SQLModel):
    """Model for creating user via private API (only for local development)."""
    email: str
    password: str
    nickname: str
    is_verified: bool = False
