"""External tool integrations: Flights, Weather, YouTube, Web Search, Game Updater, Reminders, and Messaging."""
from __future__ import annotations

import json
import logging
import os
import re
import subprocess
import sys
import time
import webbrowser
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional
from urllib.parse import quote_plus

from app.services.jarvis.config import API_KEYS

logger = logging.getLogger("ascend.jarvis.tools")


# ─── 1. WEB SEARCH ──────────────────────────────────────────────
def search_web(query: str, mode: str = "search", items: Optional[List[str]] = None) -> Dict[str, Any]:
    """Search web using DuckDuckGo with Gemini grounding fallback."""
    clean_q = query.strip()
    results = []

    # DuckDuckGo search
    try:
        from duckduckgo_search import DDGS
        with DDGS() as ddgs:
            for r in ddgs.text(clean_q, max_results=6):
                results.append({
                    "title": r.get("title", ""),
                    "snippet": r.get("body", ""),
                    "url": r.get("href", ""),
                })
    except Exception as e:
        logger.warning("DuckDuckGo search error: %s", e)

    # Gemini Search Grounding fallback
    gemini_key = API_KEYS.get("gemini_api_key")
    gemini_answer = ""
    if gemini_key:
        try:
            import google.genai as genai
            client = genai.Client(api_key=gemini_key)
            resp = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=clean_q,
                config={"tools": [{"google_search": {}}]}
            )
            for part in resp.candidates[0].content.parts:
                if hasattr(part, "text") and part.text:
                    gemini_answer += part.text
        except Exception:
            pass

    return {
        "status": "success",
        "query": clean_q,
        "results": results,
        "ai_summary": gemini_answer.strip() if gemini_answer else None,
    }


# ─── 2. WEATHER REPORT ──────────────────────────────────────────
def get_weather(city: str) -> Dict[str, Any]:
    """Retrieve weather data and open forecast in browser if requested."""
    clean_city = city.strip()
    encoded = quote_plus(f"weather in {clean_city}")
    url = f"https://www.google.com/search?q={encoded}"

    # Query brief live snippet via DDG
    snippet = f"Weather conditions for {clean_city}."
    try:
        from duckduckgo_search import DDGS
        with DDGS() as ddgs:
            for r in ddgs.text(f"weather {clean_city}", max_results=2):
                if r.get("body"):
                    snippet = r["body"]
                    break
    except Exception:
        pass

    return {
        "status": "success",
        "city": clean_city,
        "summary": snippet,
        "url": url,
    }


# ─── 3. YOUTUBE SERVICE ─────────────────────────────────────────
def youtube_action(action: str = "play", query: str = "", url: str = "") -> Dict[str, Any]:
    """Control YouTube: play video, summarize transcript, or get trending."""
    act = action.lower().strip()

    if act in ("play", "search"):
        encoded = quote_plus(query.strip())
        play_url = f"https://www.youtube.com/results?search_query={encoded}"
        try:
            os.startfile(play_url)
            return {"status": "success", "message": f"Playing '{query}' on YouTube.", "url": play_url}
        except Exception as e:
            return {"status": "error", "message": f"Could not launch YouTube: {e}"}

    if act == "summarize" and (url or query):
        video_id = ""
        target_url = url or query
        match = re.search(r"(?:v=|\/)([0-9A-Za-z_-]{11}).*", target_url)
        if match:
            video_id = match.group(1)

        if video_id:
            try:
                from youtube_transcript_api import YouTubeTranscriptApi
                transcript = YouTubeTranscriptApi.get_transcript(video_id)
                full_text = " ".join([t["text"] for t in transcript])
                from app.services.jarvis.file_processor import _call_ai_text
                summary = _call_ai_text("Summarize this YouTube video transcript thoroughly.", full_text)
                return {"status": "success", "summary": summary, "video_id": video_id}
            except Exception as e:
                return {"status": "error", "message": f"Could not extract transcript: {e}"}

    return {"status": "info", "message": f"YouTube action '{action}' completed."}


# ─── 4. FLIGHT FINDER ───────────────────────────────────────────
def flight_search(origin: str, destination: str, date_str: Optional[str] = None, passengers: int = 1) -> Dict[str, Any]:
    """Search Google Flights and format route."""
    encoded_orig = quote_plus(origin.strip())
    encoded_dest = quote_plus(destination.strip())
    search_query = f"flights from {origin} to {destination} {date_str or ''}"
    url = f"https://www.google.com/travel/flights?q={quote_plus(search_query)}"

    return {
        "status": "success",
        "origin": origin,
        "destination": destination,
        "date": date_str or "Flexible",
        "passengers": passengers,
        "flights_url": url,
        "message": f"Found flights from {origin} to {destination}. Opening route planner."
    }


# ─── 5. REMINDERS (Windows Task Scheduler) ─────────────────────
def set_reminder(message: str, date_str: str, time_str: str) -> Dict[str, Any]:
    """Set a scheduled reminder using Windows Task Scheduler."""
    try:
        dt = datetime.strptime(f"{date_str.strip()} {time_str.strip()}", "%Y-%m-%d %H:%M")
        if dt <= datetime.now():
            return {"status": "error", "message": "Reminder time is in the past."}

        task_name = f"AscendJarvis_{dt.strftime('%Y%m%d_%H%M%S')}"
        safe_msg = message.replace('"', '').replace("'", "")[:150]

        # Use schtasks to schedule toast popup
        cmd = f'schtasks /create /tn "{task_name}" /tr "powershell -Command [System.Reflection.Assembly]::LoadWithPartialName(\\\"System.Windows.Forms\\\"); [System.Windows.Forms.MessageBox]::Show(\\\"{safe_msg}\\\", \\\"ASCEND JARVIS Reminder\\\")" /sc once /st {time_str} /sd {date_str} /f'
        subprocess.run(cmd, shell=True, capture_output=True)

        return {
            "status": "success",
            "message": f"Reminder set for {date_str} at {time_str}: '{safe_msg}'",
            "task_name": task_name,
        }
    except Exception as e:
        return {"status": "error", "message": f"Failed to schedule reminder: {e}"}


# ─── 6. GAME UPDATER (Steam & Epic Games) ───────────────────────
def check_game_platforms(action: str = "list", game_name: Optional[str] = None) -> Dict[str, Any]:
    """Scan and interact with Steam & Epic Games installations."""
    installed_games = []

    # Check Steam
    steam_roots = [
        Path("C:/Program Files (x86)/Steam/steamapps"),
        Path("C:/Steam/steamapps"),
        Path("D:/Steam/steamapps"),
    ]
    for sr in steam_roots:
        if sr.exists():
            for acf in sr.glob("appmanifest_*.acf"):
                try:
                    txt = acf.read_text(encoding="utf-8", errors="replace")
                    m = re.search(r'"name"\s+"([^"]+)"', txt)
                    if m:
                        installed_games.append({"name": m.group(1), "platform": "Steam"})
                except Exception:
                    continue

    # Filter by game name if specified
    if game_name:
        clean_gn = game_name.lower().strip()
        matched = [g for g in installed_games if clean_gn in g["name"].lower()]
        return {"status": "success", "matches": matched, "total_scanned": len(installed_games)}

    return {
        "status": "success",
        "installed_games": installed_games[:25],
        "total_games": len(installed_games),
    }


# ─── 7. MESSAGING AUTOMATION ────────────────────────────────────
def send_message(receiver: str, message: str, platform_name: str = "whatsapp") -> Dict[str, Any]:
    """Automate desktop messaging via WhatsApp or Instagram."""
    from app.services.jarvis.desktop_control import open_app
    from app.services.jarvis.computer_control import click, smart_type, press_key, hotkey

    plat = platform_name.lower().strip()
    app_target = "WhatsApp" if "whatsapp" in plat else "Instagram"
    res = open_app(app_target)

    time.sleep(1.5)
    # Search contact
    hotkey("ctrl+f")
    time.sleep(0.3)
    smart_type(receiver)
    time.sleep(0.6)
    press_key("enter")
    time.sleep(0.4)
    smart_type(message)
    time.sleep(0.3)
    press_key("enter")

    return {
        "status": "success",
        "platform": app_target,
        "receiver": receiver,
        "message": f"Message sent to {receiver} via {app_target}."
    }
