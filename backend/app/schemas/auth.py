"""Authentication-related schemas."""
from sqlmodel import Field, SQLModel


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
