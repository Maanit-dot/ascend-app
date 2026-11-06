"""Desktop control, application launching, window management, and system adjustments."""
from __future__ import annotations

import ctypes
import json
import logging
import os
import platform
import re
import shutil
import subprocess
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger("ascend.jarvis.desktop")

_OS = platform.system()

WHITELISTED_APPS = {
    "notepad": "notepad.exe",
    "calculator": "calc.exe",
    "paint": "mspaint.exe",
    "chrome": "chrome.exe",
    "google chrome": "chrome.exe",
    "discord": "Discord.exe",
    "visual studio code": "Code.exe",
    "vs code": "Code.exe",
    "vscode": "Code.exe",
    "steam": "steam.exe",
    "spotify": "Spotify.exe",
    "whatsapp": "WhatsApp.exe",
    "telegram": "Telegram.exe",
    "vlc": "vlc.exe",
    "slack": "slack.exe",
    "zoom": "Zoom.exe",
    "word": "winword.exe",
    "excel": "excel.exe",
    "powerpoint": "powerpnt.exe",
    "task manager": "taskmgr.exe",
    "powershell": "powershell.exe",
    "terminal": "wt.exe",
    "cmd": "cmd.exe",
    "file explorer": "explorer.exe",
    "explorer": "explorer.exe",
    "obsidian": "Obsidian.exe",
    "notion": "Notion.exe",
    "brave": "brave.exe",
    "edge": "msedge.exe",
}

WINDOW_TITLE_HINTS = {
    "notepad": "Notepad",
    "calculator": "Calculator",
    "paint": "Paint",
    "chrome": "Google Chrome",
    "google chrome": "Google Chrome",
    "discord": "Discord",
    "visual studio code": "Visual Studio Code",
    "vs code": "Visual Studio Code",
    "vscode": "Visual Studio Code",
    "steam": "Steam",
    "spotify": "Spotify",
    "whatsapp": "WhatsApp",
    "telegram": "Telegram",
    "vlc": "VLC media player",
    "slack": "Slack",
    "zoom": "Zoom",
    "word": "Word",
    "excel": "Excel",
    "powerpoint": "PowerPoint",
    "task manager": "Task Manager",
    "obsidian": "Obsidian",
    "notion": "Notion",
    "brave": "Brave",
    "edge": "Microsoft Edge",
}

WEBSITE_ALIASES = {
    "youtube": "https://www.youtube.com",
    "netflix": "https://www.netflix.com",
    "google": "https://www.google.com",
    "gmail": "https://mail.google.com",
    "amazon": "https://www.amazon.com",
    "spotify": "https://open.spotify.com",
    "twitter": "https://twitter.com",
    "x": "https://x.com",
    "facebook": "https://www.facebook.com",
    "instagram": "https://www.instagram.com",
    "reddit": "https://www.reddit.com",
    "whatsapp": "https://web.whatsapp.com",
    "whatsapp web": "https://web.whatsapp.com",
    "github": "https://github.com",
    "wikipedia": "https://www.wikipedia.org",
    "twitch": "https://www.twitch.tv",
    "disney plus": "https://www.disneyplus.com",
    "disney+": "https://www.disneyplus.com",
    "prime video": "https://www.primevideo.com",
}

_START_MENU_ROOTS = [
    Path(os.environ.get("ProgramData", "")) / "Microsoft" / "Windows" / "Start Menu" / "Programs",
    Path(os.environ.get("APPDATA", "")) / "Microsoft" / "Windows" / "Start Menu" / "Programs",
]

_app_index_cache: Optional[Dict[str, Path]] = None


def index_installed_apps() -> Dict[str, Path]:
    """Dynamically scan Windows Start Menu for installed applications."""
    global _app_index_cache
    if _app_index_cache is not None:
        return _app_index_cache

    apps: Dict[str, Path] = {}
    if _OS != "Windows":
        _app_index_cache = apps
        return apps

    try:
        import win32com.client
        shell = win32com.client.Dispatch("WScript.Shell")
        for root in _START_MENU_ROOTS:
            if not root.exists():
                continue
            for lnk in root.rglob("*.lnk"):
                stem = lnk.stem.strip().lower()
                # Exclude uninstallers and help links
                if any(bad in stem for bad in ("uninstall", "help", "readme", "documentation")):
                    continue
                try:
                    shortcut = shell.CreateShortCut(str(lnk))
                    target = Path(shortcut.TargetPath)
                    if target.suffix.lower() == ".exe":
                        apps[stem] = lnk
                except Exception:
                    continue
    except Exception as e:
        logger.warning("Start Menu indexing error: %s", e)

    _app_index_cache = apps
    return apps


def list_available_apps() -> List[str]:
    """Return sorted list of all launchable application names."""
    apps = set(WHITELISTED_APPS.keys())
    installed = index_installed_apps()
    apps.update(installed.keys())
    return sorted(apps)


def open_app(target: str) -> Dict[str, Any]:
    """Open an installed desktop application or website alias."""
    name = target.strip().lower()

    # 1. Check website aliases
    if name in WEBSITE_ALIASES:
        url = WEBSITE_ALIASES[name]
        try:
            os.startfile(url)
            return {"status": "success", "target": name, "message": f"Opened {name} in your browser."}
        except Exception as e:
            return {"status": "error", "message": f"Could not open website: {e}"}

    # 2. Check Whitelisted / Known executable apps
    if name in WHITELISTED_APPS:
        exe = WHITELISTED_APPS[name]
        try:
            os.startfile(exe)
            return {"status": "success", "target": name, "message": f"Launched {name}."}
        except Exception:
            try:
                subprocess.Popen(f'start "" "{exe}"', shell=True)
                return {"status": "success", "target": name, "message": f"Launched {name}."}
            except Exception:
                pass

    # 3. Check Start Menu installed applications
    installed = index_installed_apps()
    # Exact or substring match
    match = installed.get(name)
    if not match:
        for app_name, lnk_path in installed.items():
            if name in app_name:
                match = lnk_path
                break

    if match:
        try:
            os.startfile(str(match))
            return {"status": "success", "target": name, "message": f"Launched {name}."}
        except Exception as e:
            return {"status": "error", "message": f"Could not launch {name}: {e}"}

    # 4. Fallback: Windows search bar typing via PyAutoGUI if available
    try:
        import pyautogui
        pyautogui.press("win")
        time.sleep(0.3)
        pyautogui.write(target, interval=0.03)
        time.sleep(0.4)
        pyautogui.press("enter")
        return {"status": "success", "target": target, "message": f"Launched {target} via Windows search."}
    except Exception as e:
        return {"status": "error", "message": f"Application '{target}' not found: {e}"}


launch_app = open_app


def close_app(target: str) -> Dict[str, Any]:
    """Close a running application by process name."""
    name = target.strip().lower()
    exe = WHITELISTED_APPS.get(name)

    if not exe:
        # Check if they gave exact exe name
        if name.endswith(".exe"):
            exe = name
        else:
            exe = f"{name}.exe"

    try:
        res = subprocess.run(["taskkill", "/IM", exe, "/F"], capture_output=True, text=True)
        if res.returncode == 0:
            return {"status": "success", "target": target, "message": f"Closed {target}."}
        return {"status": "error", "message": f"Could not close {target} (is it running?)."}
    except Exception as e:
        return {"status": "error", "message": f"Failed to close application: {e}"}


def switch_window(target: str) -> Dict[str, Any]:
    """Switch focus to an open window by matching application name or title."""
    name = target.strip().lower()
    hint = WINDOW_TITLE_HINTS.get(name, target).lower()

    if _OS != "Windows":
        return {"status": "error", "message": "Window switching only supported on Windows."}

    try:
        import win32con
        import win32gui

        found_hwnd = None

        def enum_cb(hwnd, _extra):
            nonlocal found_hwnd
            if not win32gui.IsWindowVisible(hwnd):
                return True
            title = win32gui.GetWindowText(hwnd).strip().lower()
            if hint in title:
                found_hwnd = hwnd
                return False
            return True

        win32gui.EnumWindows(enum_cb, None)

        if found_hwnd:
            win32gui.ShowWindow(found_hwnd, win32con.SW_RESTORE)
            win32gui.SetForegroundWindow(found_hwnd)
            return {"status": "success", "target": target, "message": f"Switched to {target}."}
        return {"status": "error", "message": f"No open window found for '{target}'."}
    except Exception as e:
        return {"status": "error", "message": f"Failed to switch window: {e}"}


def open_windows_settings(page: str = "") -> Dict[str, Any]:
    """Open Windows Settings directly to a subpage."""
    page_map = {
        "wifi": "network-wifi",
        "network": "network",
        "bluetooth": "bluetooth",
        "display": "display",
        "sound": "sound",
        "apps": "appsfeatures",
        "storage": "storagesense",
        "update": "windowsupdate",
    }
    sub = page_map.get(page.lower().strip(), page.lower().strip())
    uri = f"ms-settings:{sub}" if sub else "ms-settings:"
    try:
        os.startfile(uri)
        return {"status": "success", "message": f"Opened Windows Settings ({sub or 'home'})."}
    except Exception as e:
        return {"status": "error", "message": f"Could not open Windows Settings: {e}"}


def control_volume(action: str = "up", value: Optional[int] = None) -> Dict[str, Any]:
    """Control system audio volume via PyCAW or keyboard fallback."""
    act = action.lower().strip()
    try:
        if value is not None:
            # Set absolute volume %
            val = max(0, min(100, int(value)))
            from ctypes import POINTER, cast
            from comtypes import CLSCTX_ALL
            from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume
            import math
            devices = AudioUtilities.GetSpeakers()
            interface = devices.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
            vol = cast(interface, POINTER(IAudioEndpointVolume))
            vol_db = -65.25 if val == 0 else max(-65.25, 20 * math.log10(val / 100))
            vol.SetMasterVolumeLevel(vol_db, None)
            return {"status": "success", "message": f"Volume set to {val}%."}
    except Exception:
        pass

    # Keypress fallback
    try:
        import pyautogui
        if "up" in act or "increase" in act or "raise" in act:
            for _ in range(5):
                pyautogui.press("volumeup")
            return {"status": "success", "message": "Volume increased."}
        elif "down" in act or "decrease" in act or "lower" in act:
            for _ in range(5):
                pyautogui.press("volumedown")
            return {"status": "success", "message": "Volume decreased."}
        elif "mute" in act or "unmute" in act or "toggle" in act:
            pyautogui.press("volumemute")
            return {"status": "success", "message": "Volume mute toggled."}
    except Exception as e:
        return {"status": "error", "message": f"Volume control failed: {e}"}

    return {"status": "error", "message": "Unknown volume action."}


def control_brightness(action: str = "up", value: Optional[int] = None) -> Dict[str, Any]:
    """Control screen display brightness on Windows via WMI."""
    act = action.lower().strip()
    try:
        if value is not None:
            val = max(0, min(100, int(value)))
            cmd = f"(Get-WmiObject -Namespace root/wmi -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1, {val})"
            subprocess.run(["powershell", "-Command", cmd], capture_output=True, timeout=5)
            return {"status": "success", "message": f"Brightness set to {val}%."}
        elif "up" in act or "increase" in act or "raise" in act:
            cmd = "(Get-WmiObject -Namespace root/wmi -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1, [math]::Min(100, (Get-WmiObject -Namespace root/wmi -Class WmiMonitorBrightness).CurrentBrightness + 10))"
            subprocess.run(["powershell", "-Command", cmd], capture_output=True, timeout=5)
            return {"status": "success", "message": "Brightness increased."}
        elif "down" in act or "decrease" in act or "lower" in act:
            cmd = "(Get-WmiObject -Namespace root/wmi -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1, [math]::Max(0, (Get-WmiObject -Namespace root/wmi -Class WmiMonitorBrightness).CurrentBrightness - 10))"
            subprocess.run(["powershell", "-Command", cmd], capture_output=True, timeout=5)
            return {"status": "success", "message": "Brightness decreased."}
    except Exception as e:
        return {"status": "error", "message": f"Brightness control failed: {e}"}
    return {"status": "error", "message": "Unknown brightness action."}


def open_task_manager() -> Dict[str, Any]:
    """Open Windows Task Manager."""
    try:
        subprocess.Popen("taskmgr.exe")
        return {"status": "success", "message": "Task Manager opened."}
    except Exception as e:
        return {"status": "error", "message": f"Could not open Task Manager: {e}"}


def window_action(action: str) -> Dict[str, Any]:
    """Perform window manipulation: minimize, maximize, snap_left, snap_right, show_desktop."""
    act = action.lower().strip()
    try:
        import pyautogui
        if act == "minimize":
            pyautogui.hotkey("win", "down")
        elif act == "maximize":
            pyautogui.hotkey("win", "up")
        elif act == "snap_left":
            pyautogui.hotkey("win", "left")
        elif act == "snap_right":
            pyautogui.hotkey("win", "right")
        elif act in ("desktop", "show_desktop"):
            pyautogui.hotkey("win", "d")
        elif act == "close_tab":
            pyautogui.hotkey("ctrl", "w")
        elif act == "refresh":
            pyautogui.press("f5")
        return {"status": "success", "message": f"Window action '{action}' executed."}
    except Exception as e:
        return {"status": "error", "message": f"Window action failed: {e}"}


def system_power(action: str) -> Dict[str, Any]:
    """Execute system power operations: lock, sleep, restart, shutdown."""
    act = action.lower().strip()
    try:
        if act == "lock":
            ctypes.windll.user32.LockWorkStation()
            return {"status": "success", "message": "Workstation locked."}
        elif act == "sleep":
            subprocess.run("rundll32.exe powrprof.dll,SetSuspendState 0,1,0", shell=True)
            return {"status": "success", "message": "PC entered sleep state."}
        elif act == "restart":
            subprocess.run(["shutdown", "/r", "/t", "10", "/c", "Restart initiated by ASCEND JARVIS"])
            return {"status": "success", "message": "Restarting PC in 10 seconds."}
        elif act == "shutdown":
            subprocess.run(["shutdown", "/s", "/t", "10", "/c", "Shutdown initiated by ASCEND JARVIS"])
            return {"status": "success", "message": "Shutting down PC in 10 seconds."}
    except Exception as e:
        return {"status": "error", "message": f"Power action '{action}' failed: {e}"}

    return {"status": "error", "message": f"Unknown power action: {action}"}


def set_wallpaper(path_or_url: str) -> Dict[str, Any]:
    """Set Windows desktop wallpaper from a local image file or URL."""
    try:
        target_path = Path(path_or_url)
        if not target_path.exists() and path_or_url.startswith("http"):
            # Download image to temp
            import urllib.request
            tmp_img = Path(os.environ.get("TEMP", "C:/Temp")) / "jarvis_wallpaper.jpg"
            urllib.request.urlretrieve(path_or_url, str(tmp_img))
            target_path = tmp_img

        if not target_path.exists():
            return {"status": "error", "message": f"Image file not found: {path_or_url}"}

        # SPI_SETDESKWALLPAPER = 20
        res = ctypes.windll.user32.SystemParametersInfoW(20, 0, str(target_path.resolve()), 3)
        if res:
            return {"status": "success", "message": "Desktop wallpaper updated successfully."}
        return {"status": "error", "message": "SystemParametersInfoW returned 0."}
    except Exception as e:
        return {"status": "error", "message": f"Failed to set wallpaper: {e}"}
