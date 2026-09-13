"""
System Control, Desktop Automation, and App Launcher for ASCEND's JARVIS.
Integrates core capabilities from Mark XXXIX Jarvis into ASCEND.
"""
from __future__ import annotations

import os
import sys
import time
import shutil
import platform
import logging
import subprocess
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger("ascend.tools.system_control")

_OS = platform.system()

_APP_ALIASES: Dict[str, Dict[str, str]] = {
    "whatsapp":           {"Windows": "WhatsApp",               "Darwin": "WhatsApp",            "Linux": "whatsapp"},
    "chrome":             {"Windows": "chrome",                 "Darwin": "Google Chrome",       "Linux": "google-chrome"},
    "google chrome":      {"Windows": "chrome",                 "Darwin": "Google Chrome",       "Linux": "google-chrome"},
    "firefox":            {"Windows": "firefox",                "Darwin": "Firefox",             "Linux": "firefox"},
    "spotify":            {"Windows": "Spotify",                "Darwin": "Spotify",             "Linux": "spotify"},
    "vscode":             {"Windows": "code",                   "Darwin": "Visual Studio Code",  "Linux": "code"},
    "visual studio code": {"Windows": "code",                   "Darwin": "Visual Studio Code",  "Linux": "code"},
    "discord":            {"Windows": "Discord",                "Darwin": "Discord",             "Linux": "discord"},
    "telegram":           {"Windows": "Telegram",               "Darwin": "Telegram",            "Linux": "telegram"},
    "instagram":          {"Windows": "Instagram",              "Darwin": "Instagram",           "Linux": "instagram"},
    "notepad":            {"Windows": "notepad.exe",            "Darwin": "TextEdit",            "Linux": "gedit"},
    "calculator":         {"Windows": "calc.exe",               "Darwin": "Calculator",          "Linux": "gnome-calculator"},
    "terminal":           {"Windows": "cmd.exe",                "Darwin": "Terminal",            "Linux": "gnome-terminal"},
    "cmd":                {"Windows": "cmd.exe",                "Darwin": "Terminal",            "Linux": "bash"},
    "explorer":           {"Windows": "explorer.exe",           "Darwin": "Finder",              "Linux": "nautilus"},
    "file explorer":      {"Windows": "explorer.exe",           "Darwin": "Finder",              "Linux": "nautilus"},
    "paint":              {"Windows": "mspaint.exe",            "Darwin": "Preview",             "Linux": "gimp"},
    "word":               {"Windows": "winword",                "Darwin": "Microsoft Word",      "Linux": "libreoffice --writer"},
    "excel":              {"Windows": "excel",                  "Darwin": "Microsoft Excel",     "Linux": "libreoffice --calc"},
    "powerpoint":         {"Windows": "powerpnt",               "Darwin": "Microsoft PowerPoint","Linux": "libreoffice --impress"},
    "vlc":                {"Windows": "vlc",                    "Darwin": "VLC",                 "Linux": "vlc"},
    "zoom":               {"Windows": "Zoom",                   "Darwin": "zoom.us",             "Linux": "zoom"},
    "slack":              {"Windows": "Slack",                  "Darwin": "Slack",               "Linux": "slack"},
    "steam":              {"Windows": "steam",                  "Darwin": "Steam",               "Linux": "steam"},
    "task manager":       {"Windows": "taskmgr.exe",            "Darwin": "Activity Monitor",    "Linux": "gnome-system-monitor"},
    "settings":           {"Windows": "ms-settings:",           "Darwin": "System Preferences",  "Linux": "gnome-control-center"},
    "powershell":         {"Windows": "powershell.exe",         "Darwin": "Terminal",            "Linux": "bash"},
    "edge":               {"Windows": "msedge",                 "Darwin": "Microsoft Edge",      "Linux": "microsoft-edge"},
    "brave":              {"Windows": "brave",                  "Darwin": "Brave Browser",       "Linux": "brave-browser"},
    "obsidian":           {"Windows": "Obsidian",               "Darwin": "Obsidian",            "Linux": "obsidian"},
    "notion":             {"Windows": "Notion",                 "Darwin": "Notion",              "Linux": "notion"},
}

def open_application(app_name: str) -> Dict[str, Any]:
    clean_name = app_name.strip().lower()
    system_app = _APP_ALIASES.get(clean_name, {}).get(_OS, clean_name)
    logger.info("Attempting to open application '%s' (resolved as '%s')", app_name, system_app)
    try:
        if _OS == "Windows":
            try:
                os.startfile(system_app)
                return {"status": "success", "app": app_name, "message": f"Successfully launched {app_name}."}
            except Exception:
                pass
            try:
                subprocess.Popen(f'start "" "{system_app}"', shell=True)
                return {"status": "success", "app": app_name, "message": f"Successfully launched {app_name}."}
            except Exception:
                pass
            try:
                import pyautogui
                pyautogui.press("win")
                time.sleep(0.5)
                pyautogui.write(app_name, interval=0.04)
                time.sleep(0.6)
                pyautogui.press("enter")
                return {"status": "success", "app": app_name, "message": f"Launched {app_name} via Windows search."}
            except Exception as e:
                return {"status": "error", "app": app_name, "message": f"Could not launch {app_name}: {e}"}
        elif _OS == "Darwin":
            subprocess.Popen(["open", "-a", system_app])
            return {"status": "success", "app": app_name, "message": f"Launched {app_name}."}
        else:
            binary = shutil.which(system_app) or system_app
            subprocess.Popen([binary], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return {"status": "success", "app": app_name, "message": f"Launched {app_name}."}
    except Exception as exc:
        logger.error("Failed to launch app '%s': %s", app_name, exc)
        return {"status": "error", "app": app_name, "message": str(exc)}

def control_audio_volume(action: str = "up", steps: int = 5) -> Dict[str, Any]:
    act = action.lower().strip()
    try:
        import pyautogui
        if "up" in act or "increase" in act:
            for _ in range(steps):
                pyautogui.press("volumeup")
            return {"status": "success", "action": "volume_up", "message": "Volume increased."}
        elif "down" in act or "decrease" in act or "reduce" in act:
            for _ in range(steps):
                pyautogui.press("volumedown")
            return {"status": "success", "action": "volume_down", "message": "Volume decreased."}
        elif "mute" in act:
            pyautogui.press("volumemute")
            return {"status": "success", "action": "volume_mute", "message": "Volume muted/unmuted."}
        else:
            return {"status": "error", "action": act, "message": f"Unknown volume action: {act}"}
    except Exception as exc:
        logger.error("Audio volume control failed: %s", exc)
        return {"status": "error", "action": act, "message": str(exc)}

def take_desktop_screenshot() -> Dict[str, Any]:
    try:
        import pyautogui
        save_dir = Path.home() / "Pictures" / "Ascend_Screenshots"
        save_dir.mkdir(parents=True, exist_ok=True)
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        filepath = save_dir / f"screenshot_{timestamp}.png"
        screenshot = pyautogui.screenshot()
        screenshot.save(filepath)
        return {
            "status": "success",
            "filepath": str(filepath),
            "filename": filepath.name,
            "message": f"Screenshot saved to Pictures/Ascend_Screenshots/{filepath.name}",
        }
    except Exception as exc:
        logger.error("Screenshot capture failed: %s", exc)
        return {"status": "error", "message": f"Failed to capture screenshot: {exc}"}

def manage_system_window(action: str) -> Dict[str, Any]:
    act = action.lower().strip()
    try:
        if "lock" in act:
            if _OS == "Windows":
                subprocess.run("rundll32.exe user32.dll,LockWorkStation", shell=True)
            elif _OS == "Darwin":
                subprocess.run(["pmset", "displaysleepnow"])
            return {"status": "success", "action": "lock", "message": "Computer locked."}
        import pyautogui
        if "minimize" in act or "hide" in act:
            if _OS == "Windows":
                pyautogui.hotkey("win", "d")
            elif _OS == "Darwin":
                pyautogui.hotkey("command", "m")
            return {"status": "success", "action": "minimize", "message": "Desktop minimized."}
        elif "maximize" in act:
            if _OS == "Windows":
                pyautogui.hotkey("win", "up")
            return {"status": "success", "action": "maximize", "message": "Window maximized."}
        elif "close" in act:
            if _OS == "Windows":
                pyautogui.hotkey("alt", "f4")
            elif _OS == "Darwin":
                pyautogui.hotkey("command", "w")
            return {"status": "success", "action": "close", "message": "Active window closed."}
        return {"status": "error", "message": f"Unknown window action '{action}'"}
    except Exception as exc:
        return {"status": "error", "message": str(exc)}

def manage_files(
    action: str,
    target_path: str = "desktop",
    name: Optional[str] = None,
    content: Optional[str] = None,
) -> Dict[str, Any]:
    shortcuts = {
        "desktop":   Path.home() / "Desktop",
        "downloads": Path.home() / "Downloads",
        "documents": Path.home() / "Documents",
        "pictures":  Path.home() / "Pictures",
    }
    base = shortcuts.get(target_path.lower().strip(), Path(target_path).expanduser())
    if not base.exists():
        base = Path.home() / "Desktop"
    act = action.lower().strip()
    try:
        if act == "list":
            items = []
            for item in list(base.iterdir())[:15]:
                kind = "📁" if item.is_dir() else "📄"
                items.append(f"{kind} {item.name}")
            return {
                "status": "success",
                "path": str(base),
                "items": items,
                "summary": f"{len(items)} items in {base.name}",
            }
        elif act == "create_folder" and name:
            folder = base / name
            folder.mkdir(parents=True, exist_ok=True)
            return {"status": "success", "path": str(folder), "message": f"Created folder '{name}' in {base.name}."}
        elif act == "create_file" and name:
            file = base / name
            file.write_text(content or "", encoding="utf-8")
            return {"status": "success", "path": str(file), "message": f"Created file '{name}' in {base.name}."}
        return {"status": "error", "message": f"Unsupported file action: {action}"}
    except Exception as exc:
        return {"status": "error", "message": str(exc)}
