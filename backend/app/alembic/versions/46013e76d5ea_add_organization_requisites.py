"""add_organization_requisites

Revision ID: 46013e76d5ea
Revises: add_position_flags
Create Date: 2026-02-04 14:32:41.500321

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes

# revision identifiers, used by Alembic.
revision = '46013e76d5ea'
down_revision = 'add_position_flags'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('organizationcard', sa.Column('legal_address', sqlmodel.sql.sqltypes.AutoString(length=500), nullable=True))
    op.add_column('organizationcard', sa.Column('inn', sqlmodel.sql.sqltypes.AutoString(length=10), nullable=True))
    op.add_column('organizationcard', sa.Column('kpp', sqlmodel.sql.sqltypes.AutoString(length=9), nullable=True))
    op.add_column('organizationcard', sa.Column('okpo', sqlmodel.sql.sqltypes.AutoString(length=8), nullable=True))
    op.add_column('organizationcard', sa.Column('ogrn', sqlmodel.sql.sqltypes.AutoString(length=13), nullable=True))
    op.add_column('organizationcard', sa.Column('okfs', sqlmodel.sql.sqltypes.AutoString(length=2), nullable=True))
    op.add_column('organizationcard', sa.Column('okogu', sqlmodel.sql.sqltypes.AutoString(length=7), nullable=True))
    op.add_column('organizationcard', sa.Column('okopf', sqlmodel.sql.sqltypes.AutoString(length=5), nullable=True))
    op.add_column('organizationcard', sa.Column('oktmo', sqlmodel.sql.sqltypes.AutoString(length=11), nullable=True))
    op.add_column('organizationcard', sa.Column('okato', sqlmodel.sql.sqltypes.AutoString(length=11), nullable=True))
    op.add_column('organizationcard', sa.Column('bank_recipient', sqlmodel.sql.sqltypes.AutoString(length=500), nullable=True))
    op.add_column('organizationcard', sa.Column('bank_account', sqlmodel.sql.sqltypes.AutoString(length=20), nullable=True))
    op.add_column('organizationcard', sa.Column('bank_bik', sqlmodel.sql.sqltypes.AutoString(length=9), nullable=True))


def downgrade():
    op.drop_column('organizationcard', 'bank_bik')
    op.drop_column('organizationcard', 'bank_account')
    op.drop_column('organizationcard', 'bank_recipient')
    op.drop_column('organizationcard', 'okato')
    op.drop_column('organizationcard', 'oktmo')
    op.drop_column('organizationcard', 'okopf')
    op.drop_column('organizationcard', 'okogu')
    op.drop_column('organizationcard', 'okfs')
    op.drop_column('organizationcard', 'ogrn')
    op.drop_column('organizationcard', 'okpo')
    op.drop_column('organizationcard', 'kpp')
    op.drop_column('organizationcard', 'inn')
    op.drop_column('organizationcard', 'legal_address')
