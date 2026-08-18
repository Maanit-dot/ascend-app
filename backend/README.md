# ASCEND Backend

FastAPI service powering ASCEND's quest engine, AI systems, and RPG data model.

## Stack

- FastAPI + Uvicorn/Gunicorn
- SQLAlchemy 2.0 (declarative, typed) + Alembic migrations
- PostgreSQL 16
- Firebase Admin SDK for token verification
- Anthropic Messages API for the AI companion / quest rationale / weak-subject analysis

## Local Setup

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in DATABASE_URL, SECRET_KEY, Firebase + Anthropic keys

# Start Postgres + Redis (from repo root)
docker compose up -d postgres redis

# Run migrations
alembic revision --autogenerate -m "initial schema"
alembic upgrade head

# Seed the static catalog (quest templates, items, achievements, titles, story chapters)
python -m app.db.seed

# Run the API
uvicorn app.main:app --reload
```

API docs available at `http://localhost:8000/docs` when `DEBUG=true`.

## Project Layout

```
app/
├── api/v1/          # Route modules — thin, delegate to services
├── core/            # Settings + Firebase auth dependency
├── db/              # Engine/session, declarative base, seed script
├── models/          # SQLAlchemy ORM models (source of truth for schema)
├── schemas/         # Pydantic request/response contracts
├── services/         # Business logic: leveling, quests, bosses, inventory,
│                      achievements, scheduler, character view mapping
└── ai/               # AI engine: Anthropic client, difficulty engine,
                       burnout predictor, quest generator, companion
```

## Key Design Decisions

- **Deterministic core, LLM at the edges.** Difficulty scaling, burnout
  scoring, XP curves, and streak logic are pure functions with unit tests
  (`tests/`). The LLM is only used for qualitative text (rationale,
  motivational messages, weak-subject write-ups) and every LLM call has a
  deterministic fallback so the product never goes down with the AI
  provider.
- **JIT user provisioning.** `get_current_user` creates a `User` +
  `CharacterProfile` row on a Firebase user's first authenticated request —
  no separate signup endpoint needed.
- **Scheduler runs out-of-process.** `scripts/run_scheduler.py` is triggered
  by an external cron (see `railway.toml`) rather than an in-process
  scheduler thread, keeping the API service stateless and horizontally
  scalable.

## Testing

```bash
pytest -v
```

Current coverage focuses on the pure-function engines (`leveling`,
`difficulty_engine`, `burnout_predictor`) since they carry the core game
balance logic and need no database. Extend with DB-backed integration tests
(SQLite in-memory or a test Postgres container) as routes stabilize.

## Migrations

Schema changes: edit the relevant model in `app/models/`, then:

```bash
alembic revision --autogenerate -m "describe the change"
alembic upgrade head
```

Review the generated migration before committing — autogenerate doesn't
reliably detect every change (renamed columns, some constraint changes).
