"""Add unique constraints for person phone and email

Revision ID: add_unique_person_phone_email
Revises: 5dbed7a9a59a
Create Date: 2026-01-21 00:00:01.000000

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "add_unique_person_phone_email"
down_revision = "5dbed7a9a59a"
branch_labels = None
depends_on = None


def upgrade():
    op.create_index("ix_person_phone", "person", ["phone"], unique=True)
    op.create_index("ix_person_email", "person", ["email"], unique=True)


def downgrade():
    op.drop_index("ix_person_email", table_name="person")
    op.drop_index("ix_person_phone", table_name="person")
