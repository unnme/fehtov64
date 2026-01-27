"""
Pydantic schemas for API requests and responses.
All schemas for API data serialization are located here.
"""
import re
import uuid
from datetime import datetime
from typing import Optional

from pydantic import EmailStr, field_validator
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
# Position Schemas
# ============================================================================


class PositionCreate(SQLModel):
    """Schema for creating position."""
    name: str = Field(min_length=1, max_length=255)

    @field_validator("name", mode="before")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        return _normalize_position_name(value=value)


class PositionUpdate(SQLModel):
    """Schema for updating position (all fields optional)."""
    name: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore

    @field_validator("name", mode="before")
    @classmethod
    def normalize_name(cls, value: str | None) -> str | None:
        if value is None:
            return value
        return _normalize_position_name(value=value)


class PositionPublic(SQLModel):
    """Public position schema for API responses."""
    id: uuid.UUID
    name: str
    created_at: datetime


class PositionsPublic(SQLModel):
    """Position list with count."""
    data: list[PositionPublic]
    count: int


# ============================================================================
# Organization Card Schemas
# ============================================================================


def _normalize_optional_str(value: str | None) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str):
        raise ValueError("Значение должно быть строкой")
    trimmed = value.strip()
    return trimmed if trimmed else None


def _normalize_phone_list(*, value: list[dict | str], allow_empty: bool = False) -> list[dict]:
    """Normalizes phone list to format {phone: str, description: str | None}."""
    if not isinstance(value, list):
        raise ValueError("Телефоны должны быть списком")
    
    normalized = []
    for item in value:
        if isinstance(item, dict):
            phone = item.get("phone", "")
            if phone:
                phone = str(phone).strip()
            description = item.get("description")
            if description is not None:
                description = str(description).strip() or None
            else:
                description = None
            if phone:
                normalized.append({"phone": phone, "description": description})
        elif isinstance(item, str):
            item = item.strip()
            if item:
                if " - " in item:
                    parts = item.split(" - ", 1)
                    normalized.append({"phone": parts[0].strip(), "description": parts[1].strip() or None})
                else:
                    normalized.append({"phone": item, "description": None})
    
    if not normalized and not allow_empty:
        raise ValueError("Укажите хотя бы один телефон")
    return normalized


class OrganizationCardCreate(SQLModel):
    """Schema for creating organization card."""
    name: str = Field(default='', max_length=255)
    phones: list[dict] = Field(default_factory=list)
    email: str = Field(default='', max_length=255)
    address: str = Field(default='', max_length=500)
    work_hours: str = Field(default='', max_length=500)
    vk_url: str | None = Field(default=None, max_length=500)
    telegram_url: str | None = Field(default=None, max_length=500)
    whatsapp_url: str | None = Field(default=None, max_length=500)
    max_url: str | None = Field(default=None, max_length=500)
    latitude: float | None = None
    longitude: float | None = None

    @field_validator("phones", mode="before")
    @classmethod
    def normalize_phones(cls, value: list[dict | str] | None) -> list[dict]:
        if value is None:
            return []
        return _normalize_phone_list(value=value, allow_empty=True)
    
    @field_validator("email", mode="before")
    @classmethod
    def validate_email(cls, value: str | None) -> str:
        if value is None or not value.strip():
            return ''
        import re
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, value.strip()):
            raise ValueError("Неверный формат email")
        return value.strip()

    @field_validator(
        "vk_url",
        "telegram_url",
        "whatsapp_url",
        "max_url",
        mode="before",
    )
    @classmethod
    def normalize_optional_links(cls, value: str | None) -> str | None:
        return _normalize_optional_str(value)


class OrganizationCardUpdate(SQLModel):
    """Schema for updating organization card (all fields optional)."""
    name: str | None = Field(default=None, max_length=255)  # type: ignore
    phones: list[dict] | None = None
    email: str | None = Field(default=None, max_length=255)  # type: ignore
    address: str | None = Field(default=None, max_length=500)  # type: ignore
    work_hours: str | None = Field(default=None, max_length=500)  # type: ignore
    vk_url: str | None = Field(default=None, max_length=500)  # type: ignore
    telegram_url: str | None = Field(default=None, max_length=500)  # type: ignore
    whatsapp_url: str | None = Field(default=None, max_length=500)  # type: ignore
    max_url: str | None = Field(default=None, max_length=500)  # type: ignore
    latitude: float | None = None
    longitude: float | None = None

    @field_validator("phones", mode="before")
    @classmethod
    def normalize_phones(cls, value: list[dict | str] | None) -> list[dict] | None:
        if value is None:
            return value
        return _normalize_phone_list(value=value, allow_empty=True)
    
    @field_validator("email", mode="before")
    @classmethod
    def validate_email(cls, value: str | None) -> str | None:
        if value is None or not value.strip():
            return None
        import re
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, value.strip()):
            raise ValueError("Неверный формат email")
        return value.strip()

    @field_validator(
        "vk_url",
        "telegram_url",
        "whatsapp_url",
        "max_url",
        mode="before",
    )
    @classmethod
    def normalize_optional_links(cls, value: str | None) -> str | None:
        return _normalize_optional_str(value)


class OrganizationCardPublic(SQLModel):
    """Public organization card schema."""
    id: uuid.UUID
    name: str
    phones: list[dict]
    email: EmailStr
    address: str
    work_hours: str
    vk_url: str | None
    telegram_url: str | None
    whatsapp_url: str | None
    max_url: str | None
    latitude: float | None
    longitude: float | None
    created_at: datetime
    updated_at: datetime

# ============================================================================
# Person Schemas
# ============================================================================


_NAME_PART_PATTERN = re.compile(r"^[A-Za-zА-Яа-яЁё]+$")


def _capitalize_name_part(value: str) -> str:
    if not value:
        return value
    lower_value = value.lower()
    return lower_value[0].upper() + lower_value[1:]


def _normalize_person_name(*, value: str, allow_hyphen: bool) -> str:
    if not isinstance(value, str):
        raise ValueError("Имя должно быть строкой")
    trimmed = value.strip()
    if not trimmed:
        raise ValueError("Значение не должно быть пустым")
    if re.search(r"\s", trimmed):
        raise ValueError("Допускается одно слово без пробелов")

    if not allow_hyphen:
        if not _NAME_PART_PATTERN.match(trimmed):
            raise ValueError("Допускаются только буквы")
        return _capitalize_name_part(trimmed)

    parts = trimmed.split("-")
    if len(parts) > 2 or any(part == "" for part in parts):
        raise ValueError("Допускается одно тире в фамилии")
    if not all(_NAME_PART_PATTERN.match(part) for part in parts):
        raise ValueError("Допускаются только буквы и одно тире")
    return "-".join(_capitalize_name_part(part) for part in parts)


def _normalize_position_name(*, value: str) -> str:
    if not isinstance(value, str):
        raise ValueError("Название должно быть строкой")
    trimmed = value.strip()
    if not trimmed:
        raise ValueError("Название не должно быть пустым")
    normalized = re.sub(r"\s+", " ", trimmed)
    if not re.fullmatch(r"[A-Za-zА-Яа-яЁё ]+", normalized):
        raise ValueError("Название: допускаются только буквы и пробелы, без тире")
    first = normalized[0]
    return first.upper() + normalized[1:]


class PersonCreate(SQLModel):
    """Schema for creating person."""
    last_name: str = Field(min_length=1, max_length=255)
    first_name: str = Field(min_length=1, max_length=255)
    middle_name: str = Field(min_length=1, max_length=255)
    phone: str = Field(min_length=1, max_length=50)
    email: EmailStr = Field(max_length=255)
    description: str = Field(default="", max_length=2000)
    position_id: uuid.UUID

    @field_validator("last_name", mode="before")
    @classmethod
    def normalize_last_name(cls, value: str) -> str:
        return _normalize_person_name(value=value, allow_hyphen=True)

    @field_validator("first_name", "middle_name", mode="before")
    @classmethod
    def normalize_single_names(cls, value: str) -> str:
        return _normalize_person_name(value=value, allow_hyphen=False)


class PersonUpdate(SQLModel):
    """Schema for updating person (all fields optional)."""
    last_name: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore
    first_name: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore
    middle_name: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore
    phone: str | None = Field(default=None, min_length=1, max_length=50)  # type: ignore
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore
    description: str | None = Field(default=None, max_length=2000)  # type: ignore
    position_id: uuid.UUID | None = None

    @field_validator("last_name", mode="before")
    @classmethod
    def normalize_last_name(cls, value: str | None) -> str | None:
        if value is None:
            return value
        return _normalize_person_name(value=value, allow_hyphen=True)

    @field_validator("first_name", "middle_name", mode="before")
    @classmethod
    def normalize_single_names(cls, value: str | None) -> str | None:
        if value is None:
            return value
        return _normalize_person_name(value=value, allow_hyphen=False)


class PersonImagePublic(SQLModel):
    """Public person image schema for API responses."""
    id: uuid.UUID
    person_id: uuid.UUID
    file_name: str
    file_path: str
    file_size: int
    mime_type: str
    created_at: datetime


class PersonPublic(SQLModel):
    """Public person schema for API responses."""
    id: uuid.UUID
    last_name: str
    first_name: str
    middle_name: str
    phone: str
    email: EmailStr
    description: str
    position: PositionPublic
    image: PersonImagePublic | None = None
    created_at: datetime
    updated_at: datetime


class PersonsPublic(SQLModel):
    """Person list with count."""
    data: list[PersonPublic]
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

