"""Add temporal_state column to memory_facts for temporal awareness.

Distinguishes between current facts (true now), past facts (historical),
future facts (planned), and recurring facts (periodic).
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0004_add_temporal_state"
down_revision = "0003_add_slot_hint"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "memory_facts",
        sa.Column(
            "temporal_state",
            sa.String(length=20),
            nullable=False,
            server_default="current",
        ),
    )
    op.create_index(
        "ix_memory_facts_temporal_state",
        "memory_facts",
        ["temporal_state"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_memory_facts_temporal_state", table_name="memory_facts")
    op.drop_column("memory_facts", "temporal_state")

