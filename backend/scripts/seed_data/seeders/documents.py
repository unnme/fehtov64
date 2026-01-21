"""
Test documents and categories creation.
"""

import logging
import random
import shutil
import uuid
from datetime import datetime, timezone
from pathlib import Path

from sqlmodel import Session, select

from app.core.config import settings
from app.models import Document, DocumentCategory, User
from app.services.document_service import document_service

from ..constants import MIME_TYPE_MAP, TEST_DOCUMENT_CATEGORIES

logger = logging.getLogger(__name__)

# Constants for document creation
CATEGORY_ASSIGNMENT_PROBABILITY = 0.7  # Probability of assigning a category to a document


def get_superuser(session: Session) -> User | None:
    """Gets the superuser."""
    return session.exec(
        select(User).where(User.email == settings.FIRST_SUPERUSER)
    ).first()


def create_test_categories(session: Session) -> list[DocumentCategory]:
    """Creates test document categories."""
    created_categories = []
    for category_name in TEST_DOCUMENT_CATEGORIES:
        existing_category = session.exec(
            select(DocumentCategory).where(DocumentCategory.name == category_name)
        ).first()

        if existing_category:
            created_categories.append(existing_category)
            logger.info(f"Category '{category_name}' already exists, skipping")
        else:
            category = DocumentCategory(name=category_name)
            session.add(category)
            session.commit()
            session.refresh(category)
            created_categories.append(category)
            logger.info(f"Created category: {category_name}")

    return created_categories


def get_mime_type(file_ext: str) -> str:
    """Determines MIME type by file extension."""
    return MIME_TYPE_MAP.get(file_ext.lower(), "application/octet-stream")


def save_document_from_file(
    session: Session,
    document_file_name: str,
    owner_id: uuid.UUID,
    name: str | None = None,
    category_id: uuid.UUID | None = None,
) -> None:
    """Saves a document from a local file."""
    try:
        # Get fixtures directory (two levels up from seeders/)
        fixtures_dir = Path(__file__).parent.parent / "fixtures"
        documents_dir = fixtures_dir / "documents"
        document_path = documents_dir / document_file_name

        if not document_path.exists():
            logger.warning(f"Document file not found: {document_path}")
            return

        file_size_check = document_path.stat().st_size
        if file_size_check > settings.MAX_DOCUMENT_SIZE:
            logger.warning(f"Document {document_file_name} is too large, skipping")
            return

        # Copy file to upload directory
        upload_path = document_service.get_upload_path()
        unique_id = uuid.uuid4()
        file_ext = Path(document_file_name).suffix.lower()
        file_name = f"{unique_id}{file_ext}"
        file_path = upload_path / file_name

        shutil.copy2(document_path, file_path)

        if not file_path.exists():
            logger.error(f"Document file was not created: {file_path}")
            return

        file_size = file_path.stat().st_size
        relative_path = f"documents/{file_name}"
        mime_type = get_mime_type(file_ext)

        # Determine document name
        if not name:
            name = Path(document_file_name).stem

        document = Document(
            name=name,
            file_name=document_file_name,
            file_path=relative_path,
            file_size=file_size,
            mime_type=mime_type,
            category_id=category_id,
            owner_id=owner_id,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        session.add(document)
        session.flush()
        logger.info(f"Saved document {document_file_name} for user {owner_id}")
    except Exception as e:
        logger.error(f"Failed to save document {document_file_name}: {e}", exc_info=True)


def create_test_documents(session: Session) -> None:
    """Creates test documents for the superuser."""
    if settings.ENVIRONMENT != "local":
        logger.info("Seed documents are disabled outside local environment")
        return

    superuser = get_superuser(session)
    if not superuser:
        logger.warning("Superuser not found, cannot create test documents")
        return

    # Create categories first
    categories = create_test_categories(session)
    session.commit()

    # Get all document files
    fixtures_dir = Path(__file__).parent.parent / "fixtures"
    documents_dir = fixtures_dir / "documents"
    if not documents_dir.exists():
        logger.warning(f"Documents directory not found: {documents_dir}")
        return

    document_files = list(documents_dir.glob("test*.*"))
    if not document_files:
        logger.warning("No test document files found")
        return

    # Create documents from files
    created_count = 0
    updated_count = 0
    skipped_count = 0

    for doc_file in document_files:
        file_name = doc_file.name
        document_name = doc_file.stem.replace("test", "Test Document").replace("_", " ")

        # Check if document already exists
        existing_doc = session.exec(
            select(Document).where(
                Document.file_name == file_name,
                Document.owner_id == superuser.id
            )
        ).first()

        # Randomly assign category (70% probability) or leave None (30% probability)
        category_id = None
        if categories and random.random() < CATEGORY_ASSIGNMENT_PROBABILITY:
            category = random.choice(categories)
            category_id = category.id

        if existing_doc:
            # Update existing document with category if it doesn't have one
            if not existing_doc.category_id:
                if category_id:
                    existing_doc.category_id = category_id
                    existing_doc.updated_at = datetime.now(timezone.utc)
                    session.add(existing_doc)
                    updated_count += 1
                else:
                    skipped_count += 1
            else:
                skipped_count += 1
            continue

        save_document_from_file(
            session=session,
            document_file_name=file_name,
            owner_id=superuser.id,
            name=document_name,
            category_id=category_id,
        )
        created_count += 1

    session.commit()
    logger.info(
        f"Created {created_count} test documents, "
        f"updated {updated_count} existing, "
        f"skipped {skipped_count} existing"
    )
