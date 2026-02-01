"""Verification code service for email verification."""

import secrets
import string
from datetime import datetime, timedelta, timezone


class VerificationService:
    """Service for managing email verification codes."""

    CODE_EXPIRY_MINUTES = 5

    def __init__(self) -> None:
        """Initialize verification service."""
        self._codes: dict[str, dict[str, tuple[str, datetime]]] = {}

    def generate_code(self) -> str:
        """Generate cryptographically secure 4-character code from letters and digits."""
        characters = string.ascii_uppercase + string.digits
        return "".join(secrets.choice(characters) for _ in range(4))

    def store_code(self, user_id: str, new_email: str, code: str) -> None:
        """Store email verification code with expiration."""
        expires_at = datetime.now(timezone.utc) + timedelta(
            minutes=self.CODE_EXPIRY_MINUTES
        )

        if user_id not in self._codes:
            self._codes[user_id] = {}
        self._codes[user_id][new_email.lower()] = (code.upper(), expires_at)

    def verify_code(self, user_id: str, new_email: str, code: str) -> bool:
        """Verify email confirmation code."""
        if user_id not in self._codes:
            return False
        if new_email.lower() not in self._codes[user_id]:
            return False

        stored_code, expires_at = self._codes[user_id][new_email.lower()]

        # Check expiration
        if datetime.now(timezone.utc) > expires_at:
            del self._codes[user_id][new_email.lower()]
            if not self._codes[user_id]:
                del self._codes[user_id]
            return False

        # Verify code (case-insensitive)
        if stored_code.upper() != code.upper():
            return False

        # Code valid, remove it
        del self._codes[user_id][new_email.lower()]
        if not self._codes[user_id]:
            del self._codes[user_id]
        return True


# Global instance
verification_service = VerificationService()
