"""
Test positions creation.
"""

import logging
from dataclasses import dataclass

from sqlmodel import Session, select

from app.models import Position

logger = logging.getLogger(__name__)


@dataclass
class PositionConfig:
    name: str
    is_management: bool = False
    is_director: bool = False


TEST_POSITIONS = [
    PositionConfig("Директор", is_management=True, is_director=True),
    PositionConfig("Зам. директора по ВР", is_management=True),
    PositionConfig("Зам. директора по АХР", is_management=True),
    PositionConfig("Учитель математики"),
    PositionConfig("Учитель русского языка"),
    PositionConfig("Учитель английского языка"),
    PositionConfig("Учитель физики"),
    PositionConfig("Учитель истории"),
    PositionConfig("Учитель физкультуры"),
    PositionConfig("Учитель информатики"),
]


def create_test_positions(session: Session) -> dict[str, Position]:
    """Creates test positions and returns a mapping of name to Position."""
    positions_map: dict[str, Position] = {}

    for config in TEST_POSITIONS:
        existing = session.exec(
            select(Position).where(Position.name == config.name)
        ).first()

        if existing:
            logger.info(f"Position '{config.name}' already exists, skipping")
            positions_map[config.name] = existing
            continue

        position = Position(
            name=config.name,
            is_management=config.is_management,
            is_director=config.is_director,
        )
        session.add(position)
        session.commit()
        session.refresh(position)
        positions_map[config.name] = position
        logger.info(f"Created position: {config.name}")

    return positions_map
