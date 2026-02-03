"""add is_management and is_director to position

Revision ID: add_position_flags
Revises: add_director_hours
Create Date: 2026-02-02

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_position_flags'
down_revision = 'add_director_hours'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('position', sa.Column('is_management', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('position', sa.Column('is_director', sa.Boolean(), nullable=False, server_default='false'))


def downgrade():
    op.drop_column('position', 'is_director')
    op.drop_column('position', 'is_management')
