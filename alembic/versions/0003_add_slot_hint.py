"""Add slot_hint column to memory_facts for slot-based supersession."""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0003_add_slot_hint"
down_revision = "0002_fact_lifecycle"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "memory_facts",
        sa.Column("slot_hint", sa.String(length=50), nullable=True),
    )
    op.create_index(
        "ix_memory_facts_slot_hint",
        "memory_facts",
        ["slot_hint"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_memory_facts_slot_hint", table_name="memory_facts")
    op.drop_column("memory_facts", "slot_hint")
