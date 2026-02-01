"""Make organization card fields nullable

Revision ID: make_org_card_nullable
Revises: add_organization_card
Create Date: 2026-01-31 00:00:00.000000

"""
import sqlalchemy as sa
from alembic import op

revision = "make_org_card_nullable"
down_revision = "add_organization_card"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("organizationcard", "name", existing_type=sa.String(255), nullable=True)
    op.alter_column("organizationcard", "email", existing_type=sa.String(255), nullable=True)
    op.alter_column("organizationcard", "address", existing_type=sa.String(500), nullable=True)
    op.alter_column("organizationcard", "work_hours", existing_type=sa.String(500), nullable=True)


def downgrade() -> None:
    op.alter_column("organizationcard", "name", existing_type=sa.String(255), nullable=False)
    op.alter_column("organizationcard", "email", existing_type=sa.String(255), nullable=False)
    op.alter_column("organizationcard", "address", existing_type=sa.String(500), nullable=False)
    op.alter_column("organizationcard", "work_hours", existing_type=sa.String(500), nullable=False)
