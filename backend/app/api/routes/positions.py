import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import func, select

from app.api.deps import SessionDep, get_current_active_superuser
from app.models import Position
from app.schemas import PositionCreate, PositionPublic, PositionsPublic, PositionUpdate
from app.services.position_service import reassign_persons_to_default

router = APIRouter(prefix="/positions", tags=["positions"])

DEFAULT_POSITION_NAME = "Без должности"


@router.get(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=PositionsPublic,
)
def read_positions(session: SessionDep, skip: int = 0, limit: int = 100) -> Any:
    """
    Retrieve positions.
    """
    count_statement = select(func.count()).select_from(Position)
    count = session.exec(count_statement).one()
    statement = select(Position).offset(skip).limit(limit).order_by(Position.name)
    positions = session.exec(statement).all()
    return PositionsPublic(data=positions, count=count)


@router.post(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=PositionPublic,
)
def create_position(*, session: SessionDep, position_in: PositionCreate) -> Any:
    """
    Create position.
    """
    if position_in.name == DEFAULT_POSITION_NAME:
        raise HTTPException(
            status_code=400, detail="Default position cannot be created manually"
        )

    existing = session.exec(
        select(Position).where(Position.name == position_in.name)
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Position already exists")

    position = Position.model_validate(position_in)
    session.add(position)
    session.commit()
    session.refresh(position)
    return position


@router.patch(
    "/{position_id}",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=PositionPublic,
)
def update_position(
    *,
    session: SessionDep,
    position_id: uuid.UUID,
    position_in: PositionUpdate,
) -> Any:
    """
    Update position.
    """
    position = session.get(Position, position_id)
    if not position:
        raise HTTPException(status_code=404, detail="Position not found")

    if position.name == DEFAULT_POSITION_NAME and position_in.name:
        raise HTTPException(
            status_code=400, detail="Default position cannot be renamed"
        )
    if (
        position_in.name == DEFAULT_POSITION_NAME
        and position.name != DEFAULT_POSITION_NAME
    ):
        raise HTTPException(
            status_code=400, detail="Default position name is reserved"
        )

    if position_in.name and position_in.name != position.name:
        existing = session.exec(
            select(Position).where(Position.name == position_in.name)
        ).first()
        if existing:
            raise HTTPException(status_code=409, detail="Position already exists")

    position_data = position_in.model_dump(exclude_unset=True)
    position.sqlmodel_update(position_data)
    session.add(position)
    session.commit()
    session.refresh(position)
    return position


@router.delete(
    "/{position_id}",
    dependencies=[Depends(get_current_active_superuser)],
)
def delete_position(*, session: SessionDep, position_id: uuid.UUID) -> Any:
    """
    Delete position.
    """
    position = session.get(Position, position_id)
    if not position:
        raise HTTPException(status_code=404, detail="Position not found")

    if position.name == DEFAULT_POSITION_NAME:
        raise HTTPException(
            status_code=400, detail="Default position cannot be deleted"
        )

    reassign_persons_to_default(session=session, position_id=position_id)

    session.delete(position)
    session.commit()
    return {"message": "Position deleted successfully"}
