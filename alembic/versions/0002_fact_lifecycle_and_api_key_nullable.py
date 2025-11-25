"""Add fact lifecycle columns and allow nullable api_key_hash."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from pgvector.sqlalchemy import Vector

# revision identifiers, used by Alembic.
revision = "0002_fact_lifecycle_and_api_key_nullable"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("users", "api_key_hash", existing_type=sa.String(), nullable=True)

    op.add_column(
        "memory_facts",
        sa.Column(
            "superseded_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("memory_facts.id"),
            nullable=True,
        ),
    )
    op.add_column(
        "memory_facts",
        sa.Column("expires_at", sa.TIMESTAMP(timezone=True), nullable=True),
    )
    op.add_column(
        "memory_facts",
        sa.Column(
            "last_refreshed_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index(
        op.f("ix_memory_facts_superseded_by"),
        "memory_facts",
        ["superseded_by"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_memory_facts_superseded_by"), table_name="memory_facts")
    op.drop_column("memory_facts", "last_refreshed_at")
    op.drop_column("memory_facts", "expires_at")
    op.drop_column("memory_facts", "superseded_by")
    op.alter_column("users", "api_key_hash", existing_type=sa.String(), nullable=False)
