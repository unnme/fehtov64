"""Database initialization and configuration."""
from sqlmodel import Session, create_engine, select

from app.core.config import settings
from app.models import User
from app.repositories.user_repository import create_user
from app.schemas import UserCreate

engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))


# make sure all SQLModel models are imported (app.models) before initializing DB
# otherwise, SQLModel might fail to initialize relationships properly
# for more details: https://github.com/fastapi/full-stack-fastapi-template/issues/28


def init_db(session: Session) -> None:
    """
    Initialize database with first superuser.
    
    Creates the first superuser if it doesn't exist.
    In local environment, also creates test users and news.
    
    Args:
        session: Database session
    """
    user = session.exec(
        select(User).where(User.email == settings.FIRST_SUPERUSER)
    ).first()
    if not user:
        user_in = UserCreate(
            email=settings.FIRST_SUPERUSER,
            password=settings.FIRST_SUPERUSER_PASSWORD,
        )
        user = create_user(session=session, user_create=user_in)
        user.is_superuser = True
        session.add(user)
        session.commit()
        session.refresh(user)

    if settings.ENVIRONMENT == "local":
        import logging
        logger = logging.getLogger(__name__)
        try:
            from app.tests.create_test_data import create_test_users_and_news
            logger.info("Creating test users and news...")
            create_test_users_and_news(session)
            logger.info("Test users and news created successfully")
        except ImportError as e:
            logger.warning(f"Could not import test data creation: {e}")
        except Exception as e:
            logger.error(f"Error creating test data: {e}", exc_info=True)
