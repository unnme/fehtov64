"""News-related schemas."""
import uuid
from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel

from app.models import NewsBase, NewsImageBase
from app.schemas.users import UserPublic


class NewsCreate(NewsBase):
    """Schema for creating news."""


class NewsUpdate(SQLModel):
    """Schema for updating news (all fields optional)."""
    title: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore
    content: str | None = Field(default=None, min_length=1)  # type: ignore
    is_published: bool | None = None
    owner_id: uuid.UUID | None = None


class NewsPublic(NewsBase):
    """Public news schema for API responses."""
    id: uuid.UUID
    owner_id: uuid.UUID
    owner: Optional["UserPublic"] = None
    published_at: datetime | None
    created_at: datetime
    updated_at: datetime
    images: list["NewsImagePublic"] | None = None


class NewsPublicList(SQLModel):
    """News list with count."""
    data: list[NewsPublic]
    count: int


class NewsImagePublic(NewsImageBase):
    """Public news image schema for API responses."""
    id: uuid.UUID
    news_id: uuid.UUID
    created_at: datetime


class TagPublic(SQLModel):
    """Public tag schema for API responses."""
    id: uuid.UUID
    name: str


class TagsPublic(SQLModel):
    """Tag list with count."""
    data: list[TagPublic]
    count: int


class NewsImageList(SQLModel):
    """News image list with count."""
    data: list[NewsImagePublic]
    count: int
