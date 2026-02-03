from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from starlette.requests import Request as StarletteRequest

from app.api.deps import SessionDep
from app.core.config import settings
from app.core.errors import BadRequestError, ErrorCode, ForbiddenError, NotFoundError
from app.core.security import (
    AUTH_RATE_LIMIT,
    LOGIN_RATE_LIMIT,
    create_access_token,
    generate_password_reset_token,
    get_client_ip,
    get_ip_blocking_middleware,
    get_password_hash,
    limiter,
    prevent_timing_attacks,
    verify_password_reset_token,
)
from app.repositories.user_repository import authenticate, get_user_by_email
from app.schemas import Message, NewPassword, Token
from app.services.email_service import email_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/access-token")
@limiter.limit(LOGIN_RATE_LIMIT)
@prevent_timing_attacks(min_time=0.2)
def login_access_token(
    request: StarletteRequest,
    session: SessionDep,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> Token:
    """
    OAuth2 compatible token login, get an access token for future requests.
    Protected against timing attacks and rate limited.
    """
    # Get middleware for IP blocking
    middleware = get_ip_blocking_middleware()
    client_ip = get_client_ip(request)
    user_agent = request.headers.get("User-Agent")

    # Authenticate user
    db_user = authenticate(
        session=session, email=form_data.username, password=form_data.password
    )

    # If authentication failed - generic message
    if not db_user:
        if middleware and client_ip:
            middleware._record_failed_attempt(
                client_ip, user_agent, form_data.username
            )
        raise BadRequestError(ErrorCode.AUTH_INVALID_CREDENTIALS, "Incorrect email or password")

    # If password correct but user inactive - specific message
    if not db_user.is_active:
        if middleware and client_ip:
            middleware._record_failed_attempt(
                client_ip, user_agent, form_data.username
            )
        raise ForbiddenError(ErrorCode.AUTH_INACTIVE_USER, "Your account is inactive")

    # All checks passed - generate access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return Token(
        access_token=create_access_token(
            db_user.id, expires_delta=access_token_expires
        )
    )


@router.post("/password-recovery/{email}")
@limiter.limit(AUTH_RATE_LIMIT)
async def recover_password(
    request: StarletteRequest,  # noqa: ARG001
    email: str,
    session: SessionDep,
) -> Message:
    """
    Password Recovery.
    Always returns success to prevent email enumeration attacks.
    """
    user = get_user_by_email(session=session, email=email)

    # Always return success to prevent email enumeration attacks
    # Only send email if user exists and is active
    if user and user.is_active:
        password_reset_token = generate_password_reset_token(email=email)
        await email_service.send_password_reset_email(
            email_to=user.email, email=email, token=password_reset_token
        )
    # Return same message regardless of whether user exists
    return Message(message="If the email exists, a password recovery email has been sent")


@router.post("/reset-password/")
@limiter.limit(AUTH_RATE_LIMIT)
def reset_password(
    request: StarletteRequest,  # noqa: ARG001
    session: SessionDep,
    body: NewPassword,
) -> Message:
    """
    Reset password using token from email.
    """
    email = verify_password_reset_token(token=body.token)
    if not email:
        raise BadRequestError(ErrorCode.AUTH_INVALID_TOKEN, "Invalid token")
    user = get_user_by_email(session=session, email=email)
    if not user:
        raise NotFoundError(ErrorCode.AUTH_USER_NOT_FOUND, "User not found")
    elif not user.is_active:
        raise BadRequestError(ErrorCode.AUTH_INACTIVE_USER, "User is inactive")
    hashed_password = get_password_hash(password=body.new_password)
    user.hashed_password = hashed_password
    session.add(user)
    session.commit()
    return Message(message="Password updated successfully")


