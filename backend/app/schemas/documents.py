"""Document-related schemas."""
import uuid
from datetime import datetime

from sqlmodel import Field, SQLModel

from app.schemas.users import UserPublic


class DocumentCategoryCreate(SQLModel):
    """Schema for creating document category."""
    name: str = Field(min_length=1, max_length=100)


class DocumentCategoryUpdate(SQLModel):
    """Schema for updating document category (all fields optional)."""
    name: str | None = Field(default=None, min_length=1, max_length=100)  # type: ignore


class DocumentCategoryPublic(SQLModel):
    """Public document category schema for API responses."""
    id: uuid.UUID
    name: str
    created_at: datetime


class DocumentCategoriesPublic(SQLModel):
    """Document category list with count."""
    data: list[DocumentCategoryPublic]
    count: int


class DocumentCreate(SQLModel):
    """Schema for creating document."""
    name: str | None = Field(default=None, min_length=1, max_length=255)
    category_id: uuid.UUID | None = Field(default=None)
    category_name: str | None = Field(default=None, min_length=1, max_length=100)


class DocumentUpdate(SQLModel):
    """Schema for updating document (all fields optional)."""
    name: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore
    category_id: uuid.UUID | None = None


class DocumentPublic(SQLModel):
    """Public document schema for API responses."""
    id: uuid.UUID
    name: str
    file_name: str
    file_path: str
    file_size: int
    mime_type: str
    category_id: uuid.UUID | None = None
    category: DocumentCategoryPublic | None = None
    owner_id: uuid.UUID
    owner: UserPublic | None = None
    created_at: datetime
    updated_at: datetime


class DocumentsPublic(SQLModel):
    """Document list with count."""
    data: list[DocumentPublic]
    count: int
