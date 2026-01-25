"""Add persons and positions tables

Revision ID: add_persons_positions
Revises: make_category_optional
Create Date: 2026-01-21 00:00:00.000000

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "add_persons_positions"
down_revision = "make_category_optional"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "position",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_index("ix_position_name", "position", ["name"], unique=False)

    op.create_table(
        "person",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("last_name", sa.String(length=255), nullable=False),
        sa.Column("first_name", sa.String(length=255), nullable=False),
        sa.Column("middle_name", sa.String(length=255), nullable=False),
        sa.Column("phone", sa.String(length=50), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("description", sa.String(length=2000), nullable=False),
        sa.Column("position_id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "last_name", "first_name", "middle_name", name="uq_person_full_name"
        ),
    )
    op.create_index("ix_person_last_name", "person", ["last_name"], unique=False)
    op.create_index("ix_person_first_name", "person", ["first_name"], unique=False)
    op.create_index("ix_person_middle_name", "person", ["middle_name"], unique=False)

    op.create_foreign_key(
        "person_position_id_fkey",
        "person",
        "position",
        ["position_id"],
        ["id"],
        ondelete="RESTRICT",
    )


def downgrade():
    op.drop_constraint("person_position_id_fkey", "person", type_="foreignkey")
    op.drop_index("ix_person_middle_name", table_name="person")
    op.drop_index("ix_person_first_name", table_name="person")
    op.drop_index("ix_person_last_name", table_name="person")
    op.drop_table("person")
    op.drop_index("ix_position_name", table_name="position")
    op.drop_table("position")
