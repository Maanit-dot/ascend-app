"""JARVIS Intelligent LLM Engine & Quest Mutation Service for ASCEND."""
from __future__ import annotations

import json
import logging
import re
from datetime import date
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from app.ai.client import AIClientError, call_ai
from app.core.config import settings
from app.models.quest import QuestCategory, QuestInstance, QuestTemplate, QuestType, QuestUnit
from app.models.user import User
from app.services import quest_service
from app.services.leveling import xp_required_for_level, xp_progress_percent
from app.services.tools.web_search import search_web
from app.services.tools.weather_service import get_weather
from app.services.tools.youtube_service import search_youtube
from app.services.tools.code_assistant import format_code_response

logger = logging.getLogger("ascend.jarvis")

JARVIS_SYSTEM_PROMPT = """You are JARVIS, an intelligent, high-precision AI system companion built into ASCEND — a Solo Leveling-inspired personal progression system.

Your identity:
- You speak with crisp, intelligent, supportive system companion tone ("Hunter [Name]").
- You have full awareness of the Hunter's real live character status, active daily quests, and stats.
- You can execute control actions on the Hunter's ASCEND system (modifying quest targets, optimizing workload, adding new quests).
- You can execute external actions: real-time web search, live weather reports, YouTube study media lookup, code generation, and reminders.

AVAILABLE SYSTEM ACTIONS:
When the user requests a quest change, search, weather, YouTube, code, or reminder, include an `action` object in your JSON response.

Your response MUST be a valid JSON object matching this schema:
{
  "reply": "Your natural language response to the Hunter",
  "action": null OR {
     "type": "QUEST_MUTATION" | "WEB_SEARCH" | "WEATHER_REPORT" | "YOUTUBE_SEARCH" | "CODE_ASSIST" | "REMINDER" | "QUERY_RESULT" | "GENERAL_KNOWLEDGE",
     "action_name": "UPDATE_TARGET" | "OPTIMIZE_WORKLOAD" | "ADD_QUEST" | "DELETE_QUEST" (only for QUEST_MUTATION),
     "quest_title": "exact or partial quest title",
     "new_target": 50,
     "time_budget_minutes": 90,
     "query": "search query for web or youtube",
     "city": "city name for weather",
     "language": "python / typescript / cpp / etc.",
     "code": "code snippet if generating code",
     "explanation": "concise explanation",
     "complexity": "time/space complexity if code",
     "message": "reminder text",
     "time_text": "in 30 mins / 5pm"
  }
}

EXAMPLES:
1. User: "Search who discovered CRISPR."
   Response: {"reply": "Initiating search on CRISPR discovery...", "action": {"type": "WEB_SEARCH", "query": "who discovered CRISPR gene editing"}}

2. User: "What's the weather in Tokyo?"
   Response: {"reply": "Checking atmospheric conditions for Tokyo, Hunter.", "action": {"type": "WEATHER_REPORT", "city": "Tokyo"}}

3. User: "Play lofi study beats on youtube."
   Response: {"reply": "Retrieving study stream on YouTube, Hunter.", "action": {"type": "YOUTUBE_SEARCH", "query": "lofi hip hop study beats"}}

4. User: "Write a Python binary search function."
   Response: {"reply": "Here is an optimized binary search implementation in Python, Hunter.", "action": {"type": "CODE_ASSIST", "language": "python", "code": "def binary_search(arr: list[int], target: int) -> int:\n    low, high = 0, len(arr) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1", "explanation": "Searches sorted array with logarithmic time.", "complexity": "Time: O(log N) | Space: O(1)"}}

5. User: "Remind me in 30 minutes to review Physics."
   Response: {"reply": "Reminder initialized for 30 minutes: 'Review Physics', Hunter.", "action": {"type": "REMINDER", "message": "Review Physics", "time_text": "in 30 minutes"}}

6. User: "Add a new quest: Meditation for 20 minutes."
   Response: {"reply": "New custom quest 'Meditation' added to your board for today, Hunter. Target: 20 minutes.", "action": {"type": "QUEST_MUTATION", "action_name": "ADD_QUEST", "quest_title": "Meditation", "new_target": 20}}
"""


def get_hunter_title(level: int) -> str:
    if level < 10:
        return "Novice Hunter"
    if level < 20:
        return "Hunter"
    if level < 30:
        return "Elite Hunter"
    if level < 40:
        return "Advanced Hunter"
    if level < 50:
        return "Shadow Hunter"
    if level < 60:
        return "Shadow Knight"
    if level < 70:
        return "Shadow Commander"
    if level < 80:
        return "Monarch"
    if level < 90:
        return "Shadow Monarch"
    if level < 100:
        return "Sovereign"
    return "Transcendent"


def get_hunter_rank(level: int) -> str:
    if level < 10:
        return "E"
    if level < 20:
        return "D"
    if level < 30:
        return "C"
    if level < 40:
        return "B"
    if level < 50:
        return "A"
    return "S"


def parse_and_execute_jarvis_command(
    db: Session,
    user: User,
    command: str,
    context_history: Optional[List[Dict[str, str]]] = None,
) -> Dict[str, Any]:
    """Execute JARVIS command via real LLM API with dynamic tool execution and deterministic fallback."""
    cmd_lower = command.lower().strip()
    character = user.character
    today = date.today()

    # Retrieve live active daily quests from SQLite database
    instances = quest_service.get_or_create_daily_board(db, user, today)
    mandatory = [i for i in instances if i.quest_type == QuestType.MANDATORY]
    completed = [i for i in mandatory if i.is_completed]
    total_quests_count = len(mandatory)
    completed_count = len(completed)
    completion_percent = (
        round((completed_count / total_quests_count) * 100, 1) if total_quests_count else 0.0
    )

    # Build Live System Context (Grounding with real DB stats)
    live_quest_summary = "\n".join(
        f"• ID: {q.id} | Title: '{q.template.name}' | Category: {q.template.category} | Progress: {q.current_value}/{q.target_value} {q.template.unit} | XP Reward: {q.xp_reward} | Completed: {q.is_completed}"
        for q in mandatory
    )

    # --- Derived leveling values (computed fields, not DB columns) ---
    xp_to_next = xp_required_for_level(character.level)
    xp_pct = xp_progress_percent(character.current_xp, character.level)
    hunter_title = get_hunter_title(character.level)
    hunter_rank = get_hunter_rank(character.level)

    # --- Stats are flat columns on CharacterProfile, not a nested object ---
    str_val = character.strength
    agi_val = character.agility
    kno_val = character.knowledge

    live_context = f"""
[HUNTER LIVE SYSTEM DATA]
Name: {user.display_name}
Level: {character.level}
Rank: Rank {hunter_rank}
Title: {hunter_title}
Current XP: {character.current_xp} / {xp_to_next} ({xp_pct}%)
Streak: {character.current_streak_days} Days
Stats: Strength={str_val}, Agility={agi_val}, Knowledge={kno_val}
Burnout Risk Score: {character.burnout_risk_score:.2f}

[TODAY'S ACTIVE QUEST BOARD ({completed_count}/{total_quests_count} Completed - {completion_percent}%)]
{live_quest_summary if live_quest_summary else 'No active mandatory quests.'}
"""

    # Format Recent Conversational Memory
    history_str = ""
    if context_history:
        recent = context_history[-6:]
        history_str = "\n[CONVERSATIONAL RECENT HISTORY]\n" + "\n".join(
            f"{m.get('role', 'user').upper()}: {m.get('text', '')}" for m in recent
        )

    full_user_prompt = f"{live_context}\n{history_str}\n\nHUNTER COMMAND: \"{command}\""

    has_ai_key = (
        (bool(settings.OPENROUTER_API_KEY) and settings.OPENROUTER_API_KEY != "paste_your_real_openrouter_key_here")
        or (bool(settings.ANTHROPIC_API_KEY) and settings.ANTHROPIC_API_KEY != "paste_your_real_anthropic_key_here")
    )

    # Attempt 1: Call LLM API (OpenRouter / Anthropic)
    if has_ai_key:
        try:
            ai_response = _run_async(
                call_ai(
                    system_prompt=JARVIS_SYSTEM_PROMPT,
                    user_prompt=full_user_prompt,
                    max_tokens=800,
                    expect_json=True,
                )
            )

            if isinstance(ai_response, dict) and "reply" in ai_response:
                action = ai_response.get("action")
                reply = ai_response["reply"]

                # Process any returned backend tool action
                if action and isinstance(action, dict):
                    executed_action = _execute_tool_action(db, user, mandatory, action)
                    return {"reply": reply, "action": executed_action or action}

                return {"reply": reply, "action": action}

        except AIClientError as exc:
            logger.warning("LLM API call failed (%s), attempting deterministic fallback.", exc)
            fallback_res = _execute_deterministic_fallback(
                db, user, command, mandatory, completed_count, total_quests_count, completion_percent, context_history
            )
            # If deterministic handler matched a real action or query (not the generic fallback explanation)
            if fallback_res.get("action", {}).get("type") != "GENERAL_CHAT":
                return fallback_res
            return {
                "reply": f"⚠️ **JARVIS Notice**: AI credits required for external model (`{settings.AI_MODEL}`).\n\n*Free alternatives*:\n• Set `AI_MODEL=meta-llama/llama-3.3-70b-instruct:free` or `google/gemini-2.0-flash-exp:free` in your backend environment.\n• Or purchase $5 credits at [openrouter.ai/settings/credits](https://openrouter.ai/settings/credits).\n\n*System controls (quests, stats, level)* are still fully operational!",
                "action": {"type": "AI_UNAVAILABLE", "error": str(exc)},
            }

    # Attempt 2: Fallback to Deterministic Parser for quest mutations & queries
    return _execute_deterministic_fallback(
        db, user, command, mandatory, completed_count, total_quests_count, completion_percent, context_history
    )


def _execute_tool_action(
    db: Session,
    user: User,
    mandatory: List[QuestInstance],
    action: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Executes backend tool actions requested by LLM on database and external integrations."""
    action_type = action.get("type")
    action_name = action.get("action_name")

    if action_type == "QUEST_MUTATION" or action_name in ("UPDATE_TARGET", "OPTIMIZE_WORKLOAD", "ADD_QUEST"):
        if action_name == "UPDATE_TARGET":
            quest_title = action.get("quest_title", "").lower()
            new_target = action.get("new_target")

            if new_target is not None and quest_title:
                norm_query = re.sub(r"[^a-z0-9]", "", quest_title)
                for q in mandatory:
                    norm_q = re.sub(r"[^a-z0-9]", "", q.template.name.lower())
                    if (norm_query and (norm_query in norm_q or norm_q in norm_query)) or quest_title in q.template.name.lower():
                        old_target = q.target_value
                        q.target_value = int(new_target)
                        q.xp_reward = quest_service.recompute_xp_for_target(q.template, q.target_value)
                        if q.current_value >= int(new_target):
                            q.is_completed = True
                        db.commit()
                        db.refresh(q)
                        return {
                            "type": "QUEST_MUTATION",
                            "action_name": "UPDATE_TARGET",
                            "quest_id": str(q.id),
                            "quest_title": q.template.name,
                            "old_target": old_target,
                            "new_target": int(new_target),
                        }

        elif action_name == "OPTIMIZE_WORKLOAD":
            minutes = action.get("time_budget_minutes", 90)
            scale_factor = 0.5 if minutes <= 60 else 0.7 if minutes <= 90 else 0.85
            updated_items = []
            for q in mandatory:
                if not q.is_completed and q.target_value > 1:
                    old_val = q.target_value
                    new_val = max(1, int(old_val * scale_factor))
                    q.target_value = new_val
                    q.xp_reward = quest_service.recompute_xp_for_target(q.template, new_val)
                    updated_items.append(f"• {q.template.name}: {old_val} ➔ {new_val}")
            db.commit()
            return {
                "type": "QUEST_MUTATION",
                "action_name": "OPTIMIZE_WORKLOAD",
                "time_budget_minutes": minutes,
                "summary": "\n".join(updated_items),
            }

        elif action_name == "ADD_QUEST":
            quest_title = action.get("quest_title", "Custom Quest")
            new_target = int(action.get("new_target", 10))
            result = _create_custom_quest(db, user, quest_title, new_target)
            return result

    elif action_type == "WEB_SEARCH":
        q = action.get("query", "")
        if q:
            search_res = _run_async(search_web(q))
            return {
                "type": "WEB_SEARCH",
                "query": q,
                "results": search_res.get("results", []),
                "summary": search_res.get("summary", ""),
            }

    elif action_type == "WEATHER_REPORT":
        city = action.get("city", "Delhi")
        weather_res = _run_async(get_weather(city))
        return {
            "type": "WEATHER_REPORT",
            "city": weather_res.get("city", city),
            "data": weather_res,
        }

    elif action_type == "YOUTUBE_SEARCH":
        query = action.get("query", "lofi study beats")
        yt_res = _run_async(search_youtube(query))
        return {
            "type": "YOUTUBE_SEARCH",
            "query": query,
            "results": yt_res.get("results", []),
            "summary": yt_res.get("summary", ""),
        }

    elif action_type == "CODE_ASSIST":
        return format_code_response(
            language=action.get("language", "python"),
            code=action.get("code", "# No code generated"),
            explanation=action.get("explanation", ""),
            complexity=action.get("complexity", ""),
        )

    elif action_type == "REMINDER":
        from app.models.story import Notification, NotificationType
        msg = action.get("message", "Task Reminder")
        time_text = action.get("time_text", "soon")
        notif = Notification(
            user_id=user.id,
            type=NotificationType.SYSTEM_BROADCAST,
            title="JARVIS Reminder",
            body=f"{msg} ({time_text})",
        )
        db.add(notif)
        db.commit()
        return {
            "type": "REMINDER",
            "message": msg,
            "time_text": time_text,
        }

    return action


def _infer_quest_meta(name: str, target: int) -> Dict[str, Any]:
    """
    Autonomously infers category, unit, XP, primary_stat and icon from
    a free-form quest name + numeric target. The hunter never needs to
    specify these — JARVIS works them out from keywords.
    """
    n = name.lower()

    # --- Category + unit + stat inference ---
    if any(k in n for k in ("run", "jog", "sprint", "km", "mile")):
        category, unit, stat = QuestCategory.CARDIO, QuestUnit.KM, "stamina"
    elif any(k in n for k in ("walk", "step", "footstep")):
        category, unit, stat = QuestCategory.CARDIO, QuestUnit.STEPS, "stamina"
    elif any(k in n for k in ("push", "pullup", "pull-up", "squat", "lunge", "dip", "curl", "deadlift", "lift", "bench")):
        category, unit, stat = QuestCategory.STRENGTH, QuestUnit.REPS, "strength"
    elif any(k in n for k in ("sit-up", "situp", "crunch", "plank", "mountain climber", "core", "ab ")):
        category, unit, stat = QuestCategory.CORE, QuestUnit.REPS, "strength"
    elif any(k in n for k in ("stretch", "yoga", "mobility", "flexibility", "cobra", "hang")):
        category, unit, stat = QuestCategory.MOBILITY, QuestUnit.SETS, "agility"
    elif any(k in n for k in ("sleep", "rest", "nap")):
        category, unit, stat = QuestCategory.RECOVERY, QuestUnit.HOURS, "recovery"
    elif any(k in n for k in ("study", "read", "book", "chapter", "revision", "homework", "notes", "physics", "chem", "math", "question", "solve")):
        category, unit, stat = QuestCategory.STUDY, QuestUnit.MINUTES, "knowledge"
    elif any(k in n for k in ("meditat", "breathe", "breathing", "mindful", "calm")):
        category, unit, stat = QuestCategory.RECOVERY, QuestUnit.MINUTES, "mental_fortitude"
    elif any(k in n for k in ("swim", "cycle", "bike", "row", "sport", "basketball", "badminton", "football", "cricket")):
        category, unit, stat = QuestCategory.SPORT, QuestUnit.MINUTES, "stamina"
    else:
        # Generic fallback
        category, unit, stat = QuestCategory.STRENGTH, QuestUnit.REPS, "discipline"

    # --- Auto XP: proportional to target, bounded to reasonable ranges ---
    # Rough XP bands: reps(1–150) → 30–200 XP, minutes(5–120) → 25–300 XP, etc.
    BASE_RATES = {
        QuestUnit.REPS: 1.2,
        QuestUnit.MINUTES: 2.0,
        QuestUnit.HOURS: 50.0,
        QuestUnit.KM: 60.0,
        QuestUnit.STEPS: 0.004,
        QuestUnit.SETS: 20.0,
        QuestUnit.SECONDS: 0.3,
        QuestUnit.QUESTIONS: 2.0,
        QuestUnit.ROUNDS: 5.0,
    }
    rate = BASE_RATES.get(unit, 1.5)
    xp = max(25, min(500, round(target * rate)))

    # --- Icon key (reuses existing icon keys from the app) ---
    if "run" in n or "jog" in n:
        icon = "running"
    elif "push" in n:
        icon = "pushups"
    elif "squat" in n:
        icon = "squats"
    elif "sleep" in n:
        icon = "sleep"
    elif "walk" in n or "step" in n:
        icon = "walking"
    elif "plank" in n or "core" in n or "crunch" in n or "sit" in n:
        icon = "core"
    elif "stretch" in n or "mobility" in n or "yoga" in n:
        icon = "mobility"
    elif "study" in n or "read" in n:
        icon = "study_time"
    elif "meditat" in n:
        icon = "recovery_token"
    else:
        icon = "default"

    return {
        "category": category,
        "unit": unit,
        "primary_stat": stat,
        "xp": xp,
        "icon": icon,
    }


def _create_custom_quest(
    db: Session,
    user: User,
    name: str,
    target: int,
) -> Dict[str, Any]:
    """
    Creates a brand-new QuestTemplate (if one doesn't exist) and
    a QuestInstance for today — all from just a name + target number.
    XP, category, unit, and stat are inferred autonomously.
    """
    from datetime import date as _date

    meta = _infer_quest_meta(name, target)
    today = _date.today()

    # Sanitize key: lowercase, replace spaces with underscores, strip special chars
    import re as _re
    safe_key = "custom_" + _re.sub(r"[^a-z0-9_]", "", name.lower().replace(" ", "_"))[:40]
    # Make key user-specific so two users can have their own custom quests
    unique_key = f"{safe_key}_{str(user.id)[:8]}"

    # Upsert template (idempotent: if user re-adds same quest, reuse template)
    template = db.query(QuestTemplate).filter(QuestTemplate.key == unique_key).first()
    if not template:
        template = QuestTemplate(
            key=unique_key,
            name=name,
            description=f"Custom quest created by {user.display_name} via JARVIS.",
            category=meta["category"],
            quest_type=QuestType.OPTIONAL,
            unit=meta["unit"],
            sort_order=99,
            base_target=float(target),
            min_target=float(max(1, target // 2)),
            max_target=float(target * 2),
            base_xp_reward=meta["xp"],
            primary_stat=meta["primary_stat"],
            secondary_stat=None,
            icon_key=meta["icon"],
            is_active=True,
        )
        db.add(template)
        db.flush()

    # Check if an instance already exists for today
    existing_instance = (
        db.query(QuestInstance)
        .filter(
            QuestInstance.user_id == user.id,
            QuestInstance.template_id == template.id,
            QuestInstance.assigned_date == today,
        )
        .first()
    )

    if existing_instance:
        # Quest already on board — just update target
        existing_instance.target_value = float(target)
        existing_instance.xp_reward = meta["xp"]
        db.commit()
        db.refresh(existing_instance)
        return {
            "type": "QUEST_MUTATION",
            "action_name": "ADD_QUEST",
            "quest_id": str(existing_instance.id),
            "quest_title": name,
            "new_target": target,
            "xp_reward": meta["xp"],
            "category": meta["category"].value,
            "unit": meta["unit"].value,
            "board_refresh": True,
        }

    # Create fresh instance for today
    instance = QuestInstance(
        user_id=user.id,
        template_id=template.id,
        assigned_date=today,
        quest_type=QuestType.OPTIONAL,
        target_value=float(target),
        xp_reward=meta["xp"],
        difficulty_snapshot=user.character.difficulty_multiplier,
        current_value=0.0,
        is_completed=False,
    )
    db.add(instance)
    db.commit()
    db.refresh(instance)

    return {
        "type": "QUEST_MUTATION",
        "action_name": "ADD_QUEST",
        "quest_id": str(instance.id),
        "quest_title": name,
        "new_target": target,
        "xp_reward": meta["xp"],
        "category": meta["category"].value,
        "unit": meta["unit"].value,
        "board_refresh": True,
    }




def _execute_deterministic_fallback(
    db: Session,
    user: User,
    command: str,
    mandatory: List[QuestInstance],
    completed_count: int,
    total_quests_count: int,
    completion_percent: float,
    context_history: Optional[List[Dict[str, str]]],
) -> Dict[str, Any]:
    """Deterministic fallback handler used when LLM API key is unconfigured or offline."""
    cmd_lower = command.lower().strip()
    character = user.character

    # 1. Target Quantity Change
    # Match patterns like:
    # "change situps 100", "change situps to 100", "set pushups 50", "update study 120", "make squats 30"
    target_match = re.search(
        r"(?:change|set|reduce|increase|update|make|modify|adjust)\s+(?:today's\s+)?(.+?)\s+(?:quest\s+)?(?:from\s+\d+\s+)?(?:to\s+|as\s+|\:\s*|\=\s*)?(\d+)\s*(?:reps?|minutes?|mins?|hours?|hrs?|km|steps?|sets?|questions?|rounds?)?$",
        cmd_lower,
    ) or re.search(
        r"(?:change|set|reduce|increase|update|make|modify|adjust)\s+(?:the\s+)?(first|second|third|fourth|fifth|1st|2nd|3rd|4th|5th)\s+(?:quest\s+)?(?:to\s+|as\s+|\:\s*|\=\s*)?(\d+)",
        cmd_lower,
    )

    if not target_match and not ("add" in cmd_lower or "create" in cmd_lower or "new" in cmd_lower):
        # Match short direct commands like "situps 100" or "sit-ups 100"
        short_match = re.search(r"^([a-z\s\-]+?)\s+(\d+)\s*$", cmd_lower)
        if short_match:
            cand_name = short_match.group(1).strip()
            cand_norm = re.sub(r"[^a-z0-9]", "", cand_name)
            if any(cand_norm and (cand_norm in re.sub(r"[^a-z0-9]", "", q.template.name.lower()) or re.sub(r"[^a-z0-9]", "", q.template.name.lower()) in cand_norm) for q in mandatory):
                target_match = short_match

    if target_match and not ("add" in cmd_lower or "create" in cmd_lower or "new quest" in cmd_lower):
        quest_identifier = target_match.group(1).strip()
        new_target = int(target_match.group(2))
        target_quest: Optional[QuestInstance] = None

        ordinal_map = {"first": 0, "1st": 0, "second": 1, "2nd": 1, "third": 2, "3rd": 2, "fourth": 3, "4th": 3}
        if quest_identifier in ordinal_map:
            idx = ordinal_map[quest_identifier]
            subject_filter = None
            if context_history:
                for msg in reversed(context_history):
                    txt = msg.get("text", "").lower()
                    if "physics" in txt:
                        subject_filter = "physics"
                        break
                    elif "math" in txt:
                        subject_filter = "math"
                        break

            if subject_filter:
                matches = [q for q in mandatory if subject_filter in q.template.name.lower()]
                if idx < len(matches):
                    target_quest = matches[idx]
            if not target_quest and idx < len(mandatory):
                target_quest = mandatory[idx]
        else:
            norm_identifier = re.sub(r"[^a-z0-9]", "", quest_identifier)
            for q in mandatory:
                norm_name = re.sub(r"[^a-z0-9]", "", q.template.name.lower())
                if norm_identifier and (norm_identifier in norm_name or norm_name in norm_identifier or quest_identifier in q.template.name.lower()):
                    target_quest = q
                    break

        if target_quest:
            old_target = target_quest.target_value
            target_quest.target_value = new_target
            target_quest.xp_reward = quest_service.recompute_xp_for_target(target_quest.template, new_target)
            if target_quest.current_value >= new_target:
                target_quest.is_completed = True
            db.commit()
            db.refresh(target_quest)

            return {
                "reply": f"Understood, Hunter **{user.display_name}**. I have updated your **{target_quest.template.name}** quest target to **{new_target}** (now worth **{target_quest.xp_reward} XP**).",
                "action": {
                    "type": "QUEST_MUTATION",
                    "action_name": "UPDATE_TARGET",
                    "quest_id": str(target_quest.id),
                    "quest_title": target_quest.template.name,
                    "old_target": old_target,
                    "new_target": new_target,
                },
            }

    # 2. Create Custom Quest — fires on "add quest", "create quest", "new quest", "add X for N"
    create_match = (
        re.search(
            r"(?:add|create|new|make)\s+(?:a\s+)?(?:quest\s+(?:called|named|for)?\s*)?['\"]?([a-z][a-z\s\-]+?)['\"]?\s+(?:for\s+|to\s+|:\s*|\=\s*)?(\d+)\s*(?:reps?|minutes?|mins?|hours?|hrs?|km|steps?|sets?|questions?|rounds?)?$",
            cmd_lower,
        )
        or re.search(
            r"(?:add|create|new|make)\s+(?:a\s+)?(?:quest\s+(?:called|named|for)?\s*)?(\d+)\s*(?:reps?|minutes?|mins?|hours?|hrs?|km|steps?|sets?|questions?|rounds?)?\s+(?:of\s+)?['\"]?([a-z][a-z\s\-]+?)['\"]?$",
            cmd_lower,
        )
    )
    if create_match or ("add" in cmd_lower and "quest" in cmd_lower) or ("create" in cmd_lower and "quest" in cmd_lower) or ("new quest" in cmd_lower):
        if create_match:
            g1, g2 = create_match.group(1), create_match.group(2)
            if str(g1).isdigit():
                new_target = int(g1)
                quest_name_raw = str(g2).strip().title()
            else:
                quest_name_raw = str(g1).strip().title()
                new_target = int(g2)
        else:
            # Try to extract number if pattern didn't match cleanly
            num_match = re.search(r"(\d+)", cmd_lower)
            new_target = int(num_match.group(1)) if num_match else 10
            # Grab quest name from command
            quest_name_raw = re.sub(
                r"\b(add|create|new|make|a|quest|for|called|named|reps?|minutes?|mins?|hours?|km|steps?|sets?|today|me|my|to|of)\b",
                "",
                cmd_lower,
            ).strip().title() or "Custom Quest"
            quest_name_raw = re.sub(r"\s+", " ", quest_name_raw).strip()
            if not quest_name_raw:
                quest_name_raw = "Custom Quest"

        result = _create_custom_quest(db, user, quest_name_raw, new_target)
        meta = _infer_quest_meta(quest_name_raw, new_target)
        return {
            "reply": (
                f"**New Quest Added ✅**\n\n"
                f"Quest: **{quest_name_raw}**\n"
                f"Target: **{new_target} {meta['unit'].value}**\n"
                f"Category: **{meta['category'].value.title()}**\n"
                f"XP Reward: **{meta['xp']} XP**\n\n"
                f"Head to your Quest Board to track and complete it, Hunter **{user.display_name}**!"
            ),
            "action": result,
        }

    # 3. Time-Based Workload Optimization
    time_match = re.search(r"(\d+)\s*(?:minutes|mins|hours|hrs|hr)", cmd_lower)
    if "optimize" in cmd_lower or "lighter" in cmd_lower or "workload" in cmd_lower or time_match:
        minutes = 90
        if time_match:
            val = int(time_match.group(1))
            minutes = val * 60 if ("hour" in cmd_lower or "hr" in cmd_lower) else val

        updated_summary = []
        for q in mandatory:
            if not q.is_completed and q.target_value > 1:
                old_val = q.target_value
                new_val = max(1, int(old_val * 0.6))
                q.target_value = new_val
                q.xp_reward = quest_service.recompute_xp_for_target(q.template, new_val)
                updated_summary.append(f"• {q.template.name}: {old_val} ➔ {new_val}")
        db.commit()

        return {
            "reply": f"Optimization matrix applied for a **{minutes}-minute** timeframe, Hunter {user.display_name}.\n\n"
                     + ("\n".join(updated_summary) if updated_summary else "Quests adjusted for optimal efficiency."),
            "action": {
                "type": "QUEST_MUTATION",
                "action_name": "OPTIMIZE_WORKLOAD",
                "time_budget_minutes": minutes,
            },
        }


    # 3. ASCEND Status & Level Queries (Grounded in Live DB values)
    # Use word-boundary checks to avoid matching 'explain' as 'xp', etc.
    is_level_query = bool(re.search(r'\blevel\b|\brank\b|\btitle\b', cmd_lower))
    is_xp_query = bool(re.search(r'\bxp\b', cmd_lower))
    if is_level_query or is_xp_query:
        xp_to_next = xp_required_for_level(character.level)
        xp_pct = xp_progress_percent(character.current_xp, character.level)
        hunter_title = get_hunter_title(character.level)
        hunter_rank = get_hunter_rank(character.level)
        return {
            "reply": f"System Status — Hunter **{user.display_name}**\nLevel: **Level {character.level}**\nRank: **Rank {hunter_rank}**\nTitle: **{hunter_title}**\nXP: **{character.current_xp:,} / {xp_to_next:,} XP** ({xp_pct}%).",
            "action": {"type": "QUERY_RESULT", "target": "LEVEL_INFO"},
        }

    if "quest" in cmd_lower and ("what" in cmd_lower or "show" in cmd_lower or "list" in cmd_lower or "my" in cmd_lower):
        q_list = "\n".join(
            f"• {q.template.name} ({q.current_value}/{q.target_value}) - {q.xp_reward} XP - {'[COMPLETED]' if q.is_completed else 'Active'}"
            for q in mandatory
        )
        return {
            "reply": f"Here is your daily quest board status ({completed_count}/{total_quests_count} completed):\n\n{q_list}",
            "action": {"type": "QUERY_RESULT", "target": "DAILY_QUESTS"},
        }

    if "friend" in cmd_lower or "social" in cmd_lower or "hunter network" in cmd_lower:
        from app.models.social import HunterFriend
        from sqlalchemy import or_
        friendships = (
            db.query(HunterFriend)
            .filter(
                or_(HunterFriend.user_id == user.id, HunterFriend.friend_id == user.id),
                HunterFriend.status == "accepted",
            )
            .all()
        )
        if not friendships:
            return {
                "reply": f"Hunter **{user.display_name}**, your Hunter Network has no active connections yet. Use the Social portal (`/social`) to connect with fellow Hunters.",
                "action": {"type": "QUERY_RESULT", "target": "FRIEND_INFO"},
            }
        friend_names = []
        for f in friendships:
            other_id = f.friend_id if f.user_id == user.id else f.user_id
            other = db.query(User).filter(User.id == other_id).first()
            if other:
                t = get_hunter_title(other.character.level)
                r = get_hunter_rank(other.character.level)
                friend_names.append(f"• **{other.display_name}** — Level {other.character.level} ({r}-Rank {t})")

        return {
            "reply": f"Hunter Network Connections for **{user.display_name}** ({len(friend_names)} connected):\n\n" + "\n".join(friend_names),
            "action": {"type": "QUERY_RESULT", "target": "FRIEND_INFO"},
        }

    if "weakest stat" in cmd_lower or "weakest" in cmd_lower:
        # Stats are flat columns on CharacterProfile
        stat_map = {
            "Strength": character.strength,
            "Agility": character.agility,
            "Knowledge": character.knowledge,
            "Stamina": character.stamina,
            "Focus": character.focus,
            "Discipline": character.discipline,
        }
        weakest = min(stat_map, key=stat_map.get)
        return {
            "reply": f"Analysis complete, Hunter {user.display_name}. Your weakest stat is **{weakest}** ({stat_map[weakest]} points).",
            "action": {"type": "QUERY_RESULT", "target": "WEAKEST_STAT"},
        }

    if "achievement" in cmd_lower:
        from app.models.achievement import UserAchievement
        unlocked_achievements = db.query(UserAchievement).filter(UserAchievement.user_id == user.id).all()
        if unlocked_achievements:
            ach_list = "\n".join(f"• **{ua.achievement.name}**: {ua.achievement.description}" for ua in unlocked_achievements)
            reply_text = f"Hunter **{user.display_name}**, you have unlocked the following achievements:\n\n{ach_list}"
        else:
            reply_text = f"Hunter **{user.display_name}**, you have not unlocked any achievements yet. Keep completing quests to unlock milestones!"
        return {
            "reply": reply_text,
            "action": {"type": "QUERY_RESULT", "target": "ACHIEVEMENTS"},
        }

    # --- External Tool Actions (Deterministic Fallbacks) ---

    # Weather lookup
    weather_match = re.search(r"weather(?:\s+in|\s+for|\s+at)?\s+([a-zA-Z\s]+)", cmd_lower)
    if weather_match or "weather" in cmd_lower or "forecast" in cmd_lower or "temperature" in cmd_lower:
        city = weather_match.group(1).strip().title() if weather_match else "Delhi"
        weather_res = _run_async(get_weather(city))
        return {
            "reply": weather_res.get("summary", f"Retrieved atmospheric conditions for {city}."),
            "action": {
                "type": "WEATHER_REPORT",
                "city": weather_res.get("city", city),
                "data": weather_res,
            },
        }

    # YouTube / Music lookup
    yt_match = re.search(r"(?:youtube|play|song|music|video|listen\s+to)\s+(.+)", cmd_lower)
    if yt_match or "youtube" in cmd_lower or "lofi" in cmd_lower or "study music" in cmd_lower:
        yt_query = yt_match.group(1).strip() if yt_match else "lofi study beats"
        yt_res = _run_async(search_youtube(yt_query))
        return {
            "reply": yt_res.get("summary", f"Found YouTube stream for {yt_query}."),
            "action": {
                "type": "YOUTUBE_SEARCH",
                "query": yt_query,
                "results": yt_res.get("results", []),
                "summary": yt_res.get("summary", ""),
            },
        }

    # Web Search lookup
    search_match = re.search(r"(?:search|lookup|find|google|ddg)\s+(?:for\s+|online\s+)?(.+)", cmd_lower)
    if search_match or cmd_lower.startswith("search ") or cmd_lower.startswith("who is ") or cmd_lower.startswith("what is "):
        s_query = search_match.group(1).strip() if search_match else command
        search_res = _run_async(search_web(s_query))
        return {
            "reply": search_res.get("summary", f"Web search results for: {s_query}"),
            "action": {
                "type": "WEB_SEARCH",
                "query": s_query,
                "results": search_res.get("results", []),
                "summary": search_res.get("summary", ""),
            },
        }

    # Code generation & Algorithms
    code_match = re.search(r"(?:write|create|generate|implement|code)\s+(?:a\s+)?(python|javascript|typescript|cpp|java|rust|sql|html)?\s*(?:code|script|function|algorithm)?\s*(?:for|to)?\s*(.+)", cmd_lower)
    if code_match or "binary search" in cmd_lower or "quicksort" in cmd_lower or "algorithm" in cmd_lower or "function" in cmd_lower:
        lang = code_match.group(1).lower() if code_match and code_match.group(1) else "python"
        task = code_match.group(2).strip() if code_match and code_match.group(2) else command
        
        # Standard templates for common algorithm queries
        if "binary search" in cmd_lower:
            code_sample = (
                "def binary_search(arr: list[int], target: int) -> int:\n"
                "    low, high = 0, len(arr) - 1\n"
                "    while low <= high:\n"
                "        mid = (low + high) // 2\n"
                "        if arr[mid] == target:\n"
                "            return mid\n"
                "        elif arr[mid] < target:\n"
                "            low = mid + 1\n"
                "        else:\n"
                "            high = mid - 1\n"
                "    return -1"
            )
            complexity = "Time: O(log N) | Space: O(1)"
            expl = "Iterative binary search on a sorted list."
        elif "quicksort" in cmd_lower:
            code_sample = (
                "def quicksort(arr: list[int]) -> list[int]:\n"
                "    if len(arr) <= 1:\n"
                "        return arr\n"
                "    pivot = arr[len(arr) // 2]\n"
                "    left = [x for x in arr if x < pivot]\n"
                "    middle = [x for x in arr if x == pivot]\n"
                "    right = [x for x in arr if x > pivot]\n"
                "    return quicksort(left) + middle + quicksort(right)"
            )
            complexity = "Average Time: O(N log N) | Space: O(N)"
            expl = "Divide-and-conquer quicksort with middle pivot."
        else:
            code_sample = f"# {task.title()}\ndef solve():\n    # Optimal implementation\n    pass\n\nif __name__ == '__main__':\n    solve()"
            complexity = "Time: O(N) | Space: O(1)"
            expl = f"Implementation template for {task}."

        code_action = format_code_response(
            language=lang,
            code=code_sample,
            explanation=expl,
            complexity=complexity,
        )
        return {
            "reply": f"Here is the requested **{lang.title()}** solution, Hunter **{user.display_name}**:\n\n{expl}",
            "action": code_action,
        }

    # Reminder
    remind_match = re.search(r"remind\s+(?:me\s+)?(?:in\s+)?(\d+\s*(?:minutes|mins|hours|hrs))?\s*(?:to\s+)?(.+)", cmd_lower)
    if remind_match or "remind" in cmd_lower or "alarm" in cmd_lower or "timer" in cmd_lower:
        time_spec = remind_match.group(1) if remind_match and remind_match.group(1) else "in 30 minutes"
        task_msg = remind_match.group(2).strip().title() if remind_match and remind_match.group(2) else "Task Reminder"
        
        from app.models.story import Notification, NotificationType
        notif = Notification(
            user_id=user.id,
            type=NotificationType.SYSTEM_BROADCAST,
            title="JARVIS Reminder",
            body=f"{task_msg} ({time_spec})",
        )
        db.add(notif)
        db.commit()
        return {
            "reply": f"**Reminder Set ⏰**\n\nTask: **{task_msg}**\nTiming: **{time_spec}**\n\nI will ping your neural interface when the timer expires, Hunter {user.display_name}!",
            "action": {
                "type": "REMINDER",
                "message": task_msg,
                "time_text": time_spec,
            },
        }

    # 4. Natural Companion Greetings & Conversational Handling
    greetings = {"hi", "hello", "hey", "yo", "sup", "good morning", "good evening", "good afternoon", "jarvis", "greetings"}
    if cmd_lower in greetings or any(cmd_lower.startswith(g + " ") for g in greetings):
        hunter_title = get_hunter_title(character.level)
        return {
            "reply": f"Greetings, Hunter **{user.display_name}**! JARVIS online and monitoring your vitals. You are currently **Level {character.level} ({hunter_title})** with a **{character.current_streak_days}-day streak**. How can I assist your ascent today?",
            "action": {"type": "GENERAL_CHAT"},
        }

    if any(phrase in cmd_lower for phrase in ["how are you", "who are you", "what are you", "status report", "system status"]):
        return {
            "reply": f"All sub-systems operational, Hunter **{user.display_name}**. Neural matrix synchronized at 100%. Daily quest board tracking {completed_count}/{total_quests_count} ({completion_percent}%) completed.",
            "action": {"type": "GENERAL_CHAT"},
        }

    if any(phrase in cmd_lower for phrase in ["motivate", "quote", "inspire", "push me"]):
        quotes = [
            "\"The boss doesn't care how you feel this morning. Neither should you.\"",
            "\"Discipline stat doesn't rise from good days — it rises from the days you almost skipped.\"",
            "\"Small targets, hit consistently, outscale big targets hit rarely.\"",
            "\"Every rep, every study hour, every quest logged is another point in your stat sheet. Execute.\"",
        ]
        import random
        selected_quote = random.choice(quotes)
        return {
            "reply": f"{selected_quote}\n\n— *JARVIS System Directive*",
            "action": {"type": "GENERAL_CHAT"},
        }

    if any(phrase in cmd_lower for phrase in ["help", "commands", "what can you do"]):
        return {
            "reply": (
                f"**JARVIS System Capabilities:**\n\n"
                f"• **Quest Target Modification**: *\"Change today's Study quest to 5 hours\"*\n"
                f"• **Add Custom Quests**: *\"Add quest Meditation for 20 minutes\"*\n"
                f"• **Optimize Workload**: *\"Optimize my workload to 60 minutes\"*\n"
                f"• **Stats & Level Inquiries**: *\"What is my level?\"*, *\"Show my quests\"*, *\"What is my weakest stat?\"*\n"
                f"• **Network & Threats**: *\"Show my friends\"*, *\"Active bosses\"*, *\"My achievements\"*"
            ),
            "action": {"type": "GENERAL_CHAT"},
        }

    # Friendly conversational fallback
    return {
        "reply": f"Command received, Hunter **{user.display_name}**. I'm actively tracking your progression. You can adjust quest targets, add new quests, optimize your workload, or check stats anytime.",
        "action": {"type": "GENERAL_CHAT"},
    }


def _run_async(coro):
    import asyncio
    try:
        return asyncio.run(coro)
    except RuntimeError:
        loop = asyncio.new_event_loop()
        try:
            return loop.run_until_complete(coro)
        finally:
            loop.close()
