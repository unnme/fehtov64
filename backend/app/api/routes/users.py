import uuid
from typing import Any

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlmodel import func, select

from app.api.deps import (
    CurrentUser,
    SessionDep,
    get_current_active_superuser,
)
from app.core.config import settings
from app.core.errors import (
    BadRequestError,
    ConflictError,
    ErrorCode,
    ForbiddenError,
    NotFoundError,
)
from app.core.security import get_password_hash, verify_password
from app.models import News, User
from app.repositories.user_repository import (
    create_user as create_user_repo,
)
from app.repositories.user_repository import (
    get_user_by_email,
)
from app.repositories.user_repository import (
    update_user as update_user_repo,
)
from app.schemas import (
    EmailVerificationCode,
    EmailVerificationRequest,
    Message,
    UpdatePassword,
    UserCreate,
    UserPublic,
    UsersPublic,
    UserUpdate,
    UserUpdateMe,
)
from app.services.email_service import email_service
from app.services.verification_service import verification_service

router = APIRouter(prefix="/users", tags=["users"])


@router.get(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=UsersPublic,
)
def read_users(
    session: SessionDep, skip: int = 0, limit: int = 100, include_guardian: bool = False
) -> Any:
    """
    Retrieve users.
    By default excludes system users (Guardian).
    Set include_guardian=True to include Guardian user (useful for news owner selection).
    """

    guardian_email = "guardian@system.example.com"

    if include_guardian:
        # Include all users including Guardian
        count_statement = select(func.count()).select_from(User)
        count = session.exec(count_statement).one()
        statement = select(User).offset(skip).limit(limit)
    else:
        # Exclude guardian system user
        count_statement = (
            select(func.count()).select_from(User).where(User.email != guardian_email)
        )
        count = session.exec(count_statement).one()
        statement = (
            select(User).where(User.email != guardian_email).offset(skip).limit(limit)
        )

    users = session.exec(statement).all()

    return UsersPublic(data=users, count=count)


@router.post(
    "/", dependencies=[Depends(get_current_active_superuser)], response_model=UserPublic
)
async def create_user(
    *,
    session: SessionDep,
    background_tasks: BackgroundTasks,
    user_in: UserCreate,
    current_user: CurrentUser,
) -> Any:
    """
    Create new user.
    Only superusers can set is_superuser flag.
    """
    user = get_user_by_email(session=session, email=user_in.email)
    if user:
        raise ConflictError(
            ErrorCode.USER_EMAIL_EXISTS, "User with this email already exists"
        )

    # Check if nickname is already taken
    existing_user_by_name = session.exec(
        select(User).where(User.nickname == user_in.nickname)
    ).first()
    if existing_user_by_name:
        raise ConflictError(
            ErrorCode.USER_NAME_EXISTS, "User with this name already exists"
        )

    # Only allow superusers to create other superusers
    # Note: endpoint is already protected by get_current_active_superuser, but we check explicitly
    if user_in.is_superuser and not current_user.is_superuser:
        raise ForbiddenError(
            ErrorCode.USER_SUPERUSER_REQUIRED,
            "Only superusers can create other superusers",
        )

    user = create_user_repo(session=session, user_create=user_in)
    if settings.emails_enabled and user_in.email:
        # Don't send password in email for security - user should set it themselves
        # or use password reset if needed
        background_tasks.add_task(
            email_service.send_new_account_email_sync,
            email_to=user_in.email,
            username=user_in.email,
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
        raise BadRequestError(
            ErrorCode.USER_EMAIL_CHANGE_FORBIDDEN,
            "Email cannot be changed through this endpoint",
        )

    # Check if nickname is already taken (if being updated)
    if user_in.nickname:
        existing_user_by_name = session.exec(
            select(User).where(User.nickname == user_in.nickname)
        ).first()
        if existing_user_by_name and existing_user_by_name.id != current_user.id:
            raise ConflictError(
                ErrorCode.USER_NAME_EXISTS, "User with this name already exists"
            )

    user_data = user_in.model_dump(exclude_unset=True)
    current_user.sqlmodel_update(user_data)
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return current_user


@router.post("/me/email/request-code", response_model=Message)
async def request_email_verification_code(
    *,
    session: SessionDep,
    background_tasks: BackgroundTasks,
    request: EmailVerificationRequest,
    current_user: CurrentUser,
) -> Any:
    """
    Request email verification code to change email address.
    Sends a 4-character code to the new email address.
    """
    new_email = request.new_email.lower()

    # Check that new email is not taken by another user
    existing_user = get_user_by_email(session=session, email=new_email)
    if existing_user and existing_user.id != current_user.id:
        raise ConflictError(
            ErrorCode.USER_EMAIL_EXISTS, "This email is already registered"
        )

    # Check that this is not the current email
    if current_user.email.lower() == new_email:
        raise BadRequestError(
            ErrorCode.USER_EMAIL_SAME, "This is already your current email"
        )

    # Generate verification code
    code = verification_service.generate_code()

    # Store code
    verification_service.store_code(str(current_user.id), new_email, code)

    # Send email with code to current email only
    if settings.emails_enabled:
        if not current_user.email:
            raise BadRequestError(
                ErrorCode.USER_EMAIL_NOT_SET, "Current email address is not set"
            )
        background_tasks.add_task(
            email_service.send_email_verification_code_sync,
            email_to=current_user.email,
            code=code,
        )

    return Message(
        message="Verification code has been sent to your current email address"
    )


@router.post("/me/email/verify", response_model=UserPublic)
def verify_and_update_email(
    *,
    session: SessionDep,
    verification: EmailVerificationCode,
    current_user: CurrentUser,
) -> Any:
    """
    Verify email change with code and update email address.
    Requires the 4-character code sent to the new email address.
    """
    new_email = verification.new_email.lower()
    code = verification.code

    # Verify code
    if not verification_service.verify_code(str(current_user.id), new_email, code):
        raise BadRequestError(
            ErrorCode.USER_VERIFICATION_INVALID, "Invalid or expired verification code"
        )

    # Check that email is not taken (in case someone registered between requests)
    existing_user = get_user_by_email(session=session, email=new_email)
    if existing_user and existing_user.id != current_user.id:
        raise ConflictError(
            ErrorCode.USER_EMAIL_EXISTS, "This email is already registered"
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
        raise BadRequestError(ErrorCode.USER_PASSWORD_INCORRECT, "Incorrect password")
    if body.current_password == body.new_password:
        raise BadRequestError(
            ErrorCode.USER_PASSWORD_SAME,
            "New password cannot be the same as the current one",
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
    # Add is_first_superuser field to response
    user_dict = current_user.model_dump()
    user_dict["is_first_superuser"] = current_user.email == settings.FIRST_SUPERUSER
    return UserPublic.model_validate(user_dict)


@router.delete("/me", response_model=Message)
def delete_user_me(session: SessionDep, current_user: CurrentUser) -> Any:
    """
    Delete own user.
    First superuser and Guardian cannot be deleted.
    All news owned by the user will be reassigned to the Guardian system user.
    """
    # Check if this is the first superuser (created automatically)
    if current_user.email == settings.FIRST_SUPERUSER:
        raise ForbiddenError(
            ErrorCode.USER_DELETE_FIRST_SUPERUSER,
            "First superuser account cannot be deleted",
        )

    # Prevent deletion of Guardian system user
    guardian_email = "guardian@system.example.com"
    if current_user.email == guardian_email:
        raise ForbiddenError(
            ErrorCode.USER_DELETE_GUARDIAN, "Guardian system user cannot be deleted"
        )

    # Get guardian user for reassigning news
    guardian = session.exec(select(User).where(User.email == guardian_email)).first()

    if not guardian:
        # 500 error for developers - data integrity issue
        raise HTTPException(
            status_code=500,
            detail="Guardian system user not found. Please run database initialization.",
        )

    # Reassign all news from deleted user to guardian
    news_statement = select(News).where(News.owner_id == current_user.id)
    news_items = session.exec(news_statement).all()
    for news_item in news_items:
        news_item.owner_id = guardian.id
        session.add(news_item)

    # Delete user (news are now owned by guardian, so CASCADE won't delete them)
    session.delete(current_user)
    session.commit()
    return Message(
        message="User deleted successfully. All news have been reassigned to Guardian."
    )


# Public registration endpoint disabled - users can only be created by superusers via admin panel
# @router.post("/signup", response_model=UserPublic)
# def register_user(session: SessionDep, user_in: UserRegister, request: Request) -> Any:
#     """
#     Create new user without the need to be logged in.
#     New users are created as inactive and must be activated by an admin before they can log in.
#     Limited to 2 registrations per IP address.
#     """
#     ...


@router.get("/{user_id}", response_model=UserPublic)
def read_user_by_id(
    user_id: uuid.UUID, session: SessionDep, current_user: CurrentUser
) -> Any:
    """
    Get a specific user by id.
    """
    user = session.get(User, user_id)
    if not user:
        raise NotFoundError(ErrorCode.USER_NOT_FOUND, "User not found")
    if user == current_user:
        return user
    if not current_user.is_superuser:
        raise ForbiddenError(
            ErrorCode.USER_INSUFFICIENT_PRIVILEGES, "Not enough privileges"
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
        raise NotFoundError(ErrorCode.USER_NOT_FOUND, "User not found")
    if user_in.email:
        existing_user = get_user_by_email(session=session, email=user_in.email)
        if existing_user and existing_user.id != user_id:
            raise ConflictError(
                ErrorCode.USER_EMAIL_EXISTS, "User with this email already exists"
            )

    # Security: only superusers can change is_superuser
    user_data = user_in.model_dump(exclude_unset=True)
    if "is_superuser" in user_data:
        # current_user already checked via get_current_active_superuser dependency
        # But check again for clarity
        if not current_user.is_superuser:
            raise ForbiddenError(
                ErrorCode.USER_SUPERUSER_REQUIRED,
                "Only superusers can change is_superuser field",
            )
        # Prevent superuser from removing superuser status from themselves
        if db_user.id == current_user.id and user_data["is_superuser"] is False:
            raise ForbiddenError(
                ErrorCode.USER_SUPERUSER_SELF_DEMOTE,
                "Cannot remove superuser status from yourself",
            )

    # Allow is_superuser change only for superusers
    db_user = update_user_repo(
        session=session,
        db_user=db_user,
        user_in=user_in,
        allow_superuser_change=current_user.is_superuser,
    )
    return db_user


@router.delete("/{user_id}", dependencies=[Depends(get_current_active_superuser)])
def delete_user(
    session: SessionDep, current_user: CurrentUser, user_id: uuid.UUID
) -> Message:
    """
    Delete a user.
    All news owned by the user will be reassigned to the Guardian system user.
    """
    user = session.get(User, user_id)
    if not user:
        raise NotFoundError(ErrorCode.USER_NOT_FOUND, "User not found")
    if user == current_user:
        raise ForbiddenError(
            ErrorCode.USER_DELETE_SELF_FORBIDDEN, "Cannot delete yourself"
        )

    # Check if this is the first superuser
    if user.email == settings.FIRST_SUPERUSER:
        raise ForbiddenError(
            ErrorCode.USER_DELETE_FIRST_SUPERUSER,
            "First superuser account cannot be deleted",
        )

    # Prevent deletion of Guardian system user
    guardian_email = "guardian@system.example.com"
    if user.email == guardian_email:
        raise ForbiddenError(
            ErrorCode.USER_DELETE_GUARDIAN, "Guardian system user cannot be deleted"
        )

    # Get guardian user (system user for orphaned news)
    guardian = session.exec(select(User).where(User.email == guardian_email)).first()

    if not guardian:
        # 500 error for developers - data integrity issue
        raise HTTPException(
            status_code=500,
            detail="Guardian system user not found. Please run database initialization.",
        )

    # Reassign all news from deleted user to guardian
    news_statement = select(News).where(News.owner_id == user_id)
    news_items = session.exec(news_statement).all()
    for news_item in news_items:
        news_item.owner_id = guardian.id
        session.add(news_item)

    # Delete user (news are now owned by guardian, so CASCADE won't delete them)
    session.delete(user)
    session.commit()
    return Message(
        message="User deleted successfully. All news have been reassigned to Guardian."
    )
