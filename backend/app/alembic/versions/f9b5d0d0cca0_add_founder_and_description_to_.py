"""add description to organization card

Revision ID: f9b5d0d0cca0
Revises: 2ecb388dd2e8
Create Date: 2026-02-08 11:37:47.532149

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes

# revision identifiers, used by Alembic.
revision = 'f9b5d0d0cca0'
down_revision = '2ecb388dd2e8'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('organizationcard', sa.Column('description', sqlmodel.sql.sqltypes.AutoString(), nullable=True))


def downgrade():
    op.drop_column('organizationcard', 'description')
