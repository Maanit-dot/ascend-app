"""
Daily quest generation.

Quest *targets* are computed deterministically via `difficulty_engine` (fast,
explainable, no API cost). The LLM is used only for the qualitative layer:
picking which optional/hidden quests to surface and writing short flavor
text / AI rationale, so the system degrades gracefully (falls back to
templated text) if the AI provider is unavailable.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass

from app.ai.client import AIClientError, call_ai
from app.ai.difficulty_engine import scale_target
from app.models.quest import QuestTemplate, QuestType

logger = logging.getLogger("ascend.ai.quests")

SYSTEM_PROMPT = """You are the AI Companion inside ASCEND, an original RPG productivity system.
You write short (1-2 sentence), punchy, encouraging quest rationale text for a user's daily
quest log. Tone: a disciplined mentor with a sci-fi-operating-system voice — never cheesy,
never anime-cliche, no references to any existing franchise. Return ONLY valid JSON matching
the requested schema, no prose, no markdown fences."""


@dataclass
class GeneratedQuest:
    template_key: str
    quest_type: QuestType
    target_value: float
    xp_reward: int
    ai_rationale: str


def build_quest_target(template: QuestTemplate, difficulty_multiplier: float) -> float:
    return scale_target(
        base_target=template.base_target,
        min_target=template.min_target,
        max_target=template.max_target,
        multiplier=difficulty_multiplier,
    )


def compute_xp_reward(template: QuestTemplate, target_value: float) -> int:
    """XP scales sub-linearly with target size so harder quests pay more but not proportionally more."""
    scale_factor = (target_value / template.base_target) ** 0.6 if template.base_target else 1.0
    return max(10, round(template.base_xp_reward * scale_factor))


async def generate_rationale_batch(
    quest_summaries: list[dict], user_display_name: str, difficulty_multiplier: float
) -> dict[str, str]:
    """
    Asks the AI for one rationale line per quest. Falls back to a templated
    rationale for any quest the AI call fails to cover.
    """
    fallback = {
        q["template_key"]: _fallback_rationale(q, difficulty_multiplier) for q in quest_summaries
    }

    user_prompt = (
        f"User: {user_display_name}. Current difficulty multiplier: {difficulty_multiplier:.2f}.\n"
        f"Quests today: {quest_summaries}\n\n"
        'Return JSON: {"<template_key>": "<one short rationale sentence>", ...} for every quest key given.'
    )

    try:
        result = await call_ai(SYSTEM_PROMPT, user_prompt, max_tokens=800, expect_json=True)
        if isinstance(result, dict):
            fallback.update({k: v for k, v in result.items() if isinstance(v, str)})
    except AIClientError as exc:
        logger.warning("AI rationale generation failed, using fallback text: %s", exc)

    return fallback


def _fallback_rationale(quest_summary: dict, difficulty_multiplier: float) -> str:
    name = quest_summary.get("name", "This quest")
    if difficulty_multiplier > 1.15:
        return f"{name} — scaled up. You've earned the harder target."
    if difficulty_multiplier < 0.85:
        return f"{name} — scaled back today. Build momentum, not exhaustion."
    return f"{name} — steady target, steady progress."
