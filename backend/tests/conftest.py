"""Shared pytest fixtures. Kept minimal — leveling/AI engine tests are pure-function
and need no fixtures; DB-backed integration tests would extend this with a
transactional SQLite/Postgres session fixture."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("SECRET_KEY", "test_secret_key")
os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://test:test@localhost:5432/test_db")
