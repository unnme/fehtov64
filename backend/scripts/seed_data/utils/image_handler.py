"""
Image handling utilities for seed data creation.
"""

import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from PIL import Image
from sqlmodel import Session

from app.core.config import settings
from app.models import NewsImage
from app.services.image_service import image_service

logger = logging.getLogger(__name__)


def get_upload_dir() -> Path:
    """Determines the path to the upload directory."""
    upload_dir = Path(settings.UPLOAD_DIR)
    if upload_dir.is_absolute():
        return upload_dir

    # Determine base directory from file location
    # In Docker: /app/scripts/seed_data/file_utils.py -> base should be /app
    # Locally: backend/scripts/seed_data/file_utils.py -> base should be backend
    file_path = Path(__file__)
    # Check if we're in Docker (path starts with /app/)
    if str(file_path).startswith("/app/"):
        # Running in Docker, use /app as base
        base_dir = Path("/app")
    else:
        # Local development: compute from file location
        base_dir = file_path.parent.parent.parent
        if base_dir.name == "app" and base_dir.parent.name == "app":
            base_dir = base_dir.parent
    return base_dir / upload_dir


def save_image_from_file(
    session: Session, news_id: Any, image_file_name: str, order: int
) -> None:
    """Saves an image from a local file for news."""
    try:
        # Get fixtures directory (two levels up from utils/)
        fixtures_dir = Path(__file__).parent.parent / "fixtures"
        images_dir = fixtures_dir / "images"
        image_path = images_dir / image_file_name

        if not image_path.exists():
            logger.warning(f"Image file not found: {image_path}")
            return

        file_size_check = image_path.stat().st_size
        if file_size_check > settings.MAX_UPLOAD_SIZE:
            logger.warning(f"Image {image_file_name} is too large, skipping")
            return

        upload_dir = get_upload_dir()
        upload_dir.mkdir(parents=True, exist_ok=True)

        news_dir = upload_dir / "news" / str(news_id)
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
                logger.error(f"Image file was not created: {file_path}")
                return
            file_size = file_path.stat().st_size
            logger.debug(f"Image saved successfully: {file_path} (size: {file_size} bytes)")
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


def has_missing_image_files(images: list[NewsImage]) -> bool:
    """Checks if images have missing files."""
    for image in images:
        file_path = image_service.UPLOAD_DIR / image.file_path
        if not file_path.exists():
            return True
    return False
