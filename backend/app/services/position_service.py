import uuid

from sqlmodel import Session, select

from app.models import Person, Position

DEFAULT_POSITION_NAME = "Без должности"


def get_default_position(session: Session) -> Position:
    position = session.exec(
        select(Position).where(Position.name == DEFAULT_POSITION_NAME)
    ).first()
    if position:
        return position
    position = Position(name=DEFAULT_POSITION_NAME)
    session.add(position)
    session.commit()
    session.refresh(position)
    return position


def ensure_default_position(session: Session) -> None:
    get_default_position(session)


def reassign_persons_to_default(
    *, session: Session, position_id: uuid.UUID
) -> None:
    default_position = get_default_position(session)
    persons = session.exec(
        select(Person).where(Person.position_id == position_id)
    ).all()
    for person in persons:
        person.position_id = default_position.id
        session.add(person)
    session.commit()
