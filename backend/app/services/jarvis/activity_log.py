"""Capped persistent action log for ASCEND JARVIS operations."""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, TypedDict

from app.services.jarvis.config import DATA_DIR

LOG_FILE = DATA_DIR / "action_history.json"
MAX_STORED_ACTIONS = 250


class ActionEntry(TypedDict):
    id: str
    timestamp: str
    action: str
    detail: str
    result: str


class ActionLog:
    def __init__(self, path: Path = LOG_FILE) -> None:
        self._path = path

    def _load(self) -> List[Dict[str, Any]]:
        if not self._path.exists():
            return []
        try:
            return json.loads(self._path.read_text(encoding="utf-8"))
        except Exception:
            return []

    def _save(self, entries: List[Dict[str, Any]]) -> None:
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._path.write_text(json.dumps(entries, indent=2), encoding="utf-8")

    def record(self, action: str, detail: str, result: str) -> None:
        entries = self._load()
        entry = {
            "id": uuid.uuid4().hex[:8],
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "action": action,
            "detail": detail,
            "result": result,
        }
        entries.insert(0, entry)
        if len(entries) > MAX_STORED_ACTIONS:
            entries = entries[:MAX_STORED_ACTIONS]
        self._save(entries)

    def recent(self, limit: int = 30) -> List[Dict[str, Any]]:
        return self._load()[:limit]

    def clear(self) -> None:
        if self._path.exists():
            self._path.write_text("[]", encoding="utf-8")


action_log = ActionLog()
