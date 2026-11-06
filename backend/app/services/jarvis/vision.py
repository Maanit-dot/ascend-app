"""Visual awareness: screen capture, webcam vision, and multimodal analysis."""
from __future__ import annotations

import base64
import io
import json
import logging
from pathlib import Path
from typing import Any, Dict, Optional

from app.services.jarvis.config import API_KEYS

logger = logging.getLogger("ascend.jarvis.vision")

try:
    from PIL import Image
    _PIL_OK = True
except ImportError:
    _PIL_OK = False

try:
    import mss
    _MSS_OK = True
except ImportError:
    _MSS_OK = False

try:
    import cv2
    _CV2_OK = True
except ImportError:
    _CV2_OK = False


def capture_screen_image() -> Optional[Image.Image]:
    """Capture main display and return PIL Image."""
    if _MSS_OK:
        try:
            with mss.mss() as sct:
                monitor = sct.monitors[1]
                sct_img = sct.grab(monitor)
                img = Image.frombytes("RGB", sct_img.size, sct_img.bgra, "raw", "BGRX")
                return img
        except Exception as e:
            logger.warning("MSS grab failed: %s", e)

    try:
        from PIL import ImageGrab
        img = ImageGrab.grab()
        if img:
            return img
    except Exception:
        pass

    try:
        import pyautogui
        return pyautogui.screenshot()
    except Exception as e:
        logger.error("Screen capture failed: %s", e)
        # Return blank frame as ultimate fallback so services never crash
        return Image.new("RGB", (1280, 720), color=(15, 15, 25))


def capture_camera_image(camera_index: int = 0) -> Optional[Image.Image]:
    """Capture single frame from connected webcam."""
    if not _CV2_OK or not _PIL_OK:
        return None
    try:
        cap = cv2.VideoCapture(camera_index, cv2.CAP_DSHOW)
        if not cap.isOpened():
            cap = cv2.VideoCapture(camera_index)
        if not cap.isOpened():
            return None
        # Discard first few frames for auto-exposure
        for _ in range(3):
            cap.read()
        ret, frame = cap.read()
        cap.release()
        if ret and frame is not None:
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            return Image.fromarray(rgb)
    except Exception as e:
        logger.error("Webcam capture failed: %s", e)
    return None


def analyze_image_with_ai(image: Image.Image, prompt: str) -> str:
    """Analyze image using Gemini Vision or OpenRouter."""
    api_key = API_KEYS.get("gemini_api_key")
    if api_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-2.5-flash")
            resp = model.generate_content([prompt, image])
            return resp.text.strip()
        except Exception as e:
            logger.warning("Gemini vision error: %s", e)

    # Fallback to OpenRouter multimodal
    or_key = API_KEYS.get("openrouter_api_key")
    if or_key:
        try:
            import httpx
            buf = io.BytesIO()
            image.save(buf, format="JPEG", quality=70)
            b64_img = base64.b64encode(buf.getvalue()).decode("ascii")

            payload = {
                "model": "google/gemini-2.0-flash-lite-preview-02-05:free",
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64_img}"}}
                        ]
                    }
                ]
            }
            with httpx.Client(timeout=30) as client:
                res = client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={"Authorization": f"Bearer {or_key}", "Content-Type": "application/json"},
                    json=payload
                )
                if res.status_code == 200:
                    data = res.json()
                    return data["choices"][0]["message"]["content"].strip()
        except Exception as e:
            logger.error("OpenRouter vision failed: %s", e)

    return "Vision analysis unavailable: No active Vision API key configured."


def process_vision_query(angle: str = "screen", instruction: str = "Describe what is visible.") -> Dict[str, Any]:
    """Capture screen or camera and analyze with AI."""
    is_camera = "camera" in angle.lower() or "webcam" in angle.lower()
    img = capture_camera_image() if is_camera else capture_screen_image()

    if img is None:
        return {"status": "error", "message": f"Could not capture {'camera' if is_camera else 'screen'} frame."}

    # Generate thumbnail base64 for UI feedback
    thumb = img.copy()
    thumb.thumbnail((400, 250))
    buf = io.BytesIO()
    thumb.save(buf, format="JPEG", quality=60)
    thumb_b64 = base64.b64encode(buf.getvalue()).decode("ascii")

    analysis = analyze_image_with_ai(img, instruction)
    return {
        "status": "success",
        "angle": "camera" if is_camera else "screen",
        "analysis": analysis,
        "thumbnail_b64": thumb_b64,
    }
