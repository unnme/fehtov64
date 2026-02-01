"""Rename full_name to nickname in user table.

Revision ID: rename_full_name_nickname
Revises: make_org_card_nullable
Create Date: 2025-02-01

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "rename_full_name_nickname"
down_revision = "make_org_card_nullable"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("user", "full_name", new_column_name="nickname")
    # Rename index
    op.drop_index("ix_user_full_name", table_name="user")
    op.create_index("ix_user_nickname", "user", ["nickname"], unique=True)


def downgrade() -> None:
    op.alter_column("user", "nickname", new_column_name="full_name")
    # Rename index back
    op.drop_index("ix_user_nickname", table_name="user")
    op.create_index("ix_user_full_name", "user", ["full_name"], unique=True)
