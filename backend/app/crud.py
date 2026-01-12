import uuid
from typing import Any

from sqlmodel import Session, select

from app.core.security import get_password_hash, verify_password
from app.models import News, User
from app.schemas import NewsCreate, UserCreate, UserUpdate


def create_user(*, session: Session, user_create: UserCreate) -> User:
    user_data = user_create.model_dump(exclude={"password"})
    user_data["is_superuser"] = False
    db_obj = User.model_validate(
        user_data, update={"hashed_password": get_password_hash(user_create.password)}
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_user(*, session: Session, db_user: User, user_in: UserUpdate, allow_superuser_change: bool = False) -> Any:
    """
    Обновить пользователя.
    allow_superuser_change: если True, позволяет изменять is_superuser (только для суперпользователей).
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
    statement = select(User).where(User.email == email)
    session_user = session.exec(statement).first()
    return session_user


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


def create_news(*, session: Session, news_in: NewsCreate, owner_id: uuid.UUID) -> News:
    from datetime import datetime, timezone

    now = datetime.now(timezone.utc)
    news_data = news_in.model_dump()
    if news_data.get("is_published"):
        news_data["published_at"] = now
    else:
        news_data["published_at"] = None

    db_news = News.model_validate(
        news_data,
        update={
            "owner_id": owner_id,
            "created_at": now,
            "updated_at": now,
        },
    )
    session.add(db_news)
    session.commit()
    session.refresh(db_news)
    return db_news
