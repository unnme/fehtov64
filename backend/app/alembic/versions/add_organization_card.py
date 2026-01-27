"""Add organization card table

Revision ID: add_organization_card
Revises: add_person_images
Create Date: 2026-01-22 00:00:00.000000

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "add_organization_card"
down_revision = "add_person_images"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "organizationcard",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("phones", sa.JSON(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("address", sa.String(length=500), nullable=False),
        sa.Column("work_hours", sa.String(length=500), nullable=False),
        sa.Column("vk_url", sa.String(length=500), nullable=True),
        sa.Column("telegram_url", sa.String(length=500), nullable=True),
        sa.Column("whatsapp_url", sa.String(length=500), nullable=True),
        sa.Column("max_url", sa.String(length=500), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("organizationcard")
