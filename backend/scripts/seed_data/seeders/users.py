"""
Test user creation.
"""

import logging

from sqlmodel import Session, select

from app.models import User
from app.repositories.user_repository import create_user
from app.schemas import UserCreate

logger = logging.getLogger(__name__)

TEST_USERS = [
    {"email": "user1@example.com", "nickname": "TestUser1"},
    {"email": "user2@example.com", "nickname": "TestUser2"},
    {"email": "user3@example.com", "nickname": "TestUser3"},
]


def create_test_users(session: Session) -> None:
    """Creates test users."""
    for user_data in TEST_USERS:
        existing_user = session.exec(
            select(User).where(User.email == user_data["email"])
        ).first()

        if existing_user:
            logger.info(f"User '{user_data['email']}' already exists, skipping")
            continue

        user_in = UserCreate(
            email=user_data["email"],
            password="changethis",
            nickname=user_data["nickname"],
            is_active=True,
        )
        test_user = create_user(session=session, user_create=user_in)
        session.commit()
        session.refresh(test_user)
        logger.info(f"Created test user: {test_user.email}")
