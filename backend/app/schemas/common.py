"""Common validation utilities for schemas."""
import re

_NAME_PART_PATTERN = re.compile(r"^[A-Za-zА-Яа-яЁё]+$")


def normalize_optional_str(value: str | None) -> str | None:
    """Normalize optional string value."""
    if value is None:
        return None
    if not isinstance(value, str):
        raise ValueError("Значение должно быть строкой")
    trimmed = value.strip()
    return trimmed if trimmed else None


def normalize_phone_list(*, value: list[dict | str], allow_empty: bool = False) -> list[dict]:
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


def capitalize_name_part(value: str) -> str:
    """Capitalize first letter of name part."""
    if not value:
        return value
    lower_value = value.lower()
    return lower_value[0].upper() + lower_value[1:]


def normalize_person_name(*, value: str, allow_hyphen: bool) -> str:
    """Normalize person name part."""
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
        return capitalize_name_part(trimmed)

    parts = trimmed.split("-")
    if len(parts) > 2 or any(part == "" for part in parts):
        raise ValueError("Допускается одно тире в фамилии")
    if not all(_NAME_PART_PATTERN.match(part) for part in parts):
        raise ValueError("Допускаются только буквы и одно тире")
    return "-".join(capitalize_name_part(part) for part in parts)


def normalize_position_name(*, value: str) -> str:
    """Normalize position name."""
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
