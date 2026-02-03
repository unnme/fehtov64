"""Document routes for uploading and managing documents."""

import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Annotated, Any

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlmodel import Session, func, select

from app.api.deps import CurrentUser, SessionDep
from app.core.db import engine
from app.core.errors import (
    BadRequestError,
    ConflictError,
    ErrorCode,
    ForbiddenError,
    NotFoundError,
)
from app.models import Document, DocumentCategory
from app.schemas import (
    DocumentCategoriesPublic,
    DocumentCategoryCreate,
    DocumentCategoryPublic,
    DocumentCategoryUpdate,
    DocumentPublic,
    DocumentsPublic,
    DocumentUpdate,
    Message,
)
from app.services.document_service import document_service

router = APIRouter(prefix="/documents", tags=["documents"])

public_router = APIRouter(prefix="/documents", tags=["documents"])


# ============================================================================
# Document Category Routes
# ============================================================================


@router.get("/categories", response_model=DocumentCategoriesPublic)
def read_categories(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """Get all document categories."""
    count_statement = select(func.count()).select_from(DocumentCategory)
    count = session.exec(count_statement).one()

    statement = (
        select(DocumentCategory)
        .offset(skip)
        .limit(limit)
        .order_by(DocumentCategory.name)
    )
    categories = session.exec(statement).all()

    return DocumentCategoriesPublic(
        data=[
            DocumentCategoryPublic(id=c.id, name=c.name, created_at=c.created_at)
            for c in categories
        ],
        count=count,
    )


@public_router.get("/public/categories", response_model=DocumentCategoriesPublic)
def read_public_categories(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """Get all document categories (public)."""
    count_statement = select(func.count()).select_from(DocumentCategory)
    count = session.exec(count_statement).one()

    statement = (
        select(DocumentCategory)
        .offset(skip)
        .limit(limit)
        .order_by(DocumentCategory.name)
    )
    categories = session.exec(statement).all()

    return DocumentCategoriesPublic(
        data=[
            DocumentCategoryPublic(id=c.id, name=c.name, created_at=c.created_at)
            for c in categories
        ],
        count=count,
    )


@router.post("/categories", response_model=DocumentCategoryPublic)
def create_category(
    session: SessionDep,
    category_in: DocumentCategoryCreate,
    _current_user: CurrentUser,
) -> Any:
    """Create a new document category."""
    # Check if category already exists
    existing = session.exec(
        select(DocumentCategory).where(DocumentCategory.name == category_in.name)
    ).first()
    if existing:
        raise ConflictError(ErrorCode.CATEGORY_EXISTS, "Category already exists")

    category = DocumentCategory(name=category_in.name)
    session.add(category)
    session.commit()
    session.refresh(category)

    return DocumentCategoryPublic(
        id=category.id, name=category.name, created_at=category.created_at
    )


@router.patch("/categories/{category_id}", response_model=DocumentCategoryPublic)
def update_category(
    category_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
    category_in: DocumentCategoryUpdate,
) -> Any:
    """Update a document category."""
    if not current_user.is_superuser:
        raise ForbiddenError(ErrorCode.CATEGORY_FORBIDDEN, "Not enough permissions")

    category = session.get(DocumentCategory, category_id)
    if not category:
        raise NotFoundError(ErrorCode.CATEGORY_NOT_FOUND, "Category not found")

    # Update name if provided
    if category_in.name is not None:
        # Check if category with this name already exists (excluding current category)
        existing = session.exec(
            select(DocumentCategory).where(
                DocumentCategory.name == category_in.name,
                DocumentCategory.id != category_id,
            )
        ).first()
        if existing:
            raise ConflictError(ErrorCode.CATEGORY_EXISTS, "Category already exists")
        category.name = category_in.name

    session.add(category)
    session.commit()
    session.refresh(category)

    return DocumentCategoryPublic(
        id=category.id, name=category.name, created_at=category.created_at
    )


@router.delete("/categories/{category_id}", response_model=Message)
def delete_category(
    category_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """Delete a document category. Sets category_id to None for all associated documents."""
    if not current_user.is_superuser:
        raise ForbiddenError(ErrorCode.CATEGORY_FORBIDDEN, "Not enough permissions")

    category = session.get(DocumentCategory, category_id)
    if not category:
        raise NotFoundError(ErrorCode.CATEGORY_NOT_FOUND, "Category not found")

    # Set category_id to None for all documents with this category
    documents = session.exec(
        select(Document).where(Document.category_id == category_id)
    ).all()
    for document in documents:
        document.category_id = None
        session.add(document)

    # Delete category
    session.delete(category)
    session.commit()

    return Message(message="Category deleted successfully")


# ============================================================================
# Document Routes
# ============================================================================


@router.get("/", response_model=DocumentsPublic)
def read_documents(
    session: SessionDep,
    current_user: CurrentUser,
    category_id: uuid.UUID | None = None,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """Get all documents, optionally filtered by category."""
    statement = select(Document)

    # Filter by category if provided
    if category_id:
        statement = statement.where(Document.category_id == category_id)

    # All users can see all documents (no filtering by owner)

    count_statement = select(func.count()).select_from(statement.subquery())
    count = session.exec(count_statement).one()

    statement = statement.order_by(Document.created_at.desc()).offset(skip).limit(limit)
    documents = session.exec(statement).all()

    # Load relationships
    for doc in documents:
        if doc.category_id:
            doc.category = session.get(DocumentCategory, doc.category_id)
        doc.owner = session.get(type(current_user), doc.owner_id)

    return DocumentsPublic(
        data=[
            DocumentPublic(
                id=d.id,
                name=d.name,
                file_name=d.file_name,
                file_path=d.file_path,
                file_size=d.file_size,
                mime_type=d.mime_type,
                category_id=d.category_id,
                category=DocumentCategoryPublic(
                    id=d.category.id,
                    name=d.category.name,
                    created_at=d.category.created_at,
                )
                if d.category
                else None,
                owner_id=d.owner_id,
                owner=None,  # Don't expose owner details in list
                created_at=d.created_at,
                updated_at=d.updated_at,
            )
            for d in documents
        ],
        count=count,
    )


@public_router.get("/public", response_model=DocumentsPublic)
def read_public_documents(
    session: SessionDep,
    category_id: uuid.UUID | None = None,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """Get all documents (public), optionally filtered by category."""
    statement = select(Document)

    if category_id:
        statement = statement.where(Document.category_id == category_id)

    count_statement = select(func.count()).select_from(statement.subquery())
    count = session.exec(count_statement).one()

    statement = statement.order_by(Document.created_at.desc()).offset(skip).limit(limit)
    documents = session.exec(statement).all()

    for doc in documents:
        if doc.category_id:
            doc.category = session.get(DocumentCategory, doc.category_id)

    return DocumentsPublic(
        data=[
            DocumentPublic(
                id=d.id,
                name=d.name,
                file_name=d.file_name,
                file_path=d.file_path,
                file_size=d.file_size,
                mime_type=d.mime_type,
                category_id=d.category_id,
                category=DocumentCategoryPublic(
                    id=d.category.id,
                    name=d.category.name,
                    created_at=d.category.created_at,
                )
                if d.category
                else None,
                owner_id=d.owner_id,
                owner=None,
                created_at=d.created_at,
                updated_at=d.updated_at,
            )
            for d in documents
        ],
        count=count,
    )


@router.post("/", response_model=DocumentPublic)
async def create_document(
    session: SessionDep,
    current_user: CurrentUser,
    file: Annotated[UploadFile, File()],
    name: Annotated[str | None, Form()] = None,
    category_id: Annotated[str | None, Form()] = None,
) -> Any:
    """Upload a new document."""
    # Determine document name (default to filename without extension)
    if not name:
        filename = file.filename or "document"
        name = Path(filename).stem

    # Determine category (optional)
    category: DocumentCategory | None = None
    if category_id and category_id.strip():
        try:
            category_uuid = uuid.UUID(category_id)
            category = session.get(DocumentCategory, category_uuid)
            if not category:
                raise NotFoundError(ErrorCode.CATEGORY_NOT_FOUND, "Category not found")
        except ValueError:
            raise BadRequestError(
                ErrorCode.CATEGORY_INVALID_ID, "Invalid category_id format"
            )

    # Save file
    file_path, file_size = document_service.save_document(file)

    # Determine MIME type
    file_ext = Path(file.filename or "").suffix.lower()
    mime_type_map = {
        ".pdf": "application/pdf",
        ".doc": "application/msword",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".xls": "application/vnd.ms-excel",
        ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".ppt": "application/vnd.ms-powerpoint",
        ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ".txt": "text/plain",
        ".rtf": "application/rtf",
        ".odt": "application/vnd.oasis.opendocument.text",
        ".ods": "application/vnd.oasis.opendocument.spreadsheet",
        ".odp": "application/vnd.oasis.opendocument.presentation",
    }
    mime_type = mime_type_map.get(
        file_ext, file.content_type or "application/octet-stream"
    )

    # Create document record
    document = Document(
        name=name,
        file_name=file.filename or "document",
        file_path=file_path,
        file_size=file_size,
        mime_type=mime_type,
        category_id=category.id if category else None,
        owner_id=current_user.id,
    )
    session.add(document)
    session.commit()
    session.refresh(document)

    # Load relationships
    if category:
        document.category = category

    return DocumentPublic(
        id=document.id,
        name=document.name,
        file_name=document.file_name,
        file_path=document.file_path,
        file_size=document.file_size,
        mime_type=document.mime_type,
        category_id=document.category_id,
        category=DocumentCategoryPublic(
            id=category.id,
            name=category.name,
            created_at=category.created_at,
        )
        if category
        else None,
        owner_id=document.owner_id,
        owner=None,
        created_at=document.created_at,
        updated_at=document.updated_at,
    )


@router.get("/{document_id}", response_model=DocumentPublic)
def read_document(
    document_id: uuid.UUID,
    session: SessionDep,
) -> Any:
    """Get a specific document."""
    document = session.get(Document, document_id)
    if not document:
        raise NotFoundError(ErrorCode.DOCUMENT_NOT_FOUND, "Document not found")

    # Get category (if exists)
    category = None
    if document.category_id:
        category = session.get(DocumentCategory, document.category_id)

    # Get owner
    from app.models import User
    from app.schemas import UserPublic

    owner = session.get(User, document.owner_id)
    owner_public = (
        UserPublic(
            id=owner.id,
            email=owner.email,
            is_active=owner.is_active,
            is_superuser=owner.is_superuser,
            nickname=owner.nickname,
        )
        if owner
        else None
    )

    return DocumentPublic(
        id=document.id,
        name=document.name,
        file_name=document.file_name,
        file_path=document.file_path,
        file_size=document.file_size,
        mime_type=document.mime_type,
        category_id=document.category_id,
        category=DocumentCategoryPublic(
            id=category.id,
            name=category.name,
            created_at=category.created_at,
        )
        if category
        else None,
        owner_id=document.owner_id,
        owner=owner_public,
        created_at=document.created_at,
        updated_at=document.updated_at,
    )


@public_router.get("/{document_id}/file")
def get_document_file(
    document_id: uuid.UUID,
) -> FileResponse:
    """Download document file. Public endpoint."""
    with Session(engine) as session:
        document = session.get(Document, document_id)
        if not document:
            raise NotFoundError(ErrorCode.DOCUMENT_NOT_FOUND, "Document not found")

        file_path = document_service.UPLOAD_DIR / document.file_path
        if not file_path.exists():
            raise NotFoundError(ErrorCode.DOCUMENT_FILE_NOT_FOUND, "File not found")

        return FileResponse(
            path=str(file_path),
            filename=document.file_name,
            media_type=document.mime_type,
        )


@router.patch("/{document_id}", response_model=DocumentPublic)
def update_document(
    document_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
    document_in: DocumentUpdate,
) -> Any:
    """Update document (name or category)."""
    document = session.get(Document, document_id)
    if not document:
        raise NotFoundError(ErrorCode.DOCUMENT_NOT_FOUND, "Document not found")

    # Only owner or superuser can update
    if not current_user.is_superuser and document.owner_id != current_user.id:
        raise ForbiddenError(ErrorCode.DOCUMENT_FORBIDDEN, "Not enough permissions")

    # Update name if provided
    if document_in.name:
        document.name = document_in.name

    # Update category if provided (can be set to None to remove category)
    # Check if category_id was explicitly provided in the request
    update_data = document_in.model_dump(exclude_unset=True)
    if "category_id" in update_data:
        if document_in.category_id:
            category = session.get(DocumentCategory, document_in.category_id)
            if not category:
                raise NotFoundError(ErrorCode.CATEGORY_NOT_FOUND, "Category not found")
            document.category_id = document_in.category_id
        else:
            # Set category_id to None to remove category
            document.category_id = None

    document.updated_at = datetime.now(timezone.utc)

    session.add(document)
    session.commit()
    session.refresh(document)

    # Load relationships
    category = None
    if document.category_id:
        category = session.get(DocumentCategory, document.category_id)
    from app.models import User
    from app.schemas import UserPublic

    owner = session.get(User, document.owner_id)
    owner_public = (
        UserPublic(
            id=owner.id,
            email=owner.email,
            is_active=owner.is_active,
            is_superuser=owner.is_superuser,
            nickname=owner.nickname,
        )
        if owner
        else None
    )

    return DocumentPublic(
        id=document.id,
        name=document.name,
        file_name=document.file_name,
        file_path=document.file_path,
        file_size=document.file_size,
        mime_type=document.mime_type,
        category_id=document.category_id,
        category=DocumentCategoryPublic(
            id=category.id,
            name=category.name,
            created_at=category.created_at,
        )
        if category
        else None,
        owner_id=document.owner_id,
        owner=owner_public,
        created_at=document.created_at,
        updated_at=document.updated_at,
    )


@router.delete("/{document_id}", response_model=Message)
def delete_document(
    document_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """Delete document and its file."""
    document = session.get(Document, document_id)
    if not document:
        raise NotFoundError(ErrorCode.DOCUMENT_NOT_FOUND, "Document not found")

    # Only owner or superuser can delete
    if not current_user.is_superuser and document.owner_id != current_user.id:
        raise ForbiddenError(ErrorCode.DOCUMENT_FORBIDDEN, "Not enough permissions")

    # Delete file from disk
    document_service.delete_document(document.file_path)

    # Delete from database
    session.delete(document)
    session.commit()

    return Message(message="Document deleted successfully")
