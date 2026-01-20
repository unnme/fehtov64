"""Make document category optional

Revision ID: make_category_optional
Revises: add_document_tables
Create Date: 2024-01-01 12:00:00.000000

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "make_category_optional"
down_revision = "add_document_tables"
branch_labels = None
depends_on = None


def upgrade():
    # Make category_id nullable and change ondelete to SET NULL
    op.alter_column(
        "document",
        "category_id",
        nullable=True,
        existing_type=sa.UUID(),
    )
    
    # Drop the foreign key constraint
    op.drop_constraint(
        "document_category_id_fkey",
        "document",
        type_="foreignkey"
    )
    
    # Recreate foreign key with SET NULL on delete
    op.create_foreign_key(
        "document_category_id_fkey",
        "document",
        "documentcategory",
        ["category_id"],
        ["id"],
        ondelete="SET NULL"
    )


def downgrade():
    # Revert to CASCADE and NOT NULL
    op.drop_constraint(
        "document_category_id_fkey",
        "document",
        type_="foreignkey"
    )
    
    # Set all NULL category_ids to a default category or delete documents
    # For safety, we'll set them to NULL first, then make it NOT NULL
    # In production, you might want to create a default category first
    op.execute("""
        UPDATE document 
        SET category_id = NULL 
        WHERE category_id IS NULL
    """)
    
    op.create_foreign_key(
        "document_category_id_fkey",
        "document",
        "documentcategory",
        ["category_id"],
        ["id"],
        ondelete="CASCADE"
    )
    
    op.alter_column(
        "document",
        "category_id",
        nullable=False,
        existing_type=sa.UUID(),
    )
