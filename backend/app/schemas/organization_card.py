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


def _validate_digits_only(value: str | None, field_name: str, exact_length: int | None = None, max_length: int | None = None) -> str | None:
    """Validate that value contains only digits and has correct length."""
    if value is None or not value.strip():
        return None
    cleaned = value.strip()
    if not cleaned.isdigit():
        raise ValueError(f"{field_name} должен содержать только цифры")
    if exact_length and len(cleaned) != exact_length:
        raise ValueError(f"{field_name} должен содержать {exact_length} цифр")
    if max_length and len(cleaned) > max_length:
        raise ValueError(f"{field_name} должен содержать не более {max_length} цифр")
    return cleaned


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

    @field_validator("address", "work_hours", "director_hours", "legal_address", "bank_recipient", mode="before")
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

    @field_validator("inn", mode="before")
    @classmethod
    def validate_inn(cls, value: str | None) -> str | None:
        return _validate_digits_only(value, "ИНН", exact_length=10)

    @field_validator("kpp", mode="before")
    @classmethod
    def validate_kpp(cls, value: str | None) -> str | None:
        return _validate_digits_only(value, "КПП", exact_length=9)

    @field_validator("okpo", mode="before")
    @classmethod
    def validate_okpo(cls, value: str | None) -> str | None:
        return _validate_digits_only(value, "ОКПО", exact_length=8)

    @field_validator("ogrn", mode="before")
    @classmethod
    def validate_ogrn(cls, value: str | None) -> str | None:
        return _validate_digits_only(value, "ОГРН", exact_length=13)

    @field_validator("okfs", mode="before")
    @classmethod
    def validate_okfs(cls, value: str | None) -> str | None:
        return _validate_digits_only(value, "ОКФС", exact_length=2)

    @field_validator("okogu", mode="before")
    @classmethod
    def validate_okogu(cls, value: str | None) -> str | None:
        return _validate_digits_only(value, "ОКОГУ", exact_length=7)

    @field_validator("okopf", mode="before")
    @classmethod
    def validate_okopf(cls, value: str | None) -> str | None:
        return _validate_digits_only(value, "ОКОПФ", exact_length=5)

    @field_validator("oktmo", mode="before")
    @classmethod
    def validate_oktmo(cls, value: str | None) -> str | None:
        return _validate_digits_only(value, "ОКТМО", max_length=11)

    @field_validator("okato", mode="before")
    @classmethod
    def validate_okato(cls, value: str | None) -> str | None:
        return _validate_digits_only(value, "ОКАТО", exact_length=11)

    @field_validator("bank_account", mode="before")
    @classmethod
    def validate_bank_account(cls, value: str | None) -> str | None:
        return _validate_digits_only(value, "Расчётный счёт", exact_length=20)

    @field_validator("bank_bik", mode="before")
    @classmethod
    def validate_bank_bik(cls, value: str | None) -> str | None:
        return _validate_digits_only(value, "БИК", exact_length=9)


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

    @field_validator("address", "work_hours", "director_hours", "legal_address", "bank_recipient", mode="before")
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

    @field_validator("inn", mode="before")
    @classmethod
    def validate_inn(cls, value: str | None) -> str | None:
        return _validate_digits_only(value, "ИНН", exact_length=10)

    @field_validator("kpp", mode="before")
    @classmethod
    def validate_kpp(cls, value: str | None) -> str | None:
        return _validate_digits_only(value, "КПП", exact_length=9)

    @field_validator("okpo", mode="before")
    @classmethod
    def validate_okpo(cls, value: str | None) -> str | None:
        return _validate_digits_only(value, "ОКПО", exact_length=8)

    @field_validator("ogrn", mode="before")
    @classmethod
    def validate_ogrn(cls, value: str | None) -> str | None:
        return _validate_digits_only(value, "ОГРН", exact_length=13)

    @field_validator("okfs", mode="before")
    @classmethod
    def validate_okfs(cls, value: str | None) -> str | None:
        return _validate_digits_only(value, "ОКФС", exact_length=2)

    @field_validator("okogu", mode="before")
    @classmethod
    def validate_okogu(cls, value: str | None) -> str | None:
        return _validate_digits_only(value, "ОКОГУ", exact_length=7)

    @field_validator("okopf", mode="before")
    @classmethod
    def validate_okopf(cls, value: str | None) -> str | None:
        return _validate_digits_only(value, "ОКОПФ", exact_length=5)

    @field_validator("oktmo", mode="before")
    @classmethod
    def validate_oktmo(cls, value: str | None) -> str | None:
        return _validate_digits_only(value, "ОКТМО", max_length=11)

    @field_validator("okato", mode="before")
    @classmethod
    def validate_okato(cls, value: str | None) -> str | None:
        return _validate_digits_only(value, "ОКАТО", exact_length=11)

    @field_validator("bank_account", mode="before")
    @classmethod
    def validate_bank_account(cls, value: str | None) -> str | None:
        return _validate_digits_only(value, "Расчётный счёт", exact_length=20)

    @field_validator("bank_bik", mode="before")
    @classmethod
    def validate_bank_bik(cls, value: str | None) -> str | None:
        return _validate_digits_only(value, "БИК", exact_length=9)


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
    # Organization details (requisites)
    legal_address: str | None
    legal_latitude: float | None
    legal_longitude: float | None
    inn: str | None
    kpp: str | None
    okpo: str | None
    ogrn: str | None
    okfs: str | None
    okogu: str | None
    okopf: str | None
    oktmo: str | None
    okato: str | None
    # Bank details
    bank_recipient: str | None
    bank_account: str | None
    bank_bik: str | None
    created_at: datetime
    updated_at: datetime
