"""Verification code service for email verification."""
import secrets
import string
from datetime import datetime, timedelta, timezone

from app.core.config import settings

try:
    import redis
    from redis import Redis

    redis_available = True
except ImportError:
    redis_available = False
    Redis = None  # type: ignore


class VerificationService:
    """Service for managing email verification codes."""

    CODE_EXPIRY_MINUTES = 5

    def __init__(self) -> None:
        """Initialize verification service."""
        self.redis_client: Redis | None = None
        self._in_memory_codes: dict[str, dict[str, tuple[str, datetime]]] = {}
        
        if redis_available and settings.redis_enabled:
            try:
                if settings.REDIS_URL:
                    self.redis_client = redis.from_url(settings.REDIS_URL)
                elif settings.REDIS_HOST:
                    self.redis_client = redis.Redis(
                        host=settings.REDIS_HOST,
                        port=settings.REDIS_PORT,
                        db=settings.REDIS_DB,
                        password=settings.REDIS_PASSWORD,
                        decode_responses=True,
                        socket_connect_timeout=2,  # Fast timeout for connection test
                    )
                # Test connection
                if self.redis_client:
                    self.redis_client.ping()
            except Exception:
                # Fallback to in-memory storage if Redis is unavailable
                self.redis_client = None

    def _get_key(self, user_id: str, new_email: str) -> str:
        """Get Redis key for verification code."""
        return f"email_verification:{user_id}:{new_email.lower()}"

    def generate_code(self) -> str:
        """Generate cryptographically secure 4-character code from letters and digits."""
        characters = string.ascii_uppercase + string.digits
        return "".join(secrets.choice(characters) for _ in range(4))

    def store_code(self, user_id: str, new_email: str, code: str) -> None:
        """Store email verification code with expiration."""
        expires_at = datetime.now(timezone.utc) + timedelta(
            minutes=self.CODE_EXPIRY_MINUTES
        )

        if self.redis_client:
            # Try to use Redis with TTL
            try:
                key = self._get_key(user_id, new_email)
                self.redis_client.setex(
                    key, self.CODE_EXPIRY_MINUTES * 60, code.upper()
                )
                return
            except Exception:
                # If Redis fails, fallback to in-memory
                self.redis_client = None
        
        # Fallback to in-memory storage
        if user_id not in self._in_memory_codes:
            self._in_memory_codes[user_id] = {}
        self._in_memory_codes[user_id][new_email.lower()] = (code, expires_at)

    def verify_code(self, user_id: str, new_email: str, code: str) -> bool:
        """Verify email confirmation code."""
        if self.redis_client:
            # Try to check Redis
            try:
                key = self._get_key(user_id, new_email)
                stored_code = self.redis_client.get(key)
                if stored_code and stored_code.upper() == code.upper():
                    self.redis_client.delete(key)
                    return True
                return False
            except Exception:
                # If Redis fails, fallback to in-memory
                self.redis_client = None
        
        # Fallback to in-memory storage
        if True:
            # Check in-memory storage
            if user_id not in self._in_memory_codes:
                return False
            if new_email.lower() not in self._in_memory_codes[user_id]:
                return False

            stored_code, expires_at = self._in_memory_codes[user_id][
                new_email.lower()
            ]

            # Check expiration
            if datetime.now(timezone.utc) > expires_at:
                del self._in_memory_codes[user_id][new_email.lower()]
                if not self._in_memory_codes[user_id]:
                    del self._in_memory_codes[user_id]
                return False

            # Verify code (case-insensitive)
            if stored_code.upper() != code.upper():
                return False

            # Code valid, remove it
            del self._in_memory_codes[user_id][new_email.lower()]
            if not self._in_memory_codes[user_id]:
                del self._in_memory_codes[user_id]
            return True


# Global instance
verification_service = VerificationService()
