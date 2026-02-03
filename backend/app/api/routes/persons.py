import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import func, select

from app.api.deps import SessionDep, get_current_active_superuser
from app.core.errors import ConflictError, ErrorCode, NotFoundError
from app.models import Person, PersonImage, Position
from app.schemas import (
    PersonCreate,
    PersonImagePublic,
    PersonPublic,
    PersonsPublic,
    PersonUpdate,
    PositionPublic,
)
from app.services.image_service import image_service

router = APIRouter(prefix="/persons", tags=["persons"])


def _build_person_public(
    person: Person, position: Position, image: PersonImage | None
) -> PersonPublic:
    image_public = None
    if image:
        image_public = PersonImagePublic(
            id=image.id,
            person_id=image.person_id,
            file_name=image.file_name,
            file_path=image.file_path,
            file_size=image.file_size,
            mime_type=image.mime_type,
            created_at=image.created_at,
        )
    return PersonPublic(
        id=person.id,
        last_name=person.last_name,
        first_name=person.first_name,
        middle_name=person.middle_name,
        phone=person.phone,
        email=person.email,
        description=person.description,
        position=PositionPublic(
            id=position.id,
            name=position.name,
            is_management=position.is_management,
            is_director=position.is_director,
            created_at=position.created_at,
        ),
        image=image_public,
        created_at=person.created_at,
        updated_at=person.updated_at,
    )


def _get_position(session: SessionDep, position_id: uuid.UUID) -> Position:
    position = session.get(Position, position_id)
    if not position:
        raise NotFoundError(ErrorCode.POSITION_NOT_FOUND, "Position not found")
    return position


@router.get(
    "/public",
    response_model=PersonsPublic,
)
def read_public_persons(session: SessionDep, skip: int = 0, limit: int = 100) -> Any:
    """Retrieve persons for public pages (without auth)."""
    count_statement = select(func.count()).select_from(Person)
    count = session.exec(count_statement).one()
    statement = (
        select(Person)
        .offset(skip)
        .limit(limit)
        .order_by(Person.last_name, Person.first_name, Person.middle_name)
    )
    persons = session.exec(statement).all()
    data = []
    for person in persons:
        position = session.get(Position, person.position_id)
        if not position:
            raise HTTPException(
                status_code=500, detail=f"Position not found for person {person.id}"
            )
        image = session.exec(
            select(PersonImage).where(PersonImage.person_id == person.id)
        ).first()
        data.append(_build_person_public(person, position, image))
    return PersonsPublic(data=data, count=count)


@router.get(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=PersonsPublic,
)
def read_persons(session: SessionDep, skip: int = 0, limit: int = 100) -> Any:
    """Retrieve persons."""
    count_statement = select(func.count()).select_from(Person)
    count = session.exec(count_statement).one()
    statement = (
        select(Person)
        .offset(skip)
        .limit(limit)
        .order_by(Person.last_name, Person.first_name, Person.middle_name)
    )
    persons = session.exec(statement).all()
    data = []
    for person in persons:
        position = session.get(Position, person.position_id)
        if not position:
            # 500 error for developers - data integrity issue
            raise HTTPException(
                status_code=500, detail=f"Position not found for person {person.id}"
            )
        image = session.exec(
            select(PersonImage).where(PersonImage.person_id == person.id)
        ).first()
        data.append(_build_person_public(person, position, image))
    return PersonsPublic(data=data, count=count)


@router.get(
    "/{person_id}",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=PersonPublic,
)
def read_person_by_id(*, session: SessionDep, person_id: uuid.UUID) -> Any:
    """Get person by id."""
    person = session.get(Person, person_id)
    if not person:
        raise NotFoundError(ErrorCode.PERSON_NOT_FOUND, "Person not found")
    position = session.get(Position, person.position_id)
    if not position:
        # 500 error for developers - data integrity issue
        raise HTTPException(
            status_code=500, detail=f"Position not found for person {person.id}"
        )
    image = session.exec(
        select(PersonImage).where(PersonImage.person_id == person.id)
    ).first()
    return _build_person_public(person, position, image)


@router.post(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=PersonPublic,
)
def create_person(*, session: SessionDep, person_in: PersonCreate) -> Any:
    """Create person."""
    existing = session.exec(
        select(Person).where(
            Person.last_name == person_in.last_name,
            Person.first_name == person_in.first_name,
            Person.middle_name == person_in.middle_name,
        )
    ).first()
    if existing:
        raise ConflictError(ErrorCode.PERSON_EXISTS, "Person with this name already exists")

    existing_phone = session.exec(
        select(Person).where(Person.phone == person_in.phone)
    ).first()
    if existing_phone:
        raise ConflictError(ErrorCode.PERSON_PHONE_EXISTS, "Phone already in use")

    existing_email = session.exec(
        select(Person).where(Person.email == person_in.email)
    ).first()
    if existing_email:
        raise ConflictError(ErrorCode.PERSON_EMAIL_EXISTS, "Email already in use")

    position = _get_position(session, person_in.position_id)
    person_data = person_in.model_dump()
    person = Person.model_validate(person_data)
    session.add(person)
    session.commit()
    session.refresh(person)
    image = session.exec(
        select(PersonImage).where(PersonImage.person_id == person.id)
    ).first()
    return _build_person_public(person, position, image)


@router.patch(
    "/{person_id}",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=PersonPublic,
)
def update_person(
    *,
    session: SessionDep,
    person_id: uuid.UUID,
    person_in: PersonUpdate,
) -> Any:
    """Update person."""
    person = session.get(Person, person_id)
    if not person:
        raise NotFoundError(ErrorCode.PERSON_NOT_FOUND, "Person not found")

    new_last = person_in.last_name or person.last_name
    new_first = person_in.first_name or person.first_name
    new_middle = person_in.middle_name or person.middle_name
    existing = session.exec(
        select(Person).where(
            Person.last_name == new_last,
            Person.first_name == new_first,
            Person.middle_name == new_middle,
            Person.id != person_id,
        )
    ).first()
    if existing:
        raise ConflictError(ErrorCode.PERSON_EXISTS, "Person with this name already exists")

    if person_in.phone:
        existing_phone = session.exec(
            select(Person).where(
                Person.phone == person_in.phone, Person.id != person_id
            )
        ).first()
        if existing_phone:
            raise ConflictError(ErrorCode.PERSON_PHONE_EXISTS, "Phone already in use")

    if person_in.email:
        existing_email = session.exec(
            select(Person).where(
                Person.email == person_in.email, Person.id != person_id
            )
        ).first()
        if existing_email:
            raise ConflictError(ErrorCode.PERSON_EMAIL_EXISTS, "Email already in use")

    position = None
    if person_in.position_id:
        position = _get_position(session, person_in.position_id)
    else:
        position = session.get(Position, person.position_id)

    person_data = person_in.model_dump(exclude_unset=True)
    person.sqlmodel_update(person_data)
    person.updated_at = datetime.now(timezone.utc)

    session.add(person)
    session.commit()
    session.refresh(person)

    if not position or (person_in.position_id and position.id != person.position_id):
        position = session.get(Position, person.position_id)

    if not position:
        # 500 error for developers - data integrity issue
        raise HTTPException(
            status_code=500, detail=f"Position not found for person {person.id}"
        )

    image = session.exec(
        select(PersonImage).where(PersonImage.person_id == person.id)
    ).first()
    return _build_person_public(person, position, image)


@router.delete(
    "/{person_id}",
    dependencies=[Depends(get_current_active_superuser)],
)
def delete_person(*, session: SessionDep, person_id: uuid.UUID) -> Any:
    """Delete person."""
    person = session.get(Person, person_id)
    if not person:
        raise NotFoundError(ErrorCode.PERSON_NOT_FOUND, "Person not found")
    image = session.exec(
        select(PersonImage).where(PersonImage.person_id == person_id)
    ).first()
    if image:
        file_path = image_service.UPLOAD_DIR / image.file_path
        if file_path.exists():
            file_path.unlink()
    session.delete(person)
    session.commit()
    return {"message": "Person deleted successfully"}
