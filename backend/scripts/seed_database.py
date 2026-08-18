#!/usr/bin/env python
"""
Development database seed — convenience entrypoint.

This used to contain its own hand-written copy of the quest/boss/item/
achievement/title/story-chapter catalog, which had drifted out of sync with
`app/db/seed.py` (different quest template keys, different `primary_stat`
values that don't match any `CharacterProfile` column, no `sort_order`,
etc.). That duplication was a bug risk: running this script populated
quest templates that `app.services.quest_service.MANDATORY_TEMPLATE_KEYS`
would never actually assign to a user, while leaving the canonical daily
quest keys unseeded, and it never created any bosses at all.

`app/db/seed.py` is the single source of truth for catalog data now (and
runs automatically on API startup — see `app/main.py`). This script simply
delegates to it so any old muscle-memory of running
`python scripts/seed_database.py` still does the right thing.

Usage:
    cd backend
    python scripts/seed_database.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.seed import seed  # noqa: E402

if __name__ == "__main__":
    seed()
