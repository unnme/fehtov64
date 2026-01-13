"""Email service for sending emails."""
from pathlib import Path
from typing import Any

from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from jinja2 import Template

from app.core.config import settings


class EmailService:
    """Service for sending emails using fastapi-mail."""

    def __init__(self) -> None:
        """Initialize email service."""
        if not settings.emails_enabled:
            self.fastmail = None
            return

        # Build connection config
        # For mailcatcher (no AUTH), we need to disable USE_CREDENTIALS
        # Otherwise fastapi-mail will try to authenticate even with empty strings
        has_credentials = bool(settings.SMTP_USER and settings.SMTP_PASSWORD)
        conf = ConnectionConfig(
            MAIL_USERNAME=settings.SMTP_USER or "",
            MAIL_PASSWORD=settings.SMTP_PASSWORD or "",
            MAIL_FROM=settings.EMAILS_FROM_EMAIL,
            MAIL_PORT=settings.SMTP_PORT,
            MAIL_SERVER=settings.SMTP_HOST,
            MAIL_STARTTLS=settings.SMTP_TLS,
            MAIL_SSL_TLS=settings.SMTP_SSL,
            MAIL_FROM_NAME=settings.EMAILS_FROM_NAME or settings.PROJECT_NAME,
            USE_CREDENTIALS=has_credentials,  # Disable auth for mailcatcher
        )
        self.fastmail = FastMail(conf)

    def _render_template(self, template_name: str, context: dict[str, Any]) -> str:
        """Render email template."""
        template_path = (
            Path(__file__).parent.parent / "email-templates" / "build" / template_name
        )
        template_str = template_path.read_text()
        return Template(template_str).render(context)

    async def send_email(
        self,
        *,
        email_to: str,
        subject: str,
        html_content: str,
    ) -> None:
        """Send email."""
        import logging
        
        logger = logging.getLogger(__name__)
        
        if not settings.emails_enabled:
            logger.warning("Email sending is disabled (emails_enabled=False)")
            return
            
        if not self.fastmail:
            logger.warning("FastMail is not initialized")
            return

        try:
            message = MessageSchema(
                subject=subject,
                recipients=[email_to],
                body=html_content,
                subtype=MessageType.html,
            )
            logger.info(f"Sending email to {email_to} with subject: {subject}")
            await self.fastmail.send_message(message)
            logger.info(f"Email sent successfully to {email_to}")
        except Exception as e:
            logger.error(f"Error sending email to {email_to}: {e}", exc_info=True)
            raise

    async def send_password_reset_email(
        self, *, email_to: str, email: str, token: str
    ) -> None:
        """Send password reset email."""
        project_name = settings.PROJECT_NAME
        subject = f"{project_name} - Password recovery for user {email}"
        link = f"{settings.FRONTEND_HOST}/reset-password?token={token}"
        html_content = self._render_template(
            template_name="reset_password.html",
            context={
                "project_name": settings.PROJECT_NAME,
                "username": email,
                "email": email_to,
                "valid_hours": settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS,
                "link": link,
            },
        )
        await self.send_email(email_to=email_to, subject=subject, html_content=html_content)

    async def send_new_account_email(self, *, email_to: str, username: str) -> None:
        """Send new account email."""
        project_name = settings.PROJECT_NAME
        subject = f"{project_name} - New account for user {username}"
        html_content = self._render_template(
            template_name="new_account.html",
            context={
                "project_name": settings.PROJECT_NAME,
                "username": username,
                "email": email_to,
                "link": f"{settings.FRONTEND_HOST}/auth/login",
            },
        )
        await self.send_email(email_to=email_to, subject=subject, html_content=html_content)

    def send_new_account_email_sync(self, *, email_to: str, username: str) -> None:
        """Send new account email (synchronous wrapper for BackgroundTasks)."""
        import asyncio
        
        # Create new event loop for background task
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(
                self.send_new_account_email(email_to=email_to, username=username)
            )
        finally:
            loop.close()

    async def send_email_verification_code(
        self, *, email_to: str, code: str
    ) -> None:
        """Send email verification code."""
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
        await self.send_email(email_to=email_to, subject=subject, html_content=html_content)

    def send_email_verification_code_sync(
        self, *, email_to: str, code: str
    ) -> None:
        """Send email verification code (synchronous wrapper for BackgroundTasks)."""
        import asyncio
        import logging
        
        logger = logging.getLogger(__name__)
        logger.info(f"Attempting to send verification code email to {email_to}")
        
        # Create new event loop for background task
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(
                self.send_email_verification_code(email_to=email_to, code=code)
            )
            logger.info(f"Verification code email sent successfully to {email_to}")
        except Exception as e:
            logger.error(f"Failed to send verification code email to {email_to}: {e}", exc_info=True)
            raise
        finally:
            loop.close()


# Global instance
email_service = EmailService()
