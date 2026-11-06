"""Central JARVIS AI Core Engine for ASCEND:
Unifies LLM reasoning, ASCEND Hunter state, desktop control, tool execution, memory, and safety confirmations.
"""
from __future__ import annotations

import json
import logging
import re
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from app.models.user import User
from app.services.jarvis.config import API_KEYS
from app.services.jarvis.ascend_bridge import (
    get_hunter_briefing,
    log_quest_progress,
    add_custom_quest,
)
from app.services.jarvis.desktop_control import (
    open_app,
    close_app,
    switch_window,
    open_windows_settings,
    control_volume,
    control_brightness,
    open_task_manager,
    window_action,
    system_power,
    set_wallpaper,
)
from app.services.jarvis.computer_control import (
    click,
    double_click,
    right_click,
    type_text,
    smart_type,
    hotkey,
    press_key,
    scroll,
    take_screenshot,
    generate_random_data,
)
from app.services.jarvis.vision import process_vision_query
from app.services.jarvis.files import (
    list_files,
    search_files,
    find_folders,
    create_folder,
    create_file,
    rename_item,
    organize_folder,
    delete_item,
    get_disk_usage,
)
from app.services.jarvis.file_processor import process_file_action
from app.services.jarvis.routines import routine_store, execute_routine
from app.services.jarvis.memory import fact_memory, long_term_memory, conversation_memory, is_memory_enabled
from app.services.jarvis.security import permission_manager, Scope
from app.services.jarvis.activity_log import action_log
from app.services.jarvis.voice import synthesize_speech_base64
from app.services.jarvis.telemetry import check_performance
from app.services.jarvis.tools_bundle import (
    search_web,
    get_weather,
    youtube_action,
    flight_search,
    set_reminder,
    check_game_platforms,
    send_message,
)

logger = logging.getLogger("ascend.jarvis.ai_core")

_pending_confirmation: Optional[Dict[str, Any]] = None


def get_pending_confirmation() -> Optional[Dict[str, Any]]:
    return _pending_confirmation


def set_pending_confirmation(conf: Optional[Dict[str, Any]]) -> None:
    global _pending_confirmation
    _pending_confirmation = conf


JARVIS_PROMPT_TEMPLATE = """You are JARVIS, an ultra-intelligent AI system companion and personal desktop agent built directly into ASCEND — the Hunter's real-life progression system.

Hunter Status:
- Name: {hunter_name}
- Level: {level} ({rank}-Rank {title})
- XP: {total_xp} / {xp_for_next_level} ({xp_progress_pct}% to next level)
- Daily Quests ({quests_completed}/{quests_total} completed):
{quests_summary}

Memory & Preferences:
{memory_context}

Capabilities:
1. ASCEND Progression: Query status, complete quests, add quests, optimize workload, award XP.
2. Desktop & OS Control: Launch apps (Notepad, Calculator, VS Code, Discord, Spotify, Chrome, Steam, etc.), close apps, switch windows, adjust volume, change wallpaper, system settings, lock/sleep/restart PC.
3. Computer Automation: Type text, mouse clicks, hotkeys, scrolling, take screenshots.
4. Screen & Camera Vision: Capture screen or webcam and analyze what is visible.
5. Files & Processing: Search files, organize desktop/folders, process documents/images/PDFs/code/audio/video/spreadsheets.
6. Automations & Routines: Run automation routines (e.g. Deep Study Routine) that automatically launch apps and update ASCEND quests!
7. External Tools: Web search, live weather, YouTube play & transcripts, flight search, scheduled reminders, WhatsApp/Instagram messaging, Steam/Epic games status.

Output Format:
You MUST respond with a valid JSON object matching:
{{
  "reply": "Crisp, supportive, high-precision verbal response addressing the Hunter.",
  "action": null OR {{
     "type": "QUEST_MUTATION" | "SYSTEM_CONTROL" | "COMPUTER_CONTROL" | "VISION" | "FILE_CONTROL" | "FILE_PROCESSOR" | "AUTOMATION" | "DEV_AGENT" | "TOOL" | "REMEMBER_FACT",
     "action_name": "OPEN_APP" | "CLOSE_APP" | "SWITCH_WINDOW" | "VOLUME" | "SETTINGS" | "POWER" | "WALLPAPER" | "SCREENSHOT" | "CLICK" | "TYPE" | "HOTKEY" | "VISION_QUERY" | "SEARCH_FILES" | "ORGANIZE" | "RUN_ROUTINE" | "UPDATE_QUEST" | "ADD_QUEST" | "WEB_SEARCH" | "WEATHER" | "YOUTUBE" | "FLIGHTS" | "REMINDER" | "GAMES" | "SEND_MESSAGE" | "DEV_BUILD",
     "target": "target app, folder, routine id, or key",
     "value": "parameter or text",
     "extra": {{}}
  }}
}}
"""


def _build_system_prompt(briefing: Dict[str, Any]) -> str:
    q_lines = []
    for q in briefing.get("quests", []):
        status = "[DONE]" if q.get("is_completed") else "[ACTIVE]"
        q_lines.append(f"  • {status} {q['name']} ({q['current']}/{q['target']} {q.get('unit', '')}) +{q.get('xp_reward', 0)} XP")
    q_summary = "\n".join(q_lines) if q_lines else "  No active quests today."

    mem_context = ""
    if is_memory_enabled():
        facts = fact_memory.all()
        fact_lines = [f"• {f['key']}: {f['value']}" for f in facts]
        lt_mem = long_term_memory.format_for_prompt()
        mem_context = lt_mem + ("\n" + "\n".join(fact_lines) if fact_lines else "")

    return JARVIS_PROMPT_TEMPLATE.format(
        hunter_name=briefing.get("hunter_name", "Hunter"),
        level=briefing.get("level", 1),
        rank=briefing.get("rank", "E"),
        title=briefing.get("title", "Hunter"),
        total_xp=briefing.get("total_xp", 0),
        xp_for_next_level=briefing.get("xp_for_next_level", 1000),
        xp_progress_pct=briefing.get("xp_progress_pct", 0),
        quests_completed=briefing.get("quests_completed", 0),
        quests_total=briefing.get("quests_total", 0),
        quests_summary=q_summary,
        memory_context=mem_context or "None recorded yet.",
    )


def _call_llm_json(system_prompt: str, user_prompt: str) -> Dict[str, Any]:
    """Call Gemini or OpenRouter with JSON output requirement."""
    # 1. Gemini
    gemini_key = API_KEYS.get("gemini_api_key")
    if gemini_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel("gemini-2.5-flash", system_instruction=system_prompt)
            resp = model.generate_content(
                user_prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            data = json.loads(resp.text)
            if "reply" in data:
                return data
        except Exception as e:
            logger.warning("Gemini JSON call failed: %s", e)

    # 2. OpenRouter fallback
    or_key = API_KEYS.get("openrouter_api_key")
    if or_key:
        try:
            import httpx
            with httpx.Client(timeout=30) as client:
                res = client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={"Authorization": f"Bearer {or_key}", "Content-Type": "application/json"},
                    json={
                        "model": "google/gemini-2.0-flash-lite-preview-02-05:free",
                        "messages": [
                            {"role": "system", "content": system_prompt + "\nReturn ONLY valid JSON."},
                            {"role": "user", "content": user_prompt}
                        ],
                        "response_format": {"type": "json_object"}
                    }
                )
                if res.status_code == 200:
                    content = res.json()["choices"][0]["message"]["content"]
                    match = re.search(r"\{.*\}", content, re.DOTALL)
                    if match:
                        return json.loads(match.group(0))
        except Exception as e:
            logger.error("OpenRouter JSON call failed: %s", e)

    # Deterministic Pattern-Matching Fallback
    return _fallback_pattern_match(user_prompt)


def _fallback_pattern_match(command: str) -> Dict[str, Any]:
    """Robust offline / deterministic fallback pattern matcher."""
    c = command.lower().strip()

    # Open app
    m = re.match(r"(?:open|launch|start)\s+(.+)", c)
    if m:
        target = m.group(1).replace("app", "").strip()
        return {
            "reply": f"Launching {target}, Hunter.",
            "action": {"type": "SYSTEM_CONTROL", "action_name": "OPEN_APP", "target": target}
        }

    # Close app
    m = re.match(r"(?:close|exit|terminate|kill)\s+(.+)", c)
    if m:
        target = m.group(1).replace("app", "").strip()
        return {
            "reply": f"Shall I terminate {target}, Hunter? Please confirm.",
            "action": {"type": "SYSTEM_CONTROL", "action_name": "CLOSE_APP", "target": target}
        }

    # Volume
    if "volume up" in c or "louder" in c:
        return {"reply": "Raising master audio volume, Hunter.", "action": {"type": "SYSTEM_CONTROL", "action_name": "VOLUME", "target": "up"}}
    if "volume down" in c or "quieter" in c:
        return {"reply": "Lowering master audio volume, Hunter.", "action": {"type": "SYSTEM_CONTROL", "action_name": "VOLUME", "target": "down"}}
    if "mute" in c:
        return {"reply": "Toggling master audio mute, Hunter.", "action": {"type": "SYSTEM_CONTROL", "action_name": "VOLUME", "target": "mute"}}

    # Brightness
    if "brightness up" in c or "brighter" in c:
        return {"reply": "Increasing display brightness, Hunter.", "action": {"type": "SYSTEM_CONTROL", "action_name": "BRIGHTNESS", "target": "up"}}
    if "brightness down" in c or "dimmer" in c:
        return {"reply": "Decreasing display brightness, Hunter.", "action": {"type": "SYSTEM_CONTROL", "action_name": "BRIGHTNESS", "target": "down"}}

    # Window management
    if "task manager" in c:
        return {"reply": "Opening Windows Task Manager, Hunter.", "action": {"type": "SYSTEM_CONTROL", "action_name": "TASK_MANAGER"}}
    if "minimize" in c:
        return {"reply": "Minimizing active window, Hunter.", "action": {"type": "SYSTEM_CONTROL", "action_name": "WINDOW", "target": "minimize"}}
    if "maximize" in c:
        return {"reply": "Maximizing active window, Hunter.", "action": {"type": "SYSTEM_CONTROL", "action_name": "WINDOW", "target": "maximize"}}
    if "show desktop" in c or "desktop" == c:
        return {"reply": "Displaying desktop view, Hunter.", "action": {"type": "SYSTEM_CONTROL", "action_name": "WINDOW", "target": "desktop"}}

    # Screenshot
    if "screenshot" in c or "capture screen" in c:
        return {"reply": "Capturing current desktop display view, Hunter.", "action": {"type": "COMPUTER_CONTROL", "action_name": "SCREENSHOT"}}

    # Quests / Status
    if "quest" in c or "daily" in c or "today" in c:
        return {"reply": "Scanning your active daily quest directives, Hunter.", "action": {"type": "QUEST_MUTATION", "action_name": "QUERY"}}

    # Weather
    m = re.search(r"weather(?:\s+in|\s+for)?\s+([a-zA-Z\s]+)", c)
    if m:
        city = m.group(1).strip()
        return {"reply": f"Checking atmospheric forecast for {city}, Hunter.", "action": {"type": "TOOL", "action_name": "WEATHER", "target": city}}

    # Web search
    m = re.match(r"(?:search|google|look up)\s+(.+)", c)
    if m:
        query = m.group(1).strip()
        return {"reply": f"Initiating telemetry web search for '{query}'...", "action": {"type": "TOOL", "action_name": "WEB_SEARCH", "target": query}}

    # YouTube
    if "youtube" in c or "play" in c:
        query = re.sub(r"^(?:play|open|search)\s+", "", c).replace("on youtube", "").strip()
        return {"reply": f"Streaming '{query}' on YouTube, Hunter.", "action": {"type": "TOOL", "action_name": "YOUTUBE", "target": query}}

    # General
    return {
        "reply": f"Standing by, Hunter. Systems operational. How may I assist your ascent today?",
        "action": None
    }


def process_user_turn(
    db: Session,
    user: User,
    command: str,
    confirmation_answer: Optional[str] = None
) -> Dict[str, Any]:
    """Main entry point for conversational turns: handles confirmations, reasoning, tool execution, and state synchronization."""
    global _pending_confirmation

    # 1. Handle Pending Confirmation if active
    if _pending_confirmation and confirmation_answer:
        conf = _pending_confirmation
        _pending_confirmation = None
        ans = confirmation_answer.lower().strip()
        if ans in ("yes", "y", "confirm", "proceed", "do it"):
            # Execute confirmed action
            act_type = conf.get("type")
            act_name = conf.get("action_name")
            target = conf.get("target")

            if act_name == "CLOSE_APP" and target:
                res = close_app(target)
                action_log.record("close_app", target, res.get("message", "Closed"))
                reply = res.get("message", f"Closed {target}.")
                return {"reply": reply, "action": res, "audio_base64": synthesize_speech_base64(reply)}
            elif act_name == "RUN_ROUTINE" and target:
                res = execute_routine(target, db=db, user=user)
                reply = res.get("summary", f"Executed routine {target}.")
                return {"reply": reply, "action": res, "audio_base64": synthesize_speech_base64(reply)}
            elif act_name == "ORGANIZE" and target:
                res = organize_folder(target)
                action_log.record("organize_folder", target, res.get("message", "Organized"))
                reply = res.get("message", "Folder organized.")
                return {"reply": reply, "action": res, "audio_base64": synthesize_speech_base64(reply)}
        else:
            return {"reply": "Action cancelled, Hunter.", "action": {"status": "cancelled"}}

    # 2. Build Live Context
    briefing = get_hunter_briefing(db, user)
    system_prompt = _build_system_prompt(briefing)

    # 3. Check for Alias substitution in command (from FactMemory)
    processed_cmd = command
    for fact in fact_memory.all():
        if fact["key"].lower() in processed_cmd.lower():
            processed_cmd = re.sub(re.escape(fact["key"]), fact["value"], processed_cmd, flags=re.IGNORECASE)

    # 4. LLM Decision & Tool Proposal
    llm_res = _call_llm_json(system_prompt, processed_cmd)
    reply_text = llm_res.get("reply", "Command acknowledged, Hunter.")
    action_data = llm_res.get("action")
    action_result = None

    # 5. Execute Action if requested
    if action_data:
        atype = action_data.get("type")
        aname = action_data.get("action_name")
        target = action_data.get("target")
        val = action_data.get("value")

        # Confirmation Gate for Risky Actions
        if aname == "CLOSE_APP":
            _pending_confirmation = {"type": atype, "action_name": aname, "target": target}
            return {
                "reply": f"Are you sure you want me to close {target}, Hunter? Any unsaved work may be lost.",
                "confirmation_required": True,
                "confirmation": _pending_confirmation,
                "audio_base64": synthesize_speech_base64(f"Confirm closing {target}, Hunter?"),
            }
        elif aname == "RUN_ROUTINE" and not confirmation_answer:
            _pending_confirmation = {"type": atype, "action_name": aname, "target": target}
            return {
                "reply": f"Ready to initiate automation routine '{target}'. Proceed, Hunter?",
                "confirmation_required": True,
                "confirmation": _pending_confirmation,
                "audio_base64": synthesize_speech_base64(f"Initiate routine {target}, Hunter?"),
            }
        elif aname == "ORGANIZE" and not confirmation_answer:
            _pending_confirmation = {"type": atype, "action_name": aname, "target": target}
            return {
                "reply": f"Shall I reorganize the files in {target or 'Desktop'} by category, Hunter?",
                "confirmation_required": True,
                "confirmation": _pending_confirmation,
                "audio_base64": synthesize_speech_base64("Confirm folder reorganization, Hunter?"),
            }

        # SYSTEM CONTROL
        if atype == "SYSTEM_CONTROL":
            if not permission_manager.is_granted(Scope.CONTROL_LAUNCH_APP):
                reply_text = "Permission denied: 'Control applications' is disabled in Settings."
            else:
                if aname == "OPEN_APP":
                    action_result = open_app(target)
                    action_log.record("open_app", target, action_result.get("message", ""))
                elif aname == "SWITCH_WINDOW":
                    action_result = switch_window(target)
                elif aname == "VOLUME":
                    action_result = control_volume(target, value=int(val) if val and str(val).isdigit() else None)
                elif aname == "BRIGHTNESS":
                    action_result = control_brightness(target, value=int(val) if val and str(val).isdigit() else None)
                elif aname == "TASK_MANAGER":
                    action_result = open_task_manager()
                elif aname == "WINDOW":
                    action_result = window_action(target or "minimize")
                elif aname == "SETTINGS":
                    action_result = open_windows_settings(target or "")
                elif aname == "POWER":
                    action_result = system_power(target)
                elif aname == "WALLPAPER":
                    action_result = set_wallpaper(target or val)

        # COMPUTER CONTROL
        elif atype == "COMPUTER_CONTROL":
            if aname == "SCREENSHOT":
                action_result = take_screenshot()
                action_log.record("screenshot", "desktop", action_result.get("path", ""))
            elif aname == "CLICK":
                action_result = click()
            elif aname == "TYPE":
                action_result = smart_type(val or target)
            elif aname == "HOTKEY":
                action_result = hotkey(target or val)

        # VISION
        elif atype == "VISION":
            action_result = process_vision_query(angle=target or "screen", instruction=val or reply_text)
            if action_result.get("analysis"):
                reply_text = action_result["analysis"]

        # FILES
        elif atype == "FILE_CONTROL":
            if not permission_manager.is_granted(Scope.FS_READ):
                reply_text = "Permission denied: 'Search files' is disabled in Settings."
            else:
                if aname == "SEARCH_FILES":
                    action_result = search_files(target or val)
                elif aname == "FIND_FOLDERS":
                    action_result = find_folders(target or val)

        # AUTOMATION
        elif atype == "AUTOMATION":
            if aname == "RUN_ROUTINE":
                action_result = execute_routine(target, db=db, user=user)

        # ASCEND QUEST MUTATION
        elif atype == "QUEST_MUTATION":
            if aname in ("UPDATE_QUEST", "COMPLETE_QUEST"):
                delta = int(val) if val and str(val).isdigit() else 1
                action_result = log_quest_progress(db, user, target or "quest", delta=delta)
                if action_result.get("status") == "success":
                    reply_text = action_result.get("message", reply_text)
            elif aname == "ADD_QUEST":
                target_val = int(val) if val and str(val).isdigit() else 30
                action_result = add_custom_quest(db, user, title=target, target_value=target_val)
                if action_result.get("status") == "success":
                    reply_text = action_result.get("message", reply_text)

        # EXTERNAL TOOLS
        elif atype == "TOOL":
            if aname == "WEB_SEARCH":
                action_result = search_web(target or val)
            elif aname == "WEATHER":
                action_result = get_weather(target or val)
            elif aname == "YOUTUBE":
                action_result = youtube_action("play", query=target or val)
            elif aname == "FLIGHTS":
                action_result = flight_search(origin=target or "JFK", destination=val or "LHR")
            elif aname == "REMINDER":
                extra = action_data.get("extra", {})
                action_result = set_reminder(target or "Reminder", extra.get("date", "2026-10-01"), extra.get("time", "12:00"))
            elif aname == "GAMES":
                action_result = check_game_platforms(action="list", game_name=target or val)
            elif aname == "SEND_MESSAGE":
                extra = action_data.get("extra", {})
                action_result = send_message(receiver=target, message=val, platform_name=extra.get("platform", "whatsapp"))

        # REMEMBER FACT
        elif atype == "REMEMBER_FACT":
            if is_memory_enabled() and target and val:
                fact_memory.remember(target, val)
                reply_text = f"Remembered: {target} is {val}, Hunter."

    # 6. Log Conversation & Synthesize Speech
    conversation_memory.append("user", command)
    conversation_memory.append("assistant", reply_text)
    audio_b64 = synthesize_speech_base64(reply_text)

    return {
        "reply": reply_text,
        "action": action_result or action_data,
        "audio_base64": audio_b64,
        "confirmation": _pending_confirmation,
    }
