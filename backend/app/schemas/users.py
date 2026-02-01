"""User-related schemas."""
import uuid

from pydantic import EmailStr
from sqlmodel import Field, SQLModel

from app.models import UserBase


class UserCreate(SQLModel):
    """Schema for creating user via API."""
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)
    nickname: str = Field(min_length=1, max_length=255)
    is_active: bool = Field(default=True)
    is_superuser: bool = Field(default=False)


class UserRegister(SQLModel):
    """Schema for new user registration."""
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)
    nickname: str = Field(min_length=1, max_length=255)


class UserUpdate(SQLModel):
    """Schema for updating user (all fields optional).
    is_superuser can only be changed by superuser.
    """
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore
    password: str | None = Field(default=None, min_length=8, max_length=128)
    nickname: str | None = Field(default=None, min_length=1, max_length=255)
    is_active: bool | None = None
    is_superuser: bool | None = None  # Only superuser can change this field


class UserUpdateMe(SQLModel):
    """Schema for updating own user profile."""
    nickname: str | None = Field(default=None, min_length=1, max_length=255)
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
