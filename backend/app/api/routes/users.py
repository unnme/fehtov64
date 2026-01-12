import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlmodel import col, delete, func, select

from app import crud
from app.api.deps import (
    CurrentUser,
    SessionDep,
    get_current_active_superuser,
)
from app.core.config import settings
from app.core.security import get_password_hash, verify_password
from app.models import News, User
from app.schemas import (
    EmailVerificationCode,
    EmailVerificationRequest,
    Message,
    UpdatePassword,
    UserCreate,
    UserPublic,
    UserRegister,
    UsersPublic,
    UserUpdate,
    UserUpdateMe,
)
from app.utils import (
    generate_email_verification_code,
    generate_email_verification_email,
    generate_new_account_email,
    send_email,
    store_email_verification_code,
    verify_email_code,
)
from app.core.ip_registration import (
    get_ip_registration_tracker,
    get_client_ip_from_request,
)

router = APIRouter(prefix="/users", tags=["users"])


@router.get(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=UsersPublic,
)
def read_users(session: SessionDep, skip: int = 0, limit: int = 100) -> Any:
    """
    Retrieve users.
    """

    count_statement = select(func.count()).select_from(User)
    count = session.exec(count_statement).one()

    statement = select(User).offset(skip).limit(limit)
    users = session.exec(statement).all()

    return UsersPublic(data=users, count=count)


@router.post(
    "/", dependencies=[Depends(get_current_active_superuser)], response_model=UserPublic
)
def create_user(*, session: SessionDep, user_in: UserCreate) -> Any:
    """
    Create new user.
    """
    user = crud.get_user_by_email(session=session, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )

    user = crud.create_user(session=session, user_create=user_in)
    if settings.emails_enabled and user_in.email:
        # Don't send password in email for security - user should set it themselves
        # or use password reset if needed
        email_data = generate_new_account_email(
            email_to=user_in.email, username=user_in.email
        )
        send_email(
            email_to=user_in.email,
            subject=email_data.subject,
            html_content=email_data.html_content,
        )
    return user


@router.patch("/me", response_model=UserPublic)
def update_user_me(
    *, session: SessionDep, user_in: UserUpdateMe, current_user: CurrentUser
) -> Any:
    """
    Update own user.
    Note: Email cannot be changed through this endpoint. Use /users/me/email/verify instead.
    """
    # Email cannot be changed through this endpoint
    if user_in.email:
        raise HTTPException(
            status_code=400,
            detail="Email cannot be changed through this endpoint. Use /users/me/email/request-code to request a verification code, then /users/me/email/verify to confirm.",
        )
    
    user_data = user_in.model_dump(exclude_unset=True)
    current_user.sqlmodel_update(user_data)
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return current_user


@router.post("/me/email/request-code", response_model=Message)
def request_email_verification_code(
    *, session: SessionDep, request: EmailVerificationRequest, current_user: CurrentUser
) -> Any:
    """
    Request email verification code to change email address.
    Sends a 4-character code to the new email address.
    """
    new_email = request.new_email.lower()
    
    # Check that new email is not taken by another user
    existing_user = crud.get_user_by_email(session=session, email=new_email)
    if existing_user and existing_user.id != current_user.id:
        raise HTTPException(
            status_code=409, detail="This email is already registered to another user"
        )
    
    # Check that this is not the current email
    if current_user.email.lower() == new_email:
        raise HTTPException(
            status_code=400, detail="This is already your current email address"
        )
    
    # Generate verification code
    code = generate_email_verification_code()
    
    # Store code
    store_email_verification_code(str(current_user.id), new_email, code)
    
    # Send email with code to current email only
    if settings.emails_enabled:
        if not current_user.email:
            raise HTTPException(
                status_code=400, detail="Current email address is not set"
            )
        email_data = generate_email_verification_email(email_to=current_user.email, code=code)
        send_email(
            email_to=current_user.email,
            subject=email_data.subject,
            html_content=email_data.html_content,
        )
    
    return Message(message="Verification code has been sent to your current email address")


@router.post("/me/email/verify", response_model=UserPublic)
def verify_and_update_email(
    *, session: SessionDep, verification: EmailVerificationCode, current_user: CurrentUser
) -> Any:
    """
    Verify email change with code and update email address.
    Requires the 4-character code sent to the new email address.
    """
    new_email = verification.new_email.lower()
    code = verification.code
    
    # Verify code
    if not verify_email_code(str(current_user.id), new_email, code):
        raise HTTPException(
            status_code=400, detail="Invalid or expired verification code"
        )
    
    # Check that email is not taken (in case someone registered between requests)
    existing_user = crud.get_user_by_email(session=session, email=new_email)
    if existing_user and existing_user.id != current_user.id:
        raise HTTPException(
            status_code=409, detail="This email is already registered to another user"
        )
    
    # Update email
    current_user.email = new_email
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    
    return current_user


@router.patch("/me/password", response_model=Message)
def update_password_me(
    *, session: SessionDep, body: UpdatePassword, current_user: CurrentUser
) -> Any:
    """
    Update own password.
    """
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect password")
    if body.current_password == body.new_password:
        raise HTTPException(
            status_code=400, detail="New password cannot be the same as the current one"
        )
    hashed_password = get_password_hash(body.new_password)
    current_user.hashed_password = hashed_password
    session.add(current_user)
    session.commit()
    return Message(message="Password updated successfully")


@router.get("/me", response_model=UserPublic)
def read_user_me(current_user: CurrentUser) -> Any:
    """
    Get current user.
    """
    return current_user


@router.delete("/me", response_model=Message)
def delete_user_me(session: SessionDep, current_user: CurrentUser) -> Any:
    """
    Delete own user.
    """
    if current_user.is_superuser:
        raise HTTPException(
            status_code=403, detail="Super users are not allowed to delete themselves"
        )
    session.delete(current_user)
    session.commit()
    return Message(message="User deleted successfully")


@router.post("/signup", response_model=UserPublic)
def register_user(session: SessionDep, user_in: UserRegister, request: Request) -> Any:
    """
    Create new user without the need to be logged in.
    New users are created as inactive and must be activated by an admin before they can log in.
    Limited to 2 registrations per IP address.
    """
    # Get client IP address
    client_ip = get_client_ip_from_request(request)
    tracker = get_ip_registration_tracker()
    
    # Check if this IP can register a new user
    if not tracker.can_register(client_ip):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Maximum number of registrations ({tracker.max_registrations_per_ip}) from this IP address has been reached. Please contact support if you need to register more accounts.",
        )
    
    user = crud.get_user_by_email(session=session, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system",
        )
    # Create UserCreate from UserRegister, explicitly setting is_active=False
    # is_superuser is always False (protected in crud.create_user)
    user_create = UserCreate(
        email=user_in.email,
        password=user_in.password,
        full_name=user_in.full_name,
        is_active=False,  # New users inactive until admin activation
    )
    user = crud.create_user(session=session, user_create=user_create)
    session.add(user)
    session.commit()
    session.refresh(user)
    
    # Record registration from this IP
    tracker.record_registration(client_ip)
    
    return user


@router.get("/{user_id}", response_model=UserPublic)
def read_user_by_id(
    user_id: uuid.UUID, session: SessionDep, current_user: CurrentUser
) -> Any:
    """
    Get a specific user by id.
    """
    user = session.get(User, user_id)
    if user == current_user:
        return user
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="The user doesn't have enough privileges",
        )
    return user


@router.patch(
    "/{user_id}",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=UserPublic,
)
def update_user(
    *,
    session: SessionDep,
    user_id: uuid.UUID,
    user_in: UserUpdate,
    current_user: CurrentUser,
) -> Any:
    """
    Update a user.
    """

    db_user = session.get(User, user_id)
    if not db_user:
        raise HTTPException(
            status_code=404,
            detail="The user with this id does not exist in the system",
        )
    if user_in.email:
        existing_user = crud.get_user_by_email(session=session, email=user_in.email)
        if existing_user and existing_user.id != user_id:
            raise HTTPException(
                status_code=409, detail="User with this email already exists"
            )
    
    # Security: only superusers can change is_superuser
    user_data = user_in.model_dump(exclude_unset=True)
    if "is_superuser" in user_data:
        # current_user already checked via get_current_active_superuser dependency
        # But check again for clarity
        if not current_user.is_superuser:
            raise HTTPException(
                status_code=403,
                detail="Only superusers can change is_superuser field.",
            )
        # Prevent superuser from removing superuser status from themselves
        if db_user.id == current_user.id and user_data["is_superuser"] is False:
            raise HTTPException(
                status_code=403,
                detail="Superusers cannot remove superuser status from themselves.",
            )

    # Allow is_superuser change only for superusers
    db_user = crud.update_user(
        session=session, 
        db_user=db_user, 
        user_in=user_in,
        allow_superuser_change=current_user.is_superuser
    )
    return db_user


@router.delete("/{user_id}", dependencies=[Depends(get_current_active_superuser)])
def delete_user(
    session: SessionDep, current_user: CurrentUser, user_id: uuid.UUID
) -> Message:
    """
    Delete a user.
    """
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user == current_user:
        raise HTTPException(
            status_code=403, detail="Super users are not allowed to delete themselves"
        )
    statement = delete(News).where(col(News.owner_id) == user_id)
    session.exec(statement)  # type: ignore
    session.delete(user)
    session.commit()
    return Message(message="User deleted successfully")

