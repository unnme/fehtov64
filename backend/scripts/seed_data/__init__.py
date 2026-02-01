"""
Seed data creation for development mode.

This module orchestrates the creation of all test data:
- Test users
- Test positions
- Test persons (staff)
- Test news with images
- Test documents with categories

Only called in development mode (ENVIRONMENT=local).
"""

import logging

from sqlmodel import Session

from app.core.config import settings

from .seeders.documents import create_test_documents
from .seeders.news import create_test_news
from .seeders.persons import create_test_persons
from .seeders.positions import create_test_positions
from .seeders.users import create_test_users

logger = logging.getLogger(__name__)


def create_test_users_and_news(session: Session) -> None:
    """
    Creates all test data for development mode.

    Includes:
    - Test users
    - Test positions
    - Test persons (staff)
    - Test news with images
    - Test documents with categories

    Only called in development mode (ENVIRONMENT=local).
    """
    if settings.ENVIRONMENT != "local":
        logger.info("Seed data is disabled outside local environment")
        return

    logger.info("Starting seed data creation...")

    # Create test users
    logger.info("Creating test users...")
    create_test_users(session)

    # Create test positions
    logger.info("Creating test positions...")
    create_test_positions(session)

    # Create test persons
    logger.info("Creating test persons...")
    create_test_persons(session)

    # Create test news
    logger.info("Creating test news...")
    create_test_news(session)

    # Create test documents
    logger.info("Creating test documents...")
    create_test_documents(session)

    logger.info("Seed data creation completed successfully")
