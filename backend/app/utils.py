import logging
import secrets
import string
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import emails  # type: ignore
import jwt
from jinja2 import Template
from jwt.exceptions import InvalidTokenError

from app.core import security
from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class EmailData:
    html_content: str
    subject: str


def render_email_template(*, template_name: str, context: dict[str, Any]) -> str:
    template_str = (
        Path(__file__).parent / "email-templates" / "build" / template_name
    ).read_text()
    html_content = Template(template_str).render(context)
    return html_content


def send_email(
    *,
    email_to: str,
    subject: str = "",
    html_content: str = "",
) -> None:
    assert settings.emails_enabled, "no provided configuration for email variables"
    message = emails.Message(
        subject=subject,
        html=html_content,
        mail_from=(settings.EMAILS_FROM_NAME, settings.EMAILS_FROM_EMAIL),
    )
    smtp_options = {"host": settings.SMTP_HOST, "port": settings.SMTP_PORT}
    if settings.SMTP_TLS:
        smtp_options["tls"] = True
    elif settings.SMTP_SSL:
        smtp_options["ssl"] = True
    if settings.SMTP_USER:
        smtp_options["user"] = settings.SMTP_USER
    if settings.SMTP_PASSWORD:
        smtp_options["password"] = settings.SMTP_PASSWORD
    response = message.send(to=email_to, smtp=smtp_options)
    logger.info(f"send email result: {response}")


def generate_reset_password_email(email_to: str, email: str, token: str) -> EmailData:
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Password recovery for user {email}"
    link = f"{settings.FRONTEND_HOST}/reset-password?token={token}"
    html_content = render_email_template(
        template_name="reset_password.html",
        context={
            "project_name": settings.PROJECT_NAME,
            "username": email,
            "email": email_to,
            "valid_hours": settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS,
            "link": link,
        },
    )
    return EmailData(html_content=html_content, subject=subject)


def generate_new_account_email(
    email_to: str, username: str
) -> EmailData:
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - New account for user {username}"
    html_content = render_email_template(
        template_name="new_account.html",
        context={
            "project_name": settings.PROJECT_NAME,
            "username": username,
            "email": email_to,
            "link": f"{settings.FRONTEND_HOST}/auth/login",
        },
    )
    return EmailData(html_content=html_content, subject=subject)


def generate_password_reset_token(email: str) -> str:
    delta = timedelta(hours=settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS)
    now = datetime.now(timezone.utc)
    expires = now + delta
    exp = expires.timestamp()
    encoded_jwt = jwt.encode(
        {"exp": exp, "nbf": now, "sub": email},
        settings.SECRET_KEY,
        algorithm=security.ALGORITHM,
    )
    return encoded_jwt


def verify_password_reset_token(token: str) -> str | None:
    try:
        decoded_token = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        return str(decoded_token["sub"])
    except InvalidTokenError:
        return None


# Email verification code storage: {user_id: {new_email: (code, expires_at)}}
_email_verification_codes: dict[str, dict[str, tuple[str, datetime]]] = {}


def generate_email_verification_code() -> str:
    """Generate cryptographically secure 4-character code from letters and digits."""
    characters = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(characters) for _ in range(4))


def store_email_verification_code(user_id: str, new_email: str, code: str) -> None:
    """Store email verification code with 5 minute expiration."""
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
    if user_id not in _email_verification_codes:
        _email_verification_codes[user_id] = {}
    _email_verification_codes[user_id][new_email.lower()] = (code, expires_at)


def verify_email_code(user_id: str, new_email: str, code: str) -> bool:
    """Verify email confirmation code."""
    if user_id not in _email_verification_codes:
        return False
    if new_email.lower() not in _email_verification_codes[user_id]:
        return False
    
    stored_code, expires_at = _email_verification_codes[user_id][new_email.lower()]
    
    # Check expiration
    if datetime.now(timezone.utc) > expires_at:
        # Remove expired code
        del _email_verification_codes[user_id][new_email.lower()]
        if not _email_verification_codes[user_id]:
            del _email_verification_codes[user_id]
        return False
    
    # Verify code (case-insensitive)
    if stored_code.upper() != code.upper():
        return False
    
    # Code valid, remove it
    del _email_verification_codes[user_id][new_email.lower()]
    if not _email_verification_codes[user_id]:
        del _email_verification_codes[user_id]
    return True


def generate_email_verification_email(email_to: str, code: str) -> EmailData:
    """Generate email with verification code."""
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Email Verification Code"
    html_content = f"""
    <html>
    <body>
        <h2>Email Verification Code</h2>
        <p>Your verification code is: <strong style="font-size: 24px; letter-spacing: 4px;">{code}</strong></p>
        <p>This code will expire in 5 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
    </body>
    </html>
    """
    return EmailData(html_content=html_content, subject=subject)
