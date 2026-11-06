"""JARVIS Configuration & State Paths for ASCEND."""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from typing import Any, Dict, Optional

# ASCEND project backend directory
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent.parent
DATA_DIR = BACKEND_DIR / "data" / "jarvis"
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Path to legacy / standalone keys if present
LEGACY_KEYS_PATH = Path("C:/Users/Lenovo/Documents/Jarvis/config/api_keys.json")


def get_data_path(filename: str) -> Path:
    """Return a path inside ASCEND's jarvis data directory."""
    path = DATA_DIR / filename
    return path


def save_api_keys(gemini_key: Optional[str] = None, openrouter_key: Optional[str] = None) -> Dict[str, Any]:
    """Save user-configured API keys to persistent settings file in DATA_DIR."""
    global API_KEYS
    keys_file = DATA_DIR / "api_keys.json"
    existing = {}
    if keys_file.exists():
        try:
            existing = json.loads(keys_file.read_text(encoding="utf-8"))
        except Exception:
            existing = {}

    if gemini_key is not None:
        existing["gemini_api_key"] = gemini_key.strip()
    if openrouter_key is not None:
        existing["openrouter_api_key"] = openrouter_key.strip()

    keys_file.write_text(json.dumps(existing, indent=2), encoding="utf-8")
    API_KEYS = load_api_keys()
    return get_api_key_status()


def get_api_key_status() -> Dict[str, Any]:
    """Return status indicating which keys are configured without exposing full secrets."""
    g_key = API_KEYS.get("gemini_api_key", "")
    o_key = API_KEYS.get("openrouter_api_key", "")
    return {
        "gemini_configured": bool(g_key),
        "gemini_masked": f"{g_key[:6]}...{g_key[-4:]}" if len(g_key) > 10 else ("Configured" if g_key else ""),
        "openrouter_configured": bool(o_key),
        "openrouter_masked": f"{o_key[:6]}...{o_key[-4:]}" if len(o_key) > 10 else ("Configured" if o_key else ""),
        "offline_fallback_active": not (g_key or o_key),
    }


def load_api_keys() -> Dict[str, Any]:
    """Load API keys from environment, DATA_DIR, or legacy config file."""
    keys: Dict[str, Any] = {
        "gemini_api_key": os.getenv("GEMINI_API_KEY", ""),
        "openrouter_api_key": os.getenv("OPENROUTER_API_KEY", ""),
        "anthropic_api_key": os.getenv("ANTHROPIC_API_KEY", ""),
        "os_system": "windows",
    }

    # Check DATA_DIR first
    data_keys = DATA_DIR / "api_keys.json"
    if data_keys.exists():
        try:
            saved = json.loads(data_keys.read_text(encoding="utf-8"))
            for k, v in saved.items():
                if v:
                    keys[k] = v
        except Exception:
            pass

    # Check Legacy path
    if LEGACY_KEYS_PATH.exists():
        try:
            with open(LEGACY_KEYS_PATH, "r", encoding="utf-8") as f:
                legacy = json.load(f)
                for k, v in legacy.items():
                    if not keys.get(k) and v:
                        keys[k] = v
        except Exception:
            pass

    if not keys.get("openrouter_api_key") and os.getenv("ANTHROPIC_API_KEY"):
        keys["openrouter_api_key"] = os.getenv("ANTHROPIC_API_KEY")

    return keys


API_KEYS = load_api_keys()
