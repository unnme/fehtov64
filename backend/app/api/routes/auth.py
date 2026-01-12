from datetime import timedelta
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from starlette.requests import Request

from app import crud
from app.api.deps import CurrentUser, SessionDep
from app.core import security
from app.core.config import settings
from app.core.security import get_password_hash
from app.schemas import Message, NewPassword, Token, UserPublic
from app.utils import (
    generate_password_reset_token,
    generate_reset_password_email,
    send_email,
    verify_password_reset_token,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/access-token")
def login_access_token(
    session: SessionDep,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    request: Request,
) -> Token:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    # Add delay to prevent timing attacks that could reveal user existence
    import time
    start_time = time.time()
    
    # Check user separately to distinguish failure cases
    db_user = crud.get_user_by_email(session=session, email=form_data.username)
    
    # Record attempt with email in middleware for detailed tracking
    from app.core.ip_blocking import get_ip_blocking_middleware
    from app.core.security import verify_password
    
    middleware = get_ip_blocking_middleware()
    if middleware:
        client_ip = middleware._get_client_ip(request)
        user_agent = request.headers.get("User-Agent")
    
    # Minimum processing time to prevent timing attacks
    min_processing_time = 0.2  # 200ms
    
    # If user not found or password incorrect - generic message
    if not db_user:
        elapsed = time.time() - start_time
        if elapsed < min_processing_time:
            time.sleep(min_processing_time - elapsed)
        if middleware:
            middleware._record_failed_attempt(
                client_ip, user_agent, form_data.username
            )
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    # Verify password
    if not verify_password(form_data.password, db_user.hashed_password):
        elapsed = time.time() - start_time
        if elapsed < min_processing_time:
            time.sleep(min_processing_time - elapsed)
        if middleware:
            middleware._record_failed_attempt(
                client_ip, user_agent, form_data.username
            )
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    # If password correct but user inactive - specific message
    if not db_user.is_active:
        elapsed = time.time() - start_time
        if elapsed < min_processing_time:
            time.sleep(min_processing_time - elapsed)
        if middleware:
            middleware._record_failed_attempt(
                client_ip, user_agent, form_data.username
            )
        raise HTTPException(
            status_code=403,
            detail="Your account is inactive. Please contact an administrator to activate your account."
        )
    
    # All checks passed - generate access token
    user = db_user
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return Token(
        access_token=security.create_access_token(
            user.id, expires_delta=access_token_expires
        )
    )


@router.post("/password-recovery/{email}")
def recover_password(email: str, session: SessionDep) -> Message:
    """
    Password Recovery
    """
    user = crud.get_user_by_email(session=session, email=email)

    # Always return success to prevent email enumeration attacks
    # Only send email if user exists and is active
    if user and user.is_active:
        password_reset_token = generate_password_reset_token(email=email)
        email_data = generate_reset_password_email(
            email_to=user.email, email=email, token=password_reset_token
        )
        send_email(
            email_to=user.email,
            subject=email_data.subject,
            html_content=email_data.html_content,
        )
    # Return same message regardless of whether user exists
    return Message(message="If the email exists, a password recovery email has been sent")


@router.post("/reset-password/")
def reset_password(session: SessionDep, body: NewPassword) -> Message:
    """
    Reset password
    """
    email = verify_password_reset_token(token=body.token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid token")
    user = crud.get_user_by_email(session=session, email=email)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this email does not exist in the system.",
        )
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    hashed_password = get_password_hash(password=body.new_password)
    user.hashed_password = hashed_password
    session.add(user)
    session.commit()
    return Message(message="Password updated successfully")


