"""Add person images table

Revision ID: add_person_images
Revises: add_unique_person_phone_email
Create Date: 2026-01-21 00:00:02.000000

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "add_person_images"
down_revision = "add_unique_person_phone_email"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "personimage",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("person_id", sa.UUID(), nullable=False),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("file_path", sa.String(length=512), nullable=False),
        sa.Column("file_size", sa.Integer(), nullable=False),
        sa.Column("mime_type", sa.String(length=100), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("person_id", name="uq_person_image_person_id"),
    )
    op.create_index("ix_person_image_person_id", "personimage", ["person_id"], unique=True)
    op.create_foreign_key(
        "personimage_person_id_fkey",
        "personimage",
        "person",
        ["person_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint("personimage_person_id_fkey", "personimage", type_="foreignkey")
    op.drop_index("ix_person_image_person_id", table_name="personimage")
    op.drop_table("personimage")
