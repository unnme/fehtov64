"""merge heads

Revision ID: 5dbed7a9a59a
Revises: add_persons_positions, full_name_required_unique
Create Date: 2026-01-21 00:00:00.000000

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = "5dbed7a9a59a"
down_revision = ("add_persons_positions", "full_name_required_unique")
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
