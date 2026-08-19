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
from app.models.quest import QuestInstance, QuestType
from app.models.user import User
from app.services import quest_service
from app.services.leveling import xp_required_for_level, xp_progress_percent

logger = logging.getLogger("ascend.jarvis")

JARVIS_SYSTEM_PROMPT = """You are JARVIS, an intelligent, high-precision AI system companion built into ASCEND — a Solo Leveling-inspired personal progression system.

Your identity:
- You speak with crisp, intelligent, supportive system companion tone ("Hunter [Name]").
- You have full awareness of the Hunter's real live character status and active daily quests.
- You can answer general knowledge questions dynamically across science, mathematics, programming, productivity, physics, quantum mechanics, and general explanations.
- You can execute control actions on the Hunter's ASCEND system (modifying quest targets, optimizing workload for time budgets, adding new quests).

AVAILABLE SYSTEM ACTIONS:
When the user requests a quest change, optimization, or status query, include an `action` object in your JSON response.

Your response MUST be a valid JSON object matching this schema:
{
  "reply": "Your natural language response to the Hunter",
  "action": null OR {
     "type": "QUEST_MUTATION" | "QUERY_RESULT" | "GENERAL_KNOWLEDGE",
     "action_name": "UPDATE_TARGET" | "OPTIMIZE_WORKLOAD" | "ADD_QUEST" | "DELETE_QUEST",
     "quest_title": "exact or partial quest title",
     "new_target": 50,
     "time_budget_minutes": 90,
     "summary": "description of change"
  }
}

EXAMPLES:
1. User: "Explain photovoltaic cells."
   Response: {"reply": "Photovoltaic (PV) cells convert solar energy directly into electrical energy through the photovoltaic effect. When photons hit a semiconductor material (like silicon), they knock electrons free, creating an electric current across p-n junctions...", "action": {"type": "GENERAL_KNOWLEDGE"}}

2. User: "Change today's Physics quest to 50 questions."
   Response: {"reply": "Understood, Hunter. I have updated your Physics Chapter Revision quest target to 50 questions.", "action": {"type": "QUEST_MUTATION", "action_name": "UPDATE_TARGET", "quest_title": "Physics", "new_target": 50}}

3. User: "I only have 90 minutes today. Optimize my workload."
   Response: {"reply": "Optimization matrix applied for a 90-minute timeframe, Hunter. Daily workloads scaled down for maximum efficiency.", "action": {"type": "QUEST_MUTATION", "action_name": "OPTIMIZE_WORKLOAD", "time_budget_minutes": 90}}

4. User: "Add a new quest: Meditation for 20 minutes."
   Response: {"reply": "New custom quest 'Meditation' added to your board for today, Hunter. Target: 20 minutes.", "action": {"type": "QUEST_MUTATION", "action_name": "ADD_QUEST", "quest_title": "Meditation", "new_target": 20}}

IMPORTANT — When the user says things like:
- "add a quest", "create a quest", "new quest", "I want to do X", "add X for N reps/minutes/km"
Always use action_name: "ADD_QUEST" with quest_title = the name and new_target = the number.
YOU decide the XP reward automatically based on difficulty. NEVER ask the user for XP.
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

    # Attempt 1: Call LLM API (Anthropic / Gemini)
    if settings.ANTHROPIC_API_KEY and settings.ANTHROPIC_API_KEY != "paste_your_real_anthropic_key_here":
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
            logger.error("LLM API call failed: %s", exc)
            return {
                "reply": f"⚠️ **JARVIS AI Error** — The AI companion encountered an error calling the configured model ({settings.AI_MODEL}):\n\n{str(exc)}\n\nPlease check your configuration or API key in `backend/.env`.",
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
    """Executes backend tool actions requested by LLM on SQLite database."""
    action_name = action.get("action_name")

    if action_name == "UPDATE_TARGET":
        quest_title = action.get("quest_title", "").lower()
        new_target = action.get("new_target")

        if new_target is not None and quest_title:
            for q in mandatory:
                if quest_title in q.template.name.lower() or q.template.name.lower() in quest_title:
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
    target_match = re.search(
        r"(?:change|set|reduce|increase|update|make)\s+(?:today's\s+)?(.+?)\s+(?:quest\s+)?(?:from\s+\d+\s+)?to\s+(\d+)",
        cmd_lower,
    ) or re.search(
        r"(?:change|set|reduce|increase|update|make)\s+(?:the\s+)?(first|second|third|fourth|fifth|1st|2nd|3rd|4th|5th)\s+(?:quest\s+)?to\s+(\d+)",
        cmd_lower,
    )

    if target_match:
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
            for q in mandatory:
                if quest_identifier in q.template.name.lower():
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
                "reply": f"Understood, Hunter {user.display_name}. I have updated your **{target_quest.template.name}** quest target to **{new_target}** (now worth **{target_quest.xp_reward} XP**).",
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
    create_match = re.search(
        r"(?:add|create|new|make)\s+(?:a\s+)?(?:quest\s+(?:called|named|for)?\s*)?['\"]?([a-z][a-z\s\-]+?)['\"]?\s+(?:for\s+)?(\d+)\s*(?:reps?|minutes?|mins?|hours?|hrs?|km|steps?|sets?|questions?|rounds?)?",
        cmd_lower,
    )
    if create_match or ("add" in cmd_lower and "quest" in cmd_lower) or ("create" in cmd_lower and "quest" in cmd_lower) or ("new quest" in cmd_lower):
        if create_match:
            quest_name_raw = create_match.group(1).strip().title()
            new_target = int(create_match.group(2))
        else:
            # Try to extract number if pattern didn't match cleanly
            num_match = re.search(r"(\d+)", cmd_lower)
            new_target = int(num_match.group(1)) if num_match else 10
            # Grab quest name from command
            quest_name_raw = re.sub(
                r"\b(add|create|new|make|a|quest|for|called|named|reps?|minutes?|mins?|hours?|km|steps?|sets?|today|me|my)\b",
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
                f"Head to your Quest Board to track and complete it, Hunter {user.display_name}!"
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

    if "boss" in cmd_lower or "raid" in cmd_lower:
        from app.models.boss import Boss
        from datetime import date
        active_bosses = db.query(Boss).filter(Boss.cycle_end >= date.today(), Boss.is_defeated == False).all()
        if active_bosses:
            boss_list = "\n".join(
                f"• **{b.name}** ({b.cycle.value.upper()}) | HP: {b.current_hp:.0f}/{b.max_hp:.0f} ({b.current_hp/b.max_hp*100:.1f}%)"
                for b in active_bosses
            )
            reply_text = f"Hunter **{user.display_name}**, here are the active threat matrices (Bosses):\n\n{boss_list}"
        else:
            reply_text = f"No active boss threats detected for the current cycle, Hunter."
        return {
            "reply": reply_text,
            "action": {"type": "QUERY_RESULT", "target": "BOSSES"},
        }

    # Fallback explanation if no API key is set
    return {
        "reply": f"JARVIS System Notice: `ANTHROPIC_API_KEY` is not configured in `backend/.env`. Set your API key in `backend/.env` to unlock dynamic AI answers for questions like '{command}'. Quest control commands remain fully active.",
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
