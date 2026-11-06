"""Unified persistent memory system for ASCEND JARVIS:
- Explicit taught facts & alias resolution (from jarvis-main)
- Structured categorized memory (identity, preferences, projects, relationships, wishes, notes from Mark 39)
- Conversation history storage
"""
from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, TypedDict

from app.services.jarvis.config import DATA_DIR

logger = logging.getLogger("ascend.jarvis.memory")

FACTS_FILE = DATA_DIR / "facts.json"
LONG_TERM_FILE = DATA_DIR / "long_term_memory.json"
CONVERSATION_FILE = DATA_DIR / "conversation_history.json"
CONFIG_FILE = DATA_DIR / "memory_config.json"


def is_memory_enabled() -> bool:
    if not CONFIG_FILE.exists():
        return True
    try:
        return json.loads(CONFIG_FILE.read_text(encoding="utf-8")).get("enabled", True)
    except Exception:
        return True


def set_memory_enabled(enabled: bool) -> bool:
    CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
    CONFIG_FILE.write_text(json.dumps({"enabled": enabled}, indent=2), encoding="utf-8")
    return enabled


class Fact(TypedDict):
    key: str
    value: str


class FactMemory:
    """Explicitly taught preferences and alias resolution."""

    def __init__(self, path: Path = FACTS_FILE) -> None:
        self._path = path

    def _load(self) -> Dict[str, Fact]:
        if not self._path.exists():
            return {}
        try:
            return json.loads(self._path.read_text(encoding="utf-8"))
        except Exception:
            return {}

    def _save(self, facts: Dict[str, Fact]) -> None:
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._path.write_text(json.dumps(facts, indent=2), encoding="utf-8")

    def remember(self, key: str, value: str) -> None:
        facts = self._load()
        clean_key = key.lower().strip()
        facts[clean_key] = {"key": key.strip(), "value": value.strip()}
        self._save(facts)

    def recall(self, key: str) -> Optional[str]:
        entry = self._load().get(key.lower().strip())
        return entry["value"] if entry else None

    def forget(self, key: str) -> bool:
        facts = self._load()
        clean_key = key.lower().strip()
        if clean_key in facts:
            del facts[clean_key]
            self._save(facts)
            return True
        return False

    def all(self) -> List[Fact]:
        return list(self._load().values())


class LongTermMemory:
    """Categorized user memory: identity, preferences, projects, relationships, wishes, notes."""

    CATEGORIES = ("identity", "preferences", "projects", "relationships", "wishes", "notes")

    def __init__(self, path: Path = LONG_TERM_FILE) -> None:
        self._path = path

    def _empty(self) -> Dict[str, Dict[str, Any]]:
        return {cat: {} for cat in self.CATEGORIES}

    def load(self) -> Dict[str, Dict[str, Any]]:
        if not self._path.exists():
            return self._empty()
        try:
            data = json.loads(self._path.read_text(encoding="utf-8"))
            base = self._empty()
            for k in base:
                if k in data and isinstance(data[k], dict):
                    base[k] = data[k]
            return base
        except Exception:
            return self._empty()

    def save(self, memory: Dict[str, Dict[str, Any]]) -> None:
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._path.write_text(json.dumps(memory, indent=2), encoding="utf-8")

    def update(self, new_data: Dict[str, Dict[str, Any]]) -> None:
        current = self.load()
        for cat, items in new_data.items():
            if cat in current and isinstance(items, dict):
                for k, v in items.items():
                    val = v.get("value") if isinstance(v, dict) else str(v)
                    current[cat][k] = {
                        "value": val,
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }
        self.save(current)

    def format_for_prompt(self) -> str:
        data = self.load()
        lines = []
        for cat, items in data.items():
            if items:
                lines.append(f"[{cat.upper()}]")
                for k, v in items.items():
                    val = v.get("value", "") if isinstance(v, dict) else str(v)
                    lines.append(f"• {k}: {val}")
        return "\n".join(lines)


class ConversationMemory:
    """Stores persistent recent conversation turns."""

    def __init__(self, path: Path = CONVERSATION_FILE, max_turns: int = 50) -> None:
        self._path = path
        self.max_turns = max_turns

    def load(self) -> List[Dict[str, str]]:
        if not self._path.exists():
            return []
        try:
            return json.loads(self._path.read_text(encoding="utf-8"))
        except Exception:
            return []

    def append(self, role: str, text: str) -> None:
        history = self.load()
        history.append({
            "role": role,
            "text": text,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        if len(history) > self.max_turns:
            history = history[-self.max_turns:]
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._path.write_text(json.dumps(history, indent=2), encoding="utf-8")

    def clear(self) -> None:
        if self._path.exists():
            self._path.write_text("[]", encoding="utf-8")


fact_memory = FactMemory()
long_term_memory = LongTermMemory()
conversation_memory = ConversationMemory()
