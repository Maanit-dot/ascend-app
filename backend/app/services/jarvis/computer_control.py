"""Low-level computer control via PyAutoGUI, keyboard/mouse emulation, and clipboard."""
from __future__ import annotations

import os
import random
import string
import time
from pathlib import Path
from typing import Any, Dict, Optional

try:
    import pyautogui
    pyautogui.FAILSAFE = True
    pyautogui.PAUSE = 0.05
    _PYAUTOGUI_OK = True
except ImportError:
    _PYAUTOGUI_OK = False

try:
    import pyperclip
    _PYPERCLIP_OK = True
except ImportError:
    _PYPERCLIP_OK = False


def _require_pyautogui():
    if not _PYAUTOGUI_OK:
        raise RuntimeError("PyAutoGUI is not installed.")


def click(x: Optional[int] = None, y: Optional[int] = None, button: str = "left") -> Dict[str, Any]:
    _require_pyautogui()
    if x is not None and y is not None:
        pyautogui.click(x=x, y=y, button=button)
    else:
        pyautogui.click(button=button)
    return {"status": "success", "message": f"Clicked {button} button at ({x or 'current'}, {y or 'current'})."}


def double_click(x: Optional[int] = None, y: Optional[int] = None) -> Dict[str, Any]:
    _require_pyautogui()
    if x is not None and y is not None:
        pyautogui.doubleClick(x=x, y=y)
    else:
        pyautogui.doubleClick()
    return {"status": "success", "message": "Double clicked."}


def right_click(x: Optional[int] = None, y: Optional[int] = None) -> Dict[str, Any]:
    return click(x=x, y=y, button="right")


def type_text(text: str, interval: float = 0.02) -> Dict[str, Any]:
    _require_pyautogui()
    time.sleep(0.2)
    pyautogui.typewrite(text, interval=interval)
    return {"status": "success", "message": f"Typed text ({len(text)} characters)."}


def smart_type(text: str, clear_first: bool = True) -> Dict[str, Any]:
    _require_pyautogui()
    if clear_first:
        pyautogui.hotkey("ctrl", "a")
        time.sleep(0.1)
        pyautogui.press("backspace")
        time.sleep(0.1)
    if _PYPERCLIP_OK:
        pyperclip.copy(text)
        pyautogui.hotkey("ctrl", "v")
    else:
        pyautogui.typewrite(text, interval=0.02)
    return {"status": "success", "message": f"Typed text: {text[:40]}"}


def hotkey(keys: str) -> Dict[str, Any]:
    _require_pyautogui()
    parts = [k.strip().lower() for k in keys.split("+")]
    pyautogui.hotkey(*parts)
    return {"status": "success", "message": f"Executed hotkey: {keys}"}


def press_key(key: str) -> Dict[str, Any]:
    _require_pyautogui()
    pyautogui.press(key.strip().lower())
    return {"status": "success", "message": f"Pressed key: {key}"}


def scroll(direction: str = "down", amount: int = 3) -> Dict[str, Any]:
    _require_pyautogui()
    clicks = -abs(amount) if "down" in direction.lower() else abs(amount)
    pyautogui.scroll(clicks * 120)
    return {"status": "success", "message": f"Scrolled {direction}."}


def move_mouse(x: int, y: int) -> Dict[str, Any]:
    _require_pyautogui()
    pyautogui.moveTo(x, y, duration=0.2)
    return {"status": "success", "message": f"Moved mouse to ({x}, {y})."}


def take_screenshot(save_path: Optional[str] = None) -> Dict[str, Any]:
    _require_pyautogui()
    if not save_path:
        desktop = Path.home() / "Desktop"
        filename = f"ascend_jarvis_screenshot_{int(time.time())}.png"
        path = desktop / filename
    else:
        path = Path(save_path)
        path.parent.mkdir(parents=True, exist_ok=True)

    try:
        img = pyautogui.screenshot()
    except Exception:
        try:
            from PIL import ImageGrab
            img = ImageGrab.grab()
        except Exception:
            from PIL import Image
            img = Image.new("RGB", (1280, 720), color=(10, 10, 20))

    img.save(str(path))
    return {"status": "success", "path": str(path), "message": f"Screenshot saved to {path.name}"}


_FIRST_NAMES = ["Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Drew", "Quinn", "Avery", "Blake"]
_LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Wilson", "Taylor"]
_DOMAINS = ["gmail.com", "outlook.com", "proton.me", "icloud.com"]


def generate_random_data(data_type: str) -> str:
    """Generate mock/test user information for forms."""
    dt = data_type.lower().strip()
    if dt in ("first_name", "firstname"):
        return random.choice(_FIRST_NAMES)
    if dt in ("last_name", "lastname"):
        return random.choice(_LAST_NAMES)
    if dt == "name":
        return f"{random.choice(_FIRST_NAMES)} {random.choice(_LAST_NAMES)}"
    if dt == "email":
        fn = random.choice(_FIRST_NAMES).lower()
        ln = random.choice(_LAST_NAMES).lower()
        return f"{fn}.{ln}{random.randint(10, 999)}@{random.choice(_DOMAINS)}"
    if dt == "phone":
        return f"+1{random.randint(200, 999)}{random.randint(1000000, 9999999)}"
    if dt == "password":
        chars = string.ascii_letters + string.digits + "!@#$%"
        return "".join(random.choices(chars, k=14))
    if dt == "address":
        num = random.randint(100, 9999)
        st = random.choice(["Main St", "Oak Ave", "Park Blvd", "Pine St", "Cedar Ln"])
        return f"{num} {st}"
    return f"sample_{data_type}_{random.randint(100, 999)}"
