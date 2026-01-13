"""
Создание тестовых данных для режима разработки.
Этот файл можно легко удалить, если тестовые данные не нужны.
"""

import logging
import random
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from PIL import Image
from sqlmodel import Session, select

from app.repositories.user_repository import create_user
from app.repositories.news_repository import create_news
from app.core.config import settings
from app.models import News, NewsImage, User
from app.schemas import NewsCreate, UserCreate

logger = logging.getLogger(__name__)

TEST_IMAGE_FILES = [
    "image1.jpg",
    "image2.jpg",
    "image3.jpg",
    "image4.jpg",
    "image5.jpg",
    "image6.jpg",
    "image7.jpg",
    "image8.jpg",
    "image9.jpg",
    "image10.jpg",
]


def save_image_from_file(
    session: Session, news_id: Any, image_file_name: str, order: int
) -> None:
    """Save image from local file for news."""
    try:
        test_images_dir = Path(__file__).parent / "test_images"
        image_path = test_images_dir / image_file_name

        if not image_path.exists():
            logger.warning(f"Test image file not found: {image_path}")
            return

        file_size_check = image_path.stat().st_size
        if file_size_check > settings.MAX_UPLOAD_SIZE:
            logger.warning(f"Image {image_file_name} is too large, skipping")
            return

        UPLOAD_DIR = Path(settings.UPLOAD_DIR)
        if not UPLOAD_DIR.is_absolute():
            base_dir = Path(__file__).parent.parent.parent
            if base_dir.name == "app" and base_dir.parent.name == "app":
                base_dir = base_dir.parent
            UPLOAD_DIR = base_dir / UPLOAD_DIR
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

        news_dir = UPLOAD_DIR / "news" / str(news_id)
        news_dir.mkdir(parents=True, exist_ok=True)
        unique_id = uuid.uuid4()
        file_name = f"{unique_id}.jpg"
        file_path = news_dir / file_name

        img = Image.open(image_path)
        processed_img = None
        try:
            if img.mode != "RGB":
                rgb_img = Image.new("RGB", img.size, (255, 255, 255))
                if img.mode == "P":
                    img = img.convert("RGBA")
                if img.mode in ("RGBA", "LA"):
                    rgb_img.paste(img, mask=img.split()[-1])
                else:
                    rgb_img = img.convert("RGB")
                processed_img = rgb_img
            else:
                processed_img = img.copy()

            MAX_WIDTH = 1920
            MAX_HEIGHT = 1080
            if processed_img.width > MAX_WIDTH or processed_img.height > MAX_HEIGHT:
                ratio = min(
                    MAX_WIDTH / processed_img.width, MAX_HEIGHT / processed_img.height
                )
                new_size = (
                    int(processed_img.width * ratio),
                    int(processed_img.height * ratio),
                )
                processed_img = processed_img.resize(new_size, Image.Resampling.LANCZOS)
                quality = 80
            else:
                quality = 85

            processed_img.save(file_path, "JPEG", quality=quality, optimize=True)

            if not file_path.exists():
                logger.warning(f"Image file was not created: {file_path}")
                return
            file_size = file_path.stat().st_size
        finally:
            if processed_img and processed_img != img:
                processed_img.close()
            img.close()

        relative_path = f"news/{news_id}/{file_name}"
        image = NewsImage(
            news_id=news_id,
            file_name=image_file_name,
            file_path=relative_path,
            file_size=file_size,
            mime_type="image/jpeg",
            order=order,
            created_at=datetime.now(timezone.utc),
        )
        session.add(image)
        session.flush()
        logger.info(f"Saved image {image_file_name} for news {news_id}")
    except Exception as e:
        logger.warning(f"Failed to save image {image_file_name}: {e}")


def create_test_users_and_news(session: Session) -> None:
    """
    Создает тестовых пользователей и 30 тестовых новостей для суперпользователя.
    Картинки не добавляются.
    Вызывается только в режиме разработки (ENVIRONMENT=local).
    """
    # Get or create superuser
    superuser = session.exec(
        select(User).where(User.email == settings.FIRST_SUPERUSER)
    ).first()

    if not superuser:
        logger.warning("Superuser not found, cannot create test data")
        return

    # Create test users
    test_users = [
        {"email": "user1@example.com", "full_name": "Test User 1"},
        {"email": "user2@example.com", "full_name": "Test User 2"},
        {"email": "user3@example.com", "full_name": "Test User 3"},
    ]

    for user_data in test_users:
        existing_user = session.exec(
            select(User).where(User.email == user_data["email"])
        ).first()

        if existing_user:
            logger.info(f"User '{user_data['email']}' already exists, skipping")
            continue

        user_in = UserCreate(
            email=user_data["email"],
            password="changethis",
            full_name=user_data["full_name"],
            is_active=True,
        )
        test_user = create_user(session=session, user_create=user_in)
        session.commit()
        session.refresh(test_user)
        logger.info(f"Created test user: {test_user.email}")

    # Create 30 news items
    for i in range(1, 31):
        news_title = f"Новость {i}"

        existing_news = session.exec(
            select(News).where(
                News.title == news_title, News.owner_id == superuser.id
            )
        ).first()

        if existing_news:
            logger.info(f"News '{news_title}' already exists, skipping")
            continue

        # Alternate between published and unpublished news
        is_published = i % 2 == 1

        news_in = NewsCreate(
            title=news_title,
            content=f"Это содержание новости номер {i}. Здесь может быть любой текст и информация.",
            is_published=is_published,
        )

        news = create_news(
            session=session, news_in=news_in, owner_id=superuser.id
        )

        logger.info(f"Created news '{news_in.title}' for user {superuser.email}")
