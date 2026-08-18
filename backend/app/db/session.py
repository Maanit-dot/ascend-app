"""
SQLAlchemy engine + session factory.

Uses the modern SQLAlchemy 2.0 style with a scoped sessionmaker exposed via a
FastAPI dependency (`get_db`) for per-request session lifecycle management.

IMPORTANT: connection pool arguments differ by backend. SQLite (used here in
local dev via `sqlite:///./ascend.db`) is automatically given a `NullPool`
by SQLAlchemy, which does NOT accept `pool_size` / `max_overflow` — passing
them raises a TypeError at import time, which takes down the entire app
before a single request is served. Postgres (production, via
`postgresql+psycopg://...`) uses `QueuePool`, which does accept them. We
detect which backend is configured and only pass pool-sizing kwargs when
they're actually supported.
"""
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

_is_sqlite = settings.DATABASE_URL.startswith("sqlite")

_engine_kwargs: dict = {
    "pool_pre_ping": True,
    "echo": settings.DEBUG and settings.APP_ENV == "development",
}

if _is_sqlite:
    # SQLite: NullPool is used automatically and doesn't accept pool_size/
    # max_overflow. `check_same_thread=False` is required because FastAPI
    # may hand requests to different threads than the one that opened the
    # connection.
    _engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # Postgres/MySQL/etc: QueuePool supports explicit pool sizing.
    _engine_kwargs["pool_size"] = 10
    _engine_kwargs["max_overflow"] = 20

engine = create_engine(settings.DATABASE_URL, **_engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a DB session and guarantees cleanup."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
