"""Person-related schemas."""
import uuid
from datetime import datetime

from pydantic import EmailStr, field_validator
from sqlmodel import Field, SQLModel

from app.schemas.common import normalize_person_name
from app.schemas.positions import PositionPublic


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
        return normalize_person_name(value=value, allow_hyphen=True)

    @field_validator("first_name", "middle_name", mode="before")
    @classmethod
    def normalize_single_names(cls, value: str) -> str:
        return normalize_person_name(value=value, allow_hyphen=False)


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
        return normalize_person_name(value=value, allow_hyphen=True)

    @field_validator("first_name", "middle_name", mode="before")
    @classmethod
    def normalize_single_names(cls, value: str | None) -> str | None:
        if value is None:
            return value
        return normalize_person_name(value=value, allow_hyphen=False)


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
