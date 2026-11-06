"""Storage, execution, and ASCEND quest synchronization for user automation routines."""
from __future__ import annotations

import json
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional, TypedDict

from app.services.jarvis.config import DATA_DIR

ROUTINES_FILE = DATA_DIR / "routines.json"

STEP_TYPES = (
    "open_app",
    "switch_window",
    "open_settings",
    "open_folder",
    "check_performance",
    "sync_ascend_quest",
)


class Step(TypedDict):
    type: str
    target: str


class Routine(TypedDict):
    id: str
    name: str
    description: Optional[str]
    steps: List[Step]
    linked_quest: Optional[str]  # e.g., "Deep Work" quest name to log on completion
    xp_bonus: Optional[int]


_DEFAULT_ROUTINES: List[Routine] = [
    {
        "id": "study-mode",
        "name": "Deep Study Routine",
        "description": "Opens VS Code, Spotify for study beats, and links progress to Hunter daily quest.",
        "steps": [
            {"type": "open_app", "target": "visual studio code"},
            {"type": "open_app", "target": "spotify"},
            {"type": "open_folder", "target": "documents"},
            {"type": "sync_ascend_quest", "target": "Deep Work"},
        ],
        "linked_quest": "Deep Work",
        "xp_bonus": 50,
    },
    {
        "id": "gaming-mode",
        "name": "Gaming Focus",
        "description": "Launches Steam, Discord, and checks PC telemetry.",
        "steps": [
            {"type": "open_app", "target": "steam"},
            {"type": "open_app", "target": "discord"},
            {"type": "check_performance", "target": ""},
        ],
        "linked_quest": None,
        "xp_bonus": 0,
    },
    {
        "id": "morning-briefing",
        "name": "Morning Briefing & System Prep",
        "description": "Runs hardware diagnostics, opens Chrome dashboard, and checks ASCEND quests.",
        "steps": [
            {"type": "check_performance", "target": ""},
            {"type": "open_app", "target": "chrome"},
            {"type": "sync_ascend_quest", "target": "Morning Routine"},
        ],
        "linked_quest": "Morning Routine",
        "xp_bonus": 25,
    },
]


class RoutineStore:
    def __init__(self, path: Path = ROUTINES_FILE) -> None:
        self._path = path
        self._ensure_seeded()

    def _ensure_seeded(self) -> None:
        if not self._path.exists():
            self._path.parent.mkdir(parents=True, exist_ok=True)
            self._save(_DEFAULT_ROUTINES)

    def _load(self) -> List[Routine]:
        if not self._path.exists():
            return []
        try:
            return json.loads(self._path.read_text(encoding="utf-8"))
        except Exception:
            return []

    def _save(self, routines: List[Routine]) -> None:
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._path.write_text(json.dumps(routines, indent=2), encoding="utf-8")

    def all(self) -> List[Routine]:
        return self._load()

    def get(self, routine_id: str) -> Optional[Routine]:
        for r in self._load():
            if r["id"] == routine_id:
                return r
        return None

    def create(
        self,
        name: str,
        steps: List[Dict[str, str]],
        description: str = "",
        linked_quest: Optional[str] = None,
        xp_bonus: int = 0
    ) -> Routine:
        routines = self._load()
        new_routine: Routine = {
            "id": f"routine-{uuid.uuid4().hex[:6]}",
            "name": name.strip(),
            "description": description.strip(),
            "steps": [{"type": s["type"], "target": s.get("target", "")} for s in steps],
            "linked_quest": linked_quest,
            "xp_bonus": xp_bonus,
        }
        routines.append(new_routine)
        self._save(routines)
        return new_routine

    def update(
        self,
        routine_id: str,
        name: str,
        steps: List[Dict[str, str]],
        description: str = "",
        linked_quest: Optional[str] = None,
        xp_bonus: int = 0
    ) -> Optional[Routine]:
        routines = self._load()
        for i, r in enumerate(routines):
            if r["id"] == routine_id:
                routines[i] = {
                    "id": routine_id,
                    "name": name.strip(),
                    "description": description.strip(),
                    "steps": [{"type": s["type"], "target": s.get("target", "")} for s in steps],
                    "linked_quest": linked_quest,
                    "xp_bonus": xp_bonus,
                }
                self._save(routines)
                return routines[i]
        return None

    def delete(self, routine_id: str) -> bool:
        routines = self._load()
        filtered = [r for r in routines if r["id"] != routine_id]
        if len(filtered) < len(routines):
            self._save(filtered)
            return True
        return False


def execute_routine(routine_id: str, db=None, user=None) -> Dict[str, Any]:
    """Execute each step in the routine and sync with ASCEND quests."""
    from app.services.jarvis.desktop_control import open_app, switch_window, open_windows_settings
    from app.services.jarvis.files import resolve_location
    from app.services.jarvis.telemetry import check_performance
    from app.services.jarvis.activity_log import action_log

    store = RoutineStore()
    routine = store.get(routine_id)
    if not routine:
        return {"status": "error", "message": f"Routine '{routine_id}' not found."}

    results = []
    quest_updated = False

    for step in routine["steps"]:
        stype = step["type"]
        target = step.get("target", "")

        if stype == "open_app":
            res = open_app(target)
            results.append(f"Open app {target}: {res.get('status')}")
        elif stype == "switch_window":
            res = switch_window(target)
            results.append(f"Switch window {target}: {res.get('status')}")
        elif stype == "open_settings":
            res = open_windows_settings(target)
            results.append(f"Settings: {res.get('status')}")
        elif stype == "open_folder":
            import os
            p = resolve_location(target)
            try:
                os.startfile(str(p))
                results.append(f"Open folder {target}: success")
            except Exception as e:
                results.append(f"Open folder {target}: {e}")
        elif stype == "check_performance":
            perf = check_performance()
            results.append(f"Performance: {perf}")
        elif stype == "sync_ascend_quest":
            if db and user and target:
                from app.services.jarvis.ascend_bridge import log_quest_progress
                q_res = log_quest_progress(db, user, target, delta=1)
                results.append(f"ASCEND Quest Sync: {q_res.get('message', 'Updated')}")
                quest_updated = True

    # Check if top-level routine has linked quest
    if db and user and routine.get("linked_quest") and not quest_updated:
        from app.services.jarvis.ascend_bridge import log_quest_progress
        log_quest_progress(db, user, routine["linked_quest"], delta=1)

    summary = f"Executed {len(routine['steps'])} steps for '{routine['name']}'."
    action_log.record("routine_run", routine["name"], summary)

    return {
        "status": "success",
        "routine": routine["name"],
        "summary": summary,
        "step_results": results,
    }


routine_store = RoutineStore()
