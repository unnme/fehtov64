"""Make full_name required and unique

Revision ID: full_name_required_unique
Revises: make_category_optional
Create Date: 2026-01-20 22:00:00.000000

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "full_name_required_unique"
down_revision = "make_category_optional"
branch_labels = None
depends_on = None


def upgrade():
    # First, update any NULL full_name values to unique values based on user ID
    # This ensures we can add the NOT NULL constraint
    op.execute("""
        UPDATE "user" 
        SET full_name = 'User_' || id::text 
        WHERE full_name IS NULL
    """)
    
    # Make full_name NOT NULL
    op.alter_column(
        "user",
        "full_name",
        existing_type=sa.String(length=255),
        nullable=False,
    )
    
    # Create unique index on full_name
    op.create_index(
        op.f("ix_user_full_name"),
        "user",
        ["full_name"],
        unique=True,
    )


def downgrade():
    # Drop unique index
    op.drop_index(op.f("ix_user_full_name"), table_name="user")
    
    # Make full_name nullable again
    op.alter_column(
        "user",
        "full_name",
        existing_type=sa.String(length=255),
        nullable=True,
    )
