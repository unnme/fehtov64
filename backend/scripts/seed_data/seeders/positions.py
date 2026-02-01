"""
Test positions creation.
"""

import logging

from sqlmodel import Session, select

from app.models import Position

logger = logging.getLogger(__name__)

TEST_POSITIONS = [
    "Директор",
    "Заместитель директора",
    "Завуч",
    "Учитель",
    "Классный руководитель",
    "Психолог",
    "Логопед",
    "Библиотекарь",
    "Медсестра",
    "Охранник",
]


def create_test_positions(session: Session) -> dict[str, Position]:
    """Creates test positions and returns a mapping of name to Position."""
    positions_map: dict[str, Position] = {}

    for name in TEST_POSITIONS:
        existing = session.exec(
            select(Position).where(Position.name == name)
        ).first()

        if existing:
            logger.info(f"Position '{name}' already exists, skipping")
            positions_map[name] = existing
            continue

        position = Position(name=name)
        session.add(position)
        session.commit()
        session.refresh(position)
        positions_map[name] = position
        logger.info(f"Created position: {name}")

    return positions_map
