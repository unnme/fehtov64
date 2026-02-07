"""Document file service for saving and managing document files."""
import shutil
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any

from fastapi import HTTPException, UploadFile
from pydantic import BaseModel

from app.core.config import settings


class SignatureInfo(BaseModel):
    """Information about PDF digital signature."""
    signer_name: str | None = None
    signer_position: str | None = None
    signing_time: datetime | None = None
    signature_hash: str | None = None
    is_signed: bool = False

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


    @classmethod
    def get_signature_info(cls, file_path: str) -> SignatureInfo:
        """
        Extract digital signature information from PDF file.

        Args:
            file_path: Relative path to document file

        Returns:
            SignatureInfo with signature details or is_signed=False if not signed
        """
        full_path = cls.UPLOAD_DIR / file_path

        if not full_path.exists() or not full_path.is_file():
            return SignatureInfo(is_signed=False)

        if not str(full_path).lower().endswith(".pdf"):
            return SignatureInfo(is_signed=False)

        try:
            from pypdf import PdfReader

            reader = PdfReader(str(full_path))

            if "/AcroForm" not in reader.trailer.get("/Root", {}):
                return SignatureInfo(is_signed=False)

            root = reader.trailer["/Root"]
            if "/AcroForm" not in root:
                return SignatureInfo(is_signed=False)

            acro_form = root["/AcroForm"]
            if "/Fields" not in acro_form:
                return SignatureInfo(is_signed=False)

            fields = acro_form["/Fields"]

            for field_ref in fields:
                field = field_ref.get_object()
                field_type = field.get("/FT")

                if field_type == "/Sig":
                    sig_value = field.get("/V")
                    if sig_value is None:
                        continue

                    sig_obj = sig_value.get_object() if hasattr(sig_value, "get_object") else sig_value

                    signer_name = None
                    signer_position = None
                    signing_time = None
                    signature_hash = None

                    if "/Name" in sig_obj:
                        signer_name = str(sig_obj["/Name"])

                    if "/Reason" in sig_obj:
                        signer_position = str(sig_obj["/Reason"])

                    if "/M" in sig_obj:
                        time_str = str(sig_obj["/M"])
                        signing_time = cls._parse_pdf_date(time_str)

                    if "/Contents" in sig_obj:
                        contents = sig_obj["/Contents"]
                        if isinstance(contents, bytes):
                            signature_hash = contents[:32].hex().upper()
                        else:
                            signature_hash = str(contents)[:64].upper()

                    return SignatureInfo(
                        signer_name=signer_name,
                        signer_position=signer_position,
                        signing_time=signing_time,
                        signature_hash=signature_hash,
                        is_signed=True,
                    )

            return SignatureInfo(is_signed=False)

        except Exception:
            return SignatureInfo(is_signed=False)

    @staticmethod
    def _parse_pdf_date(date_str: str) -> datetime | None:
        """Parse PDF date string format: D:YYYYMMDDHHmmSS+HH'mm'"""
        try:
            if date_str.startswith("D:"):
                date_str = date_str[2:]

            date_str = date_str.replace("'", "")

            if len(date_str) >= 14:
                year = int(date_str[0:4])
                month = int(date_str[4:6])
                day = int(date_str[6:8])
                hour = int(date_str[8:10])
                minute = int(date_str[10:12])
                second = int(date_str[12:14])
                return datetime(year, month, day, hour, minute, second)
            elif len(date_str) >= 8:
                year = int(date_str[0:4])
                month = int(date_str[4:6])
                day = int(date_str[6:8])
                return datetime(year, month, day)
        except (ValueError, IndexError):
            pass
        return None


# Global instance
document_service = DocumentService()
