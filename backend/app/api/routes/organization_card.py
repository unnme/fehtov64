from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends
from sqlmodel import select

from app.api.deps import SessionDep, get_current_active_superuser
from app.core.errors import ConflictError, ErrorCode, NotFoundError
from app.models import OrganizationCard
from app.schemas import (
    OrganizationCardCreate,
    OrganizationCardPublic,
    OrganizationCardUpdate,
)

router = APIRouter(prefix="/organization-card", tags=["organization-card"])
public_router = APIRouter(prefix="/organization-card", tags=["organization-card"])


def _get_single_card(session: SessionDep) -> OrganizationCard | None:
    return session.exec(select(OrganizationCard)).first()


def _normalize_phones(card: OrganizationCard) -> None:
    """Convert legacy string phones to dict format."""
    if card.phones and isinstance(card.phones[0], str):
        card.phones = [
            {"phone": phone, "description": None} if isinstance(phone, str) else phone
            for phone in card.phones
        ]


@public_router.get("/public", response_model=OrganizationCardPublic)
def read_public_card(session: SessionDep) -> Any:
    card = _get_single_card(session)
    if not card:
        raise NotFoundError(ErrorCode.ORG_CARD_NOT_FOUND, "Organization card not found")
    _normalize_phones(card)
    return card


@router.get(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=OrganizationCardPublic,
)
def read_card(session: SessionDep) -> Any:
    card = _get_single_card(session)
    if not card:
        raise NotFoundError(ErrorCode.ORG_CARD_NOT_FOUND, "Organization card not found")
    _normalize_phones(card)
    return card


@router.post(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=OrganizationCardPublic,
)
def create_card(session: SessionDep, card_in: OrganizationCardCreate) -> Any:
    existing = _get_single_card(session)
    if existing:
        raise ConflictError(ErrorCode.ORG_CARD_EXISTS, "Organization card already exists")

    card = OrganizationCard(**card_in.model_dump())
    session.add(card)
    session.commit()
    session.refresh(card)
    return card


@router.patch(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=OrganizationCardPublic,
)
def update_card(session: SessionDep, card_in: OrganizationCardUpdate) -> Any:
    card = _get_single_card(session)
    if not card:
        raise NotFoundError(ErrorCode.ORG_CARD_NOT_FOUND, "Organization card not found")

    update_data = card_in.model_dump(exclude_unset=True)
    if update_data:
        card.sqlmodel_update(update_data)
        card.updated_at = datetime.now(timezone.utc)
        session.add(card)
        session.commit()
        session.refresh(card)
    _normalize_phones(card)
    return card
