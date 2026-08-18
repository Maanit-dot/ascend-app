"""
ASCEND API — application entrypoint.
"""
from __future__ import annotations

import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import settings
from app.db.base_class import Base
from app.db.session import engine
import app.models  # noqa: F401 — registers every model on Base.metadata before create_all runs

logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger("ascend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Development-mode startup: creates any missing tables and upserts the
    static catalog data (quest templates, items, achievements, titles, story
    chapters, and the current weekly/monthly boss) every time the API boots.
    `Base.metadata.create_all` never drops or alters existing tables, and
    `seed()` upserts by unique `key`, so this is safe to run on every
    startup, including against a database that already has user data.

    In production against Postgres, prefer running Alembic migrations as a
    separate deploy step instead of relying on `create_all` — this call is
    intentionally cheap/idempotent enough to double as the local dev
    bootstrap without needing a separate manual step.
    """
    logger.info("Ensuring database schema exists...")
    Base.metadata.create_all(bind=engine)

    logger.info("Seeding static catalog data...")
    try:
        from app.db.seed import seed

        seed()
    except Exception:  # noqa: BLE001 — never crash app startup on seed issues
        logger.exception("Seeding failed — the app will still start, but catalog data may be incomplete.")

    yield


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="ASCEND — AI-powered RPG productivity operating system API",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000
    response.headers["X-Process-Time-Ms"] = f"{duration_ms:.2f}"
    return response


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred. Our team has been notified."},
    )

app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/", tags=["health"])
def root() -> dict:
    return {"service": settings.APP_NAME, "status": "online", "version": "1.0.0"}


@app.get("/health", tags=["health"])
def health_check() -> dict:
    return {"status": "healthy"}
