"""Document file service for saving and managing document files."""
import shutil
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile

from app.core.config import settings

UPLOAD_DIR = Path(settings.UPLOAD_DIR)
if not UPLOAD_DIR.is_absolute():
    # Determine base directory from file location
    # In Docker: /app/app/services/document_service.py -> base should be /app
    # Locally: backend/app/services/document_service.py -> base should be backend
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


class DocumentService:
    """Service for processing and saving document files."""

    UPLOAD_DIR = UPLOAD_DIR

    @staticmethod
    def get_upload_path() -> Path:
        """Get upload directory for documents."""
        docs_dir = UPLOAD_DIR / "documents"
        docs_dir.mkdir(parents=True, exist_ok=True)
        return docs_dir

    @staticmethod
    def validate_document(file: UploadFile) -> None:
        """Validate uploaded document file."""
        # Check MIME type
        if file.content_type not in settings.ALLOWED_DOCUMENT_TYPES:
            # Fallback: check file extension
            file_ext = Path(file.filename or "").suffix.lower()
            allowed_extensions = [
                ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
                ".txt", ".rtf", ".odt", ".ods", ".odp"
            ]
            if file_ext not in allowed_extensions:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid file type. Allowed types: {', '.join(settings.ALLOWED_DOCUMENT_TYPES)}",
                )

    @staticmethod
    def get_file_extension(filename: str) -> str:
        """Get file extension from filename."""
        return Path(filename).suffix.lower()

    @classmethod
    def save_document(
        cls, file: UploadFile
    ) -> tuple[str, int]:
        """
        Save uploaded document file.
        Returns relative path and file size.
        """
        cls.validate_document(file)

        # Generate unique filename
        unique_id = uuid.uuid4()
        file_ext = cls.get_file_extension(file.filename or "file")
        if not file_ext:
            # Try to determine extension from MIME type
            mime_to_ext = {
                "application/pdf": ".pdf",
                "application/msword": ".doc",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
                "application/vnd.ms-excel": ".xls",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
                "application/vnd.ms-powerpoint": ".ppt",
                "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
                "text/plain": ".txt",
                "application/rtf": ".rtf",
                "application/vnd.oasis.opendocument.text": ".odt",
                "application/vnd.oasis.opendocument.spreadsheet": ".ods",
                "application/vnd.oasis.opendocument.presentation": ".odp",
            }
            file_ext = mime_to_ext.get(file.content_type or "", ".bin")

        file_name = f"{unique_id}{file_ext}"
        upload_path = cls.get_upload_path()
        file_path = upload_path / file_name

        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Check file size
        file_size = file_path.stat().st_size
        if file_size > settings.MAX_DOCUMENT_SIZE:
            file_path.unlink()
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size: {settings.MAX_DOCUMENT_SIZE / 1024 / 1024}MB",
            )

        relative_path = f"documents/{file_name}"
        return relative_path, file_size

    @classmethod
    def delete_document(cls, file_path: str) -> None:
        """
        Delete document file from disk.

        Args:
            file_path: Relative path to document file
        """
        full_path = cls.UPLOAD_DIR / file_path
        if full_path.exists() and full_path.is_file():
            try:
                full_path.unlink()
            except Exception:
                # Log error but don't fail
                pass


# Global instance
document_service = DocumentService()
