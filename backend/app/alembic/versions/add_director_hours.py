"""add director_hours to organization card

Revision ID: add_director_hours
Revises: rename_full_name_nickname
Create Date: 2026-02-02

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes

# revision identifiers, used by Alembic.
revision = 'add_director_hours'
down_revision = 'rename_full_name_nickname'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('organizationcard', sa.Column('director_hours', sqlmodel.sql.sqltypes.AutoString(length=500), nullable=True))


def downgrade():
    op.drop_column('organizationcard', 'director_hours')
