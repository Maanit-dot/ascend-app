#!/usr/bin/env python
"""
Development database reset.

Your Alembic migration history got out of sync with the actual models (the
migration script files that would have added columns like `sort_order` are
missing, while your live SQLite file predates them) — the standard fix would
be repairing that migration chain, but since this is local dev data with
nothing worth preserving, it's far faster and more reliable to just rebuild
the schema directly from the current models and reseed.

Usage:
    cd backend
    python scripts/reset_db.py

This does NOT touch Alembic's version history table. If you later move to
Postgres for production, start a fresh Alembic chain there with
`alembic revision --autogenerate -m "initial schema"` against an empty
database, rather than trying to carry this dev history forward.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.base_class import Base  # noqa: E402
from app.db.session import engine  # noqa: E402
import app.models  # noqa: E402,F401 — registers every model on Base.metadata


def reset() -> None:
    print(f"Dropping all tables on {engine.url} ...")
    Base.metadata.drop_all(bind=engine)
    print("Creating all tables from current models ...")
    Base.metadata.create_all(bind=engine)
    print("Schema rebuilt.\n")

    from app.db.seed import seed

    seed()


if __name__ == "__main__":
    confirm = input(
        "This will ERASE all data in the configured database and rebuild it "
        "from scratch. Type 'yes' to continue: "
    )
    if confirm.strip().lower() == "yes":
        reset()
    else:
        print("Aborted — no changes made.")
