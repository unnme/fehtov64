"""User repository for database operations."""
import uuid
from typing import Any

from sqlmodel import Session, select

from app.core.security import get_password_hash, verify_password
from app.models import User
from app.schemas import UserCreate, UserUpdate


def create_user(*, session: Session, user_create: UserCreate) -> User:
    """Create a new user."""
    user_data = user_create.model_dump(exclude={"password"})
    # Use is_superuser from user_create if provided, otherwise default to False
    if "is_superuser" not in user_data:
        user_data["is_superuser"] = False
    db_obj = User.model_validate(
        user_data, update={"hashed_password": get_password_hash(user_create.password)}
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_user(
    *,
    session: Session,
    db_user: User,
    user_in: UserUpdate,
    allow_superuser_change: bool = False,
) -> Any:
    """
    Update user.
    allow_superuser_change: if True, allows changing is_superuser (only for superusers).
    """
    user_data = user_in.model_dump(exclude_unset=True)
    if "is_superuser" in user_data and not allow_superuser_change:
        del user_data["is_superuser"]
    extra_data = {}
    if "password" in user_data:
        password = user_data["password"]
        hashed_password = get_password_hash(password)
        extra_data["hashed_password"] = hashed_password
    db_user.sqlmodel_update(user_data, update=extra_data)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


def get_user_by_email(*, session: Session, email: str) -> User | None:
    """Get user by email."""
    statement = select(User).where(User.email == email)
    return session.exec(statement).first()


def get_user_by_id(*, session: Session, user_id: uuid.UUID) -> User | None:
    """Get user by ID."""
    return session.get(User, user_id)


def authenticate(*, session: Session, email: str, password: str) -> User | None:
    """
    Authenticate user by email and password.
    Returns None if user not found, password incorrect, or user is inactive.
    """
    db_user = get_user_by_email(session=session, email=email)
    if not db_user:
        return None
    if not verify_password(password, db_user.hashed_password):
        return None
    if not db_user.is_active:
        return None
    return db_user
