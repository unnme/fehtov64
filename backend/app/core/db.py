"""Database initialization and configuration."""
from sqlmodel import Session, create_engine, select

from app.core.config import settings
from app.models import User
from app.repositories.user_repository import create_user
from app.schemas import UserCreate
from app.services.position_service import ensure_default_position

engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))


# make sure all SQLModel models are imported (app.models) before initializing DB
# otherwise, SQLModel might fail to initialize relationships properly
# for more details: https://github.com/fastapi/full-stack-fastapi-template/issues/28


def init_db(session: Session) -> None:
    """
    Initialize database with first superuser and guardian user.
    
    Creates the first superuser if it doesn't exist.
    Creates a guardian user (system user) for orphaned news.
    In local environment, also creates test users and news.
    
    Args:
        session: Database session
    """
    # Create first superuser
    user = session.exec(
        select(User).where(User.email == settings.FIRST_SUPERUSER)
    ).first()
    if not user:
        user_in = UserCreate(
            email=settings.FIRST_SUPERUSER,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            full_name="Admin",
        )
        user = create_user(session=session, user_create=user_in)
        user.is_superuser = True
        session.add(user)
        session.commit()
        session.refresh(user)
    
    # Create guardian user (system user for orphaned news)
    guardian_email = "guardian@system.example.com"
    guardian = session.exec(
        select(User).where(User.email == guardian_email)
    ).first()
    if not guardian:
        guardian_in = UserCreate(
            email=guardian_email,
            password="system_guardian_never_login",  # Random password, user should never login
            full_name="Guardian",
        )
        guardian = create_user(session=session, user_create=guardian_in)
        guardian.is_active = False  # Disable login
        session.add(guardian)
        session.commit()
        session.refresh(guardian)

    ensure_default_position(session)

    if settings.ENVIRONMENT == "local":
        import logging
        import sys
        from pathlib import Path
        
        logger = logging.getLogger(__name__)
        try:
            # Add scripts directory to path for import
            scripts_dir = Path(__file__).parent.parent.parent / "scripts"
            if str(scripts_dir) not in sys.path:
                sys.path.insert(0, str(scripts_dir))
            
            from seed_data import create_test_users_and_news
            logger.info("Creating test users and news...")
            create_test_users_and_news(session)
            logger.info("Test users and news created successfully")
        except ImportError as e:
            logger.warning(f"Could not import test data creation: {e}")
        except Exception as e:
            logger.error(f"Error creating test data: {e}", exc_info=True)
