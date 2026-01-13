"""Image processing service."""
import shutil
import uuid
from pathlib import Path
from typing import Tuple

from fastapi import HTTPException, UploadFile
from PIL import Image

from app.core.config import settings

UPLOAD_DIR = Path(settings.UPLOAD_DIR)
if not UPLOAD_DIR.is_absolute():
    # Determine base directory from file location
    # In Docker: /app/app/services/image_service.py -> base should be /app
    # Locally: backend/app/services/image_service.py -> base should be backend
    file_path = Path(__file__)
    # Check if we're in Docker (path starts with /app/app)
    if str(file_path).startswith("/app/app/"):
        # Running in Docker, use /app as base
        base_dir = Path("/app")
    else:
        # Local development: compute from file location
        base_dir = file_path.parent.parent.parent.parent
        if base_dir.name == "app" and base_dir.parent.name == "app":
            base_dir = base_dir.parent
    UPLOAD_DIR = base_dir / UPLOAD_DIR
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


class ImageService:
    """Service for processing and saving images."""

    MAX_WIDTH = 1920
    MAX_HEIGHT = 1080
    DEFAULT_QUALITY = 85
    RESIZED_QUALITY = 80
    UPLOAD_DIR = UPLOAD_DIR

    @staticmethod
    def get_upload_path(news_id: uuid.UUID) -> Path:
        """Get upload directory for specific news item."""
        news_dir = UPLOAD_DIR / "news" / str(news_id)
        news_dir.mkdir(parents=True, exist_ok=True)
        return news_dir

    @staticmethod
    def validate_image(file: UploadFile) -> None:
        """Validate uploaded image file."""
        if file.content_type not in settings.ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed types: {', '.join(settings.ALLOWED_IMAGE_TYPES)}",
            )

    @classmethod
    def save_image(
        cls, file: UploadFile, news_id: uuid.UUID
    ) -> Tuple[str, int]:
        """
        Save uploaded image, normalize to JPEG format and standard size.
        Returns relative path and file size.
        """
        cls.validate_image(file)

        unique_id = uuid.uuid4()
        file_name = f"{unique_id}.jpg"
        upload_path = cls.get_upload_path(news_id)
        file_path = upload_path / file_name

        temp_path = upload_path / f"{unique_id}_temp{Path(file.filename).suffix}"
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        temp_size = temp_path.stat().st_size
        if temp_size > settings.MAX_UPLOAD_SIZE:
            temp_path.unlink()
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size: {settings.MAX_UPLOAD_SIZE / 1024 / 1024}MB",
            )

        try:
            with Image.open(temp_path) as img:
                if img.mode != "RGB":
                    rgb_img = Image.new("RGB", img.size, (255, 255, 255))
                    if img.mode == "P":
                        img = img.convert("RGBA")
                    if img.mode in ("RGBA", "LA"):
                        rgb_img.paste(img, mask=img.split()[-1])
                    else:
                        rgb_img = img.convert("RGB")
                    img = rgb_img

                if img.width > cls.MAX_WIDTH or img.height > cls.MAX_HEIGHT:
                    ratio = min(cls.MAX_WIDTH / img.width, cls.MAX_HEIGHT / img.height)
                    new_size = (int(img.width * ratio), int(img.height * ratio))
                    img = img.resize(new_size, Image.Resampling.LANCZOS)
                    quality = cls.RESIZED_QUALITY
                else:
                    quality = cls.DEFAULT_QUALITY

                img.save(file_path, "JPEG", quality=quality, optimize=True)

        except Exception as e:
            try:
                with Image.open(temp_path) as img:
                    img.convert("RGB").save(file_path, "JPEG", quality=cls.DEFAULT_QUALITY)
            except Exception:
                if temp_path.exists():
                    temp_path.unlink()
                raise HTTPException(
                    status_code=400,
                    detail=f"Failed to process image: {str(e)}",
                )
        finally:
            if temp_path.exists() and temp_path != file_path:
                temp_path.unlink()

        file_size = file_path.stat().st_size
        relative_path = f"news/{news_id}/{file_name}"
        return relative_path, file_size


# Global instance
image_service = ImageService()
