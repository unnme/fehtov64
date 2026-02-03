"""
Test persons creation.
"""

import logging

from sqlmodel import Session, select

from app.models import Person, Position

logger = logging.getLogger(__name__)

TEST_PERSONS = [
    {
        "last_name": "Иванов",
        "first_name": "Иван",
        "middle_name": "Иванович",
        "phone": "+7 (900) 111-11-11",
        "email": "ivanov@school.ru",
        "description": "Опытный руководитель с 20-летним стажем работы в сфере образования.",
        "position": "Директор",
    },
    {
        "last_name": "Петрова",
        "first_name": "Мария",
        "middle_name": "Сергеевна",
        "phone": "+7 (900) 222-22-22",
        "email": "petrova@school.ru",
        "description": "Курирует воспитательную работу, организацию внеклассных мероприятий.",
        "position": "Зам. директора по ВР",
    },
    {
        "last_name": "Сидоров",
        "first_name": "Алексей",
        "middle_name": "Петрович",
        "phone": "+7 (900) 333-33-33",
        "email": "sidorov@school.ru",
        "description": "Отвечает за материально-техническое обеспечение школы.",
        "position": "Зам. директора по АХР",
    },
    {
        "last_name": "Козлова",
        "first_name": "Елена",
        "middle_name": "Владимировна",
        "phone": "+7 (900) 444-44-44",
        "email": "kozlova@school.ru",
        "description": "Преподаватель высшей категории, стаж работы 15 лет.",
        "position": "Учитель математики",
    },
    {
        "last_name": "Смирнов",
        "first_name": "Дмитрий",
        "middle_name": "Андреевич",
        "phone": "+7 (900) 555-55-55",
        "email": "smirnov@school.ru",
        "description": "Преподаватель первой категории, автор методических пособий.",
        "position": "Учитель русского языка",
    },
    {
        "last_name": "Новикова",
        "first_name": "Ольга",
        "middle_name": "Николаевна",
        "phone": "+7 (900) 666-66-66",
        "email": "novikova@school.ru",
        "description": "Сертифицированный преподаватель, опыт работы за рубежом.",
        "position": "Учитель английского языка",
    },
    {
        "last_name": "Морозов",
        "first_name": "Андрей",
        "middle_name": "Викторович",
        "phone": "+7 (900) 777-77-77",
        "email": "morozov@school.ru",
        "description": "Кандидат физико-математических наук.",
        "position": "Учитель физики",
    },
    {
        "last_name": "Волкова",
        "first_name": "Татьяна",
        "middle_name": "Александровна",
        "phone": "+7 (900) 888-88-88",
        "email": "volkova@school.ru",
        "description": "Историк, краевед, организатор школьного музея.",
        "position": "Учитель истории",
    },
    {
        "last_name": "Кузнецов",
        "first_name": "Николай",
        "middle_name": "Михайлович",
        "phone": "+7 (900) 999-99-99",
        "email": "kuznetsov@school.ru",
        "description": "Мастер спорта, тренер школьной сборной.",
        "position": "Учитель физкультуры",
    },
    {
        "last_name": "Соколова",
        "first_name": "Виктория",
        "middle_name": "Григорьевна",
        "phone": "+7 (900) 000-00-00",
        "email": "sokolova@school.ru",
        "description": "Специалист по информационным технологиям, ведёт кружок робототехники.",
        "position": "Учитель информатики",
    },
]


def create_test_persons(session: Session) -> None:
    """Creates test persons."""
    for person_data in TEST_PERSONS:
        existing = session.exec(
            select(Person).where(
                Person.last_name == person_data["last_name"],
                Person.first_name == person_data["first_name"],
                Person.middle_name == person_data["middle_name"],
            )
        ).first()

        if existing:
            logger.info(
                f"Person '{person_data['last_name']} {person_data['first_name']}' "
                "already exists, skipping"
            )
            continue

        position = session.exec(
            select(Position).where(Position.name == person_data["position"])
        ).first()

        if not position:
            logger.warning(
                f"Position '{person_data['position']}' not found, skipping person"
            )
            continue

        person = Person(
            last_name=person_data["last_name"],
            first_name=person_data["first_name"],
            middle_name=person_data["middle_name"],
            phone=person_data["phone"],
            email=person_data["email"],
            description=person_data["description"],
            position_id=position.id,
        )
        session.add(person)
        session.commit()
        session.refresh(person)
        logger.info(
            f"Created person: {person.last_name} {person.first_name} ({position.name})"
        )
