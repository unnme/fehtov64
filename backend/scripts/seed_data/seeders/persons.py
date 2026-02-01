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
        "description": "Курирует учебно-воспитательную работу.",
        "position": "Заместитель директора",
    },
    {
        "last_name": "Сидоров",
        "first_name": "Алексей",
        "middle_name": "Петрович",
        "phone": "+7 (900) 333-33-33",
        "email": "sidorov@school.ru",
        "description": "Отвечает за организацию учебного процесса.",
        "position": "Завуч",
    },
    {
        "last_name": "Козлова",
        "first_name": "Елена",
        "middle_name": "Владимировна",
        "phone": "+7 (900) 444-44-44",
        "email": "kozlova@school.ru",
        "description": "Преподаватель математики высшей категории.",
        "position": "Учитель",
    },
    {
        "last_name": "Смирнов",
        "first_name": "Дмитрий",
        "middle_name": "Андреевич",
        "phone": "+7 (900) 555-55-55",
        "email": "smirnov@school.ru",
        "description": "Преподаватель русского языка и литературы.",
        "position": "Учитель",
    },
    {
        "last_name": "Новикова",
        "first_name": "Ольга",
        "middle_name": "Николаевна",
        "phone": "+7 (900) 666-66-66",
        "email": "novikova@school.ru",
        "description": "Классный руководитель 5А класса.",
        "position": "Классный руководитель",
    },
    {
        "last_name": "Морозова",
        "first_name": "Анна",
        "middle_name": "Викторовна",
        "phone": "+7 (900) 777-77-77",
        "email": "morozova@school.ru",
        "description": "Педагог-психолог, работает с детьми и родителями.",
        "position": "Психолог",
    },
    {
        "last_name": "Волкова",
        "first_name": "Татьяна",
        "middle_name": "Александровна",
        "phone": "+7 (900) 888-88-88",
        "email": "volkova@school.ru",
        "description": "Специалист по коррекции речевых нарушений.",
        "position": "Логопед",
    },
    {
        "last_name": "Кузнецова",
        "first_name": "Наталья",
        "middle_name": "Михайловна",
        "phone": "+7 (900) 999-99-99",
        "email": "kuznetsova@school.ru",
        "description": "Заведует школьной библиотекой.",
        "position": "Библиотекарь",
    },
    {
        "last_name": "Соколов",
        "first_name": "Виктор",
        "middle_name": "Григорьевич",
        "phone": "+7 (900) 000-00-00",
        "email": "sokolov@school.ru",
        "description": "Отвечает за безопасность учащихся и персонала.",
        "position": "Охранник",
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
