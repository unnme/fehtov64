"""
SQLModel models for database.
Only database tables and their base classes are located here.
All API schemas are in schemas.py.
"""
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from sqlmodel import RelationshipProperty


class UserBase(SQLModel):
    """Base user properties for database table."""
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)


class User(UserBase, table=True):
    """User model in database."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    news: list["News"] = Relationship(back_populates="owner", cascade_delete=True)


class NewsBase(SQLModel):
    """Base news properties for database table."""
    title: str = Field(min_length=1, max_length=255)
    content: str = Field(min_length=1)
    is_published: bool = Field(default=False)


class News(NewsBase, table=True):
    """News model in database."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    published_at: datetime | None = Field(default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    owner: "User" = Relationship(back_populates="news")
    images: list["NewsImage"] = Relationship(back_populates="news", cascade_delete=True)


class NewsImageBase(SQLModel):
    """Base news image properties for database table."""
    file_name: str = Field(max_length=255)
    file_path: str = Field(max_length=512)
    file_size: int
    mime_type: str = Field(max_length=100)
    order: int = Field(default=0)
    is_main: bool = Field(default=False)


class NewsImage(NewsImageBase, table=True):
    """News image model in database."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    news_id: uuid.UUID = Field(
        foreign_key="news.id", nullable=False, ondelete="CASCADE"
    )
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    news: "News" = Relationship(back_populates="images")


