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

    return action


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

    # 2. Time-Based Workload Optimization
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
