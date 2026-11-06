"""Security & permission gate for ASCEND JARVIS system actions."""
from __future__ import annotations

import json
from enum import Enum
from pathlib import Path
from typing import Dict, Set

from app.services.jarvis.config import DATA_DIR

PERMISSIONS_FILE = DATA_DIR / "permissions.json"


class Scope(str, Enum):
    CONTROL_LAUNCH_APP = "control.launch_app"
    CONTROL_MOUSE = "control.mouse"
    CONTROL_KEYBOARD = "control.keyboard"
    FS_READ = "fs.read"
    FS_WRITE = "fs.write"


DEFAULT_GRANTED = {
    Scope.CONTROL_LAUNCH_APP.value,
    Scope.FS_READ.value,
    Scope.CONTROL_KEYBOARD.value,
}


class PermissionManager:
    """Default-deny permission manager with persistent user grants."""

    def __init__(self, path: Path = PERMISSIONS_FILE) -> None:
        self._path = path

    def _load(self) -> Set[str]:
        if not self._path.exists():
            return set(DEFAULT_GRANTED)
        try:
            return set(json.loads(self._path.read_text(encoding="utf-8")))
        except Exception:
            return set(DEFAULT_GRANTED)

    def _save(self, granted: Set[str]) -> None:
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._path.write_text(json.dumps(sorted(list(granted)), indent=2), encoding="utf-8")

    def is_granted(self, scope: Scope | str) -> bool:
        sc = scope.value if isinstance(scope, Scope) else scope
        return sc in self._load()

    def grant(self, scope: Scope | str) -> None:
        sc = scope.value if isinstance(scope, Scope) else scope
        current = self._load()
        current.add(sc)
        self._save(current)

    def revoke(self, scope: Scope | str) -> None:
        sc = scope.value if isinstance(scope, Scope) else scope
        current = self._load()
        current.discard(sc)
        self._save(current)

    def all_statuses(self) -> Dict[str, bool]:
        granted = self._load()
        return {s.value: (s.value in granted) for s in Scope}


permission_manager = PermissionManager()
