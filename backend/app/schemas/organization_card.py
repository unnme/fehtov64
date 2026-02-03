"""Organization card schemas."""
import re
import uuid
from datetime import datetime

from pydantic import field_validator
from sqlmodel import Field, SQLModel

from app.schemas.common import normalize_optional_str, normalize_phone_list


def _validate_email(value: str | None) -> str | None:
    if value is None or not value.strip():
        return None
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, value.strip()):
        raise ValueError("Неверный формат email")
    return value.strip()


class OrganizationCardCreate(SQLModel):
    """Schema for creating organization card."""
    name: str = Field(..., min_length=1, max_length=255)
    phones: list[dict] = Field(default_factory=list)
    email: str | None = Field(default=None, max_length=255)
    address: str | None = Field(default=None, max_length=500)
    work_hours: str | None = Field(default=None, max_length=500)
    director_hours: str | None = Field(default=None, max_length=500)
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
        return normalize_phone_list(value=value, allow_empty=True)

    @field_validator("email", mode="before")
    @classmethod
    def validate_email(cls, value: str | None) -> str | None:
        return _validate_email(value)

    @field_validator("name", mode="before")
    @classmethod
    def validate_name(cls, value: str | None) -> str:
        if value is None or not value.strip():
            raise ValueError("Укажите название организации")
        return value.strip()

    @field_validator("address", "work_hours", "director_hours", mode="before")
    @classmethod
    def normalize_strings(cls, value: str | None) -> str | None:
        return normalize_optional_str(value)

    @field_validator(
        "vk_url",
        "telegram_url",
        "whatsapp_url",
        "max_url",
        mode="before",
    )
    @classmethod
    def normalize_optional_links(cls, value: str | None) -> str | None:
        return normalize_optional_str(value)


class OrganizationCardUpdate(SQLModel):
    """Schema for updating organization card (all fields optional)."""
    name: str | None = Field(default=None, max_length=255)
    phones: list[dict] | None = None
    email: str | None = Field(default=None, max_length=255)
    address: str | None = Field(default=None, max_length=500)
    work_hours: str | None = Field(default=None, max_length=500)
    director_hours: str | None = Field(default=None, max_length=500)
    vk_url: str | None = Field(default=None, max_length=500)
    telegram_url: str | None = Field(default=None, max_length=500)
    whatsapp_url: str | None = Field(default=None, max_length=500)
    max_url: str | None = Field(default=None, max_length=500)
    latitude: float | None = None
    longitude: float | None = None

    @field_validator("phones", mode="before")
    @classmethod
    def normalize_phones(cls, value: list[dict | str] | None) -> list[dict] | None:
        if value is None:
            return value
        return normalize_phone_list(value=value, allow_empty=True)

    @field_validator("email", mode="before")
    @classmethod
    def validate_email(cls, value: str | None) -> str | None:
        return _validate_email(value)

    @field_validator("name", mode="before")
    @classmethod
    def validate_name(cls, value: str | None) -> str | None:
        if value is None:
            return value
        if not value.strip():
            raise ValueError("Укажите название организации")
        return value.strip()

    @field_validator("address", "work_hours", "director_hours", mode="before")
    @classmethod
    def normalize_strings(cls, value: str | None) -> str | None:
        return normalize_optional_str(value)

    @field_validator(
        "vk_url",
        "telegram_url",
        "whatsapp_url",
        "max_url",
        mode="before",
    )
    @classmethod
    def normalize_optional_links(cls, value: str | None) -> str | None:
        return normalize_optional_str(value)


class OrganizationCardPublic(SQLModel):
    """Public organization card schema."""
    id: uuid.UUID
    name: str | None
    phones: list[dict]
    email: str | None
    address: str | None
    work_hours: str | None
    director_hours: str | None
    vk_url: str | None
    telegram_url: str | None
    whatsapp_url: str | None
    max_url: str | None
    latitude: float | None
    longitude: float | None
    created_at: datetime
    updated_at: datetime
