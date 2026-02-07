"""add_legal_coordinates

Revision ID: 2ecb388dd2e8
Revises: 46013e76d5ea
Create Date: 2026-02-04 14:51:25.471247

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2ecb388dd2e8'
down_revision = '46013e76d5ea'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('organizationcard', sa.Column('legal_latitude', sa.Float(), nullable=True))
    op.add_column('organizationcard', sa.Column('legal_longitude', sa.Float(), nullable=True))


def downgrade():
    op.drop_column('organizationcard', 'legal_longitude')
    op.drop_column('organizationcard', 'legal_latitude')
