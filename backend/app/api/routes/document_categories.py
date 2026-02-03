"""Document category routes."""

import uuid
from typing import Any

from fastapi import APIRouter
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.core.errors import ConflictError, ErrorCode, ForbiddenError, NotFoundError
from app.models import Document, DocumentCategory
from app.schemas import (
    DocumentCategoriesPublic,
    DocumentCategoryCreate,
    DocumentCategoryPublic,
    DocumentCategoryUpdate,
    Message,
)

router = APIRouter(prefix="/documents", tags=["document-categories"])

public_router = APIRouter(prefix="/documents/public", tags=["document-categories"])


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


@public_router.get("/categories", response_model=DocumentCategoriesPublic)
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

    if category_in.name is not None:
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

    documents = session.exec(
        select(Document).where(Document.category_id == category_id)
    ).all()
    for document in documents:
        document.category_id = None
        session.add(document)

    session.delete(category)
    session.commit()

    return Message(message="Category deleted successfully")
