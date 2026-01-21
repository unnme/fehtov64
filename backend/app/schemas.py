"""
Pydantic schemas for API requests and responses.
All schemas for API data serialization are located here.
"""
import uuid
from datetime import datetime
from typing import Optional

from pydantic import EmailStr
from sqlmodel import Field, SQLModel

# Import base classes from models for inheritance
from app.models import NewsBase, NewsImageBase, UserBase


# ============================================================================
# User Schemas
# ============================================================================


class UserCreate(SQLModel):
    """Schema for creating user via API."""
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=255)
    is_active: bool = Field(default=True)
    is_superuser: bool = Field(default=False)


class UserRegister(SQLModel):
    """Schema for new user registration."""
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=255)


class UserUpdate(SQLModel):
    """Schema for updating user (all fields optional).
    is_superuser can only be changed by superuser.
    """
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore
    password: str | None = Field(default=None, min_length=8, max_length=128)
    full_name: str | None = Field(default=None, min_length=1, max_length=255)
    is_active: bool | None = None
    is_superuser: bool | None = None  # Only superuser can change this field


class UserUpdateMe(SQLModel):
    """Schema for updating own user profile."""
    full_name: str | None = Field(default=None, min_length=1, max_length=255)
    # Email cannot be changed through this endpoint - use /users/me/email/verify
    email: EmailStr | None = None


class EmailVerificationRequest(SQLModel):
    """Schema for requesting email verification code."""
    new_email: EmailStr = Field(max_length=255)


class EmailVerificationCode(SQLModel):
    """Schema for email verification with code."""
    new_email: EmailStr = Field(max_length=255)
    code: str = Field(min_length=4, max_length=4)


class UserPublic(UserBase):
    """Public user schema for API responses."""
    id: uuid.UUID
    is_first_superuser: bool = False


class UsersPublic(SQLModel):
    """User list with count."""
    data: list[UserPublic]
    count: int


# ============================================================================
# News Schemas
# ============================================================================
# NewsBase imported from models


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


# ============================================================================
# News Image Schemas
# ============================================================================
# NewsImageBase imported from models


class NewsImagePublic(NewsImageBase):
    """Public news image schema for API responses."""
    id: uuid.UUID
    news_id: uuid.UUID
    created_at: datetime


# ============================================================================
# Tag Schemas
# ============================================================================

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


# ============================================================================
# Authentication Schemas
# ============================================================================

class Message(SQLModel):
    """Generic message for API responses."""
    message: str


class Token(SQLModel):
    """Access token schema."""
    access_token: str
    token_type: str = "bearer"


class TokenPayload(SQLModel):
    """JWT token payload."""
    sub: str | None = None


class NewPassword(SQLModel):
    """Schema for password reset."""
    token: str
    new_password: str = Field(min_length=8, max_length=128)


class UpdatePassword(SQLModel):
    """Schema for password update."""
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


# ============================================================================
# IP Blocking Schemas
# ============================================================================

class BlockedIPInfo(SQLModel):
    """Blocked IP address information."""
    ip: str
    blocked_until: float
    remaining_seconds: int
    failed_attempts_count: int
    first_attempt_time: float | None = None
    last_attempt_time: float | None = None
    block_reason: str
    user_agent: str | None = None
    attempted_emails: list[str] = []


class BlockedIPsList(SQLModel):
    """List of blocked IP addresses."""
    blocked_ips: list[BlockedIPInfo]
    count: int


# ============================================================================
# Private API Schemas (only for local development)
# ============================================================================

class PrivateUserCreate(SQLModel):
    """Model for creating user via private API (only for local development)."""
    email: str
    password: str
    full_name: str
    is_verified: bool = False


# ============================================================================
# Document Category Schemas
# ============================================================================

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


# ============================================================================
# Document Schemas
# ============================================================================

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

