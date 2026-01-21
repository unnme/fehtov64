"""
Test news and images creation.
"""

import logging
import random
from typing import Any

from sqlmodel import Session, select

from app.core.config import settings
from app.models import News, NewsImage, User
from app.repositories.news_repository import create_news
from app.schemas import NewsCreate

from ..constants import TEST_IMAGE_FILES
from ..utils.image_handler import has_missing_image_files, save_image_from_file

logger = logging.getLogger(__name__)

# Constants for news creation
NUM_NEWS_ITEMS = 30
MIN_NEWS_WITHOUT_IMAGES = 3
IMAGE_PROBABILITY = 0.6  # Probability of adding images to news


def get_superuser(session: Session) -> User | None:
    """Gets the superuser."""
    return session.exec(
        select(User).where(User.email == settings.FIRST_SUPERUSER)
    ).first()


def add_images_to_news(
    session: Session, news_id: Any, news_title: str
) -> None:
    """Adds random images to news."""
    num_images = random.randint(1, 3)
    selected_images = random.sample(
        TEST_IMAGE_FILES, min(num_images, len(TEST_IMAGE_FILES))
    )

    for order, image_file in enumerate(selected_images, start=1):
        save_image_from_file(session, news_id, image_file, order)

    session.commit()
    logger.info(f"Added {len(selected_images)} image(s) to news '{news_title}'")


def create_news_item(
    session: Session,
    superuser: User,
    index: int,
    news_without_images_count: int,
    min_news_without_images: int,
) -> None:
    """Creates a single news item with optional images."""
    news_title = f"News {index}"

    existing_news = session.exec(
        select(News).where(
            News.title == news_title, News.owner_id == superuser.id
        )
    ).first()

    if existing_news:
        existing_images = session.exec(
            select(NewsImage).where(NewsImage.news_id == existing_news.id)
        ).all()
        
        if not existing_images or has_missing_image_files(existing_images):
            # Delete broken image records
            for image in existing_images:
                session.delete(image)
            session.commit()
            
            # Add images only if minimum news without images has been reached
            if news_without_images_count >= min_news_without_images:
                add_images_to_news(session, existing_news.id, existing_news.title)
        
        logger.info(f"News '{news_title}' already exists, skipping")
        return

    # Alternate between published and unpublished news
    is_published = index % 2 == 1

    news_in = NewsCreate(
        title=news_title,
        content=f"This is the content of news item number {index}. Any text and information can be here.",
        is_published=is_published,
    )

    news = create_news(
        session=session, news_in=news_in, owner_id=superuser.id
    )
    session.commit()
    session.refresh(news)

    # Determine if images should be added
    should_add_images = False
    if news_without_images_count < min_news_without_images:
        # First few news items without images
        should_add_images = False
    else:
        # For remaining news, add images with probability
        should_add_images = random.random() < IMAGE_PROBABILITY

    if should_add_images:
        add_images_to_news(session, news.id, news_in.title)

    logger.info(f"Created news '{news_in.title}' for user {superuser.email}")


def create_test_news(session: Session) -> None:
    """Creates test news for the superuser."""
    if settings.ENVIRONMENT != "local":
        logger.info("Seed news is disabled outside local environment")
        return

    superuser = get_superuser(session)
    if not superuser:
        logger.warning("Superuser not found, cannot create test news")
        return

    news_without_images_count = 0

    for i in range(1, NUM_NEWS_ITEMS + 1):
        if news_without_images_count < MIN_NEWS_WITHOUT_IMAGES:
            news_without_images_count += 1

        create_news_item(
            session=session,
            superuser=superuser,
            index=i,
            news_without_images_count=news_without_images_count,
            min_news_without_images=MIN_NEWS_WITHOUT_IMAGES,
        )
