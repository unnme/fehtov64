"""
SQLModel models for database.
Only database tables and their base classes are located here.
All API schemas are in schemas.py.
"""
import uuid
from datetime import datetime, timezone

import sqlalchemy as sa
from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel


class UserBase(SQLModel):
    """Base user properties for database table."""
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    nickname: str = Field(unique=True, index=True, max_length=255)


class User(UserBase, table=True):
    """User model in database."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    news: list["News"] = Relationship(back_populates="owner", cascade_delete=True)


class Position(SQLModel, table=True):
    """Position model for staff."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(unique=True, index=True, max_length=255)
    is_management: bool = Field(default=False)
    is_director: bool = Field(default=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    persons: list["Person"] = Relationship(back_populates="position")


class Person(SQLModel, table=True):
    """Person model for staff."""
    __table_args__ = (
        sa.UniqueConstraint(
            "last_name", "first_name", "middle_name", name="uq_person_full_name"
        ),
    )
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    last_name: str = Field(max_length=255, index=True)
    first_name: str = Field(max_length=255, index=True)
    middle_name: str = Field(max_length=255, index=True)
    phone: str = Field(max_length=50, unique=True, index=True)
    email: EmailStr = Field(max_length=255, unique=True, index=True)
    description: str = Field(default="", max_length=2000)
    position_id: uuid.UUID = Field(foreign_key="position.id", nullable=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    position: "Position" = Relationship(back_populates="persons")
    image: "PersonImage" = Relationship(
        back_populates="person", sa_relationship_kwargs={"uselist": False}
    )


class PersonImage(SQLModel, table=True):
    """Person image model (one image per person)."""
    __table_args__ = (sa.UniqueConstraint("person_id", name="uq_person_image_person_id"),)
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    person_id: uuid.UUID = Field(
        foreign_key="person.id", nullable=False, ondelete="CASCADE"
    )
    file_name: str = Field(max_length=255)
    file_path: str = Field(max_length=512)
    file_size: int
    mime_type: str = Field(max_length=100)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    person: "Person" = Relationship(back_populates="image")


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



class DocumentCategory(SQLModel, table=True):
    """Document category model in database."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(unique=True, index=True, max_length=100)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    documents: list["Document"] = Relationship(back_populates="category")


class DocumentBase(SQLModel):
    """Base document properties for database table."""
    name: str = Field(min_length=1, max_length=255)
    file_name: str = Field(max_length=255)
    file_path: str = Field(max_length=512)
    file_size: int
    mime_type: str = Field(max_length=100)


class Document(DocumentBase, table=True):
    """Document model in database."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    category_id: uuid.UUID | None = Field(
        foreign_key="documentcategory.id", nullable=True, default=None, ondelete="SET NULL"
    )
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    category: "DocumentCategory" = Relationship(back_populates="documents")
    owner: "User" = Relationship()


class OrganizationCard(SQLModel, table=True):
    """Organization card model."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str | None = Field(default=None, max_length=255)
    phones: list[dict] = Field(
        sa_column=sa.Column(sa.JSON, nullable=False),
        default_factory=list,
    )
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
    # Organization details (requisites)
    legal_address: str | None = Field(default=None, max_length=500)
    legal_latitude: float | None = None
    legal_longitude: float | None = None
    inn: str | None = Field(default=None, max_length=10)
    kpp: str | None = Field(default=None, max_length=9)
    okpo: str | None = Field(default=None, max_length=8)
    ogrn: str | None = Field(default=None, max_length=13)
    okfs: str | None = Field(default=None, max_length=2)
    okogu: str | None = Field(default=None, max_length=7)
    okopf: str | None = Field(default=None, max_length=5)
    oktmo: str | None = Field(default=None, max_length=11)
    okato: str | None = Field(default=None, max_length=11)
    # Bank details
    bank_recipient: str | None = Field(default=None, max_length=500)
    bank_account: str | None = Field(default=None, max_length=20)
    bank_bik: str | None = Field(default=None, max_length=9)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
