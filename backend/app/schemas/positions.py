"""Position-related schemas."""
import uuid
from datetime import datetime

from pydantic import field_validator
from sqlmodel import Field, SQLModel

from app.schemas.common import normalize_position_name


class PositionCreate(SQLModel):
    """Schema for creating position."""
    name: str = Field(min_length=1, max_length=255)
    is_management: bool = False
    is_director: bool = False

    @field_validator("name", mode="before")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        return normalize_position_name(value=value)


class PositionUpdate(SQLModel):
    """Schema for updating position (all fields optional)."""
    name: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore
    is_management: bool | None = None
    is_director: bool | None = None

    @field_validator("name", mode="before")
    @classmethod
    def normalize_name(cls, value: str | None) -> str | None:
        if value is None:
            return value
        return normalize_position_name(value=value)


class PositionPublic(SQLModel):
    """Public position schema for API responses."""
    id: uuid.UUID
    name: str
    is_management: bool
    is_director: bool
    created_at: datetime


class PositionsPublic(SQLModel):
    """Position list with count."""
    data: list[PositionPublic]
    count: int
