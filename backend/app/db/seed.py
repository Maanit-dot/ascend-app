"""
Seed script — populates the static catalog tables (quest templates, items,
achievements, titles, story chapters) from the ASCEND design spec.

Run with:  python -m app.db.seed
Idempotent: safe to re-run, upserts by unique `key`.
"""
from __future__ import annotations

from datetime import date, timedelta

from app.db.session import SessionLocal
from app.models.achievement import AchievementDefinition, Title
from app.models.boss import Boss, BossCycle
from app.models.inventory import ItemDefinition, ItemEffectType, ItemRarity
from app.models.quest import QuestCategory, QuestTemplate, QuestType, QuestUnit
from app.models.story import StoryChapter
from app.services.boss_service import create_monthly_boss, create_weekly_boss

# ---------------------------------------------------------------------------
# Quest templates — itemized to match the exact daily checklist, grouped by
# category (each dict's `sort_order` controls position within its category
# section on the quest board).
# ---------------------------------------------------------------------------
QUEST_TEMPLATES = [
    # --- Study ---
    dict(
        key="jee_questions",
        name="Solve 200 JEE Questions",
        description="Solve competitive-exam practice questions across your weak and strong subjects.",
        category=QuestCategory.STUDY,
        quest_type=QuestType.MANDATORY,
        unit=QuestUnit.QUESTIONS,
        base_target=200, min_target=150, max_target=300,
        allows_bonus=True, sort_order=0,
        base_xp_reward=500, primary_stat="knowledge", secondary_stat="focus",
        icon_key="jee_questions",
    ),
    dict(
        key="study_time",
        name="Study Time",
        description="Focused study block — tell ARC the subject/chapter breakdown as you go.",
        category=QuestCategory.STUDY,
        quest_type=QuestType.MANDATORY,
        unit=QuestUnit.HOURS,
        base_target=5, min_target=4, max_target=7,
        allows_bonus=True, sort_order=1,
        base_xp_reward=200, primary_stat="discipline", secondary_stat="focus",
        icon_key="study_time",
    ),
    # --- Recovery ---
    dict(
        key="sleep", name="Sleep", description="Minimum restorative sleep target.",
        category=QuestCategory.RECOVERY, quest_type=QuestType.MANDATORY, unit=QuestUnit.HOURS,
        base_target=6, min_target=6, max_target=9, sort_order=0,
        base_xp_reward=40, primary_stat="recovery", icon_key="sleep",
    ),
    # --- Cardio ---
    dict(
        key="running", name="Running", description="Running — 5 km (approx. 50 rounds of the track).",
        category=QuestCategory.CARDIO, quest_type=QuestType.MANDATORY, unit=QuestUnit.KM,
        base_target=5, min_target=3, max_target=8, sort_order=0,
        base_xp_reward=300, primary_stat="stamina", secondary_stat="speed", icon_key="running",
    ),
    dict(
        key="walking", name="Footsteps", description="Daily step target.",
        category=QuestCategory.CARDIO, quest_type=QuestType.MANDATORY, unit=QuestUnit.STEPS,
        base_target=10000, min_target=6000, max_target=15000, sort_order=1,
        base_xp_reward=35, primary_stat="stamina", icon_key="walking",
    ),
    # --- Mobility & Posture ---
    dict(
        key="cobra_stretch", name="Cobra Stretch", description="Cobra Stretch — 5 sets × 25 sec.",
        category=QuestCategory.MOBILITY, quest_type=QuestType.MANDATORY, unit=QuestUnit.SETS,
        base_target=5, min_target=4, max_target=6, default_sets=5, default_reps_per_set=25,
        sort_order=0,
        base_xp_reward=25, primary_stat="agility", secondary_stat="recovery", icon_key="mobility",
    ),
    dict(
        key="tadasana", name="Tadasana", description="Tadasana — 5 sets × 20 sec.",
        category=QuestCategory.MOBILITY, quest_type=QuestType.MANDATORY, unit=QuestUnit.SETS,
        base_target=5, min_target=4, max_target=6, default_sets=5, default_reps_per_set=20,
        sort_order=1,
        base_xp_reward=25, primary_stat="agility", secondary_stat="recovery", icon_key="mobility",
    ),
    dict(
        key="toe_touch", name="Toe Touch", description="Toe Touch — 5 sets × 20 sec.",
        category=QuestCategory.MOBILITY, quest_type=QuestType.MANDATORY, unit=QuestUnit.SETS,
        base_target=5, min_target=4, max_target=6, default_sets=5, default_reps_per_set=20,
        sort_order=2,
        base_xp_reward=25, primary_stat="agility", secondary_stat="recovery", icon_key="mobility",
    ),
    dict(
        key="cat_cow", name="Cat-Cow", description="Cat-Cow — 10 reps.",
        category=QuestCategory.MOBILITY, quest_type=QuestType.MANDATORY, unit=QuestUnit.REPS,
        base_target=10, min_target=8, max_target=14, sort_order=3,
        base_xp_reward=20, primary_stat="agility", secondary_stat="recovery", icon_key="mobility",
    ),
    dict(
        key="dead_hang", name="Dead Hang", description="Dead Hang — 2 sets × 1 min.",
        category=QuestCategory.MOBILITY, quest_type=QuestType.MANDATORY, unit=QuestUnit.SETS,
        base_target=2, min_target=1, max_target=3, default_sets=2, default_reps_per_set=60,
        sort_order=4,
        base_xp_reward=30, primary_stat="strength", secondary_stat="recovery", icon_key="mobility",
    ),
    # --- Strength ---
    dict(
        key="pushups", name="Push-ups", description="Push-ups — 5 sets × 20 (100 reps).",
        category=QuestCategory.STRENGTH, quest_type=QuestType.MANDATORY, unit=QuestUnit.REPS,
        base_target=100, min_target=60, max_target=150, default_sets=5, default_reps_per_set=20,
        sort_order=0,
        base_xp_reward=100, primary_stat="strength", icon_key="pushups",
    ),
    dict(
        key="incline_pushups", name="Incline Push-ups", description="Incline Push-ups — 2 sets × 20 (40 reps).",
        category=QuestCategory.STRENGTH, quest_type=QuestType.MANDATORY, unit=QuestUnit.REPS,
        base_target=40, min_target=30, max_target=60, default_sets=2, default_reps_per_set=20,
        sort_order=1,
        base_xp_reward=50, primary_stat="strength", icon_key="pushups",
    ),
    dict(
        key="squats", name="Squats", description="Squats — 2 sets × 25 (50 reps).",
        category=QuestCategory.STRENGTH, quest_type=QuestType.MANDATORY, unit=QuestUnit.REPS,
        base_target=50, min_target=40, max_target=70, default_sets=2, default_reps_per_set=25,
        sort_order=2,
        base_xp_reward=60, primary_stat="strength", secondary_stat="stamina", icon_key="squats",
    ),
    # --- Core ---
    dict(
        key="situps", name="Sit-ups", description="Sit-ups — 2 sets × 25 (50 reps).",
        category=QuestCategory.CORE, quest_type=QuestType.MANDATORY, unit=QuestUnit.REPS,
        base_target=50, min_target=40, max_target=70, default_sets=2, default_reps_per_set=25,
        sort_order=0,
        base_xp_reward=50, primary_stat="strength", secondary_stat="mental_fortitude", icon_key="core",
    ),
    dict(
        key="bicycle_crunches", name="Bicycle Crunches", description="Bicycle Crunches — 2 sets × 25 (50 reps).",
        category=QuestCategory.CORE, quest_type=QuestType.MANDATORY, unit=QuestUnit.REPS,
        base_target=50, min_target=40, max_target=70, default_sets=2, default_reps_per_set=25,
        sort_order=1,
        base_xp_reward=50, primary_stat="strength", secondary_stat="mental_fortitude", icon_key="core",
    ),
    dict(
        key="mountain_climbers", name="Mountain Climbers", description="Mountain Climbers — 6 sets × 40 (240 reps).",
        category=QuestCategory.CORE, quest_type=QuestType.MANDATORY, unit=QuestUnit.REPS,
        base_target=240, min_target=180, max_target=320, default_sets=6, default_reps_per_set=40,
        sort_order=2,
        base_xp_reward=80, primary_stat="stamina", secondary_stat="mental_fortitude", icon_key="core",
    ),
    dict(
        key="plank", name="Plank", description="Plank — 5 sets × 1 min.",
        category=QuestCategory.CORE, quest_type=QuestType.MANDATORY, unit=QuestUnit.MINUTES,
        base_target=5, min_target=3, max_target=7, default_sets=5, default_reps_per_set=60,
        sort_order=3,
        base_xp_reward=70, primary_stat="mental_fortitude", secondary_stat="strength", icon_key="core",
    ),
    dict(
        key="side_plank", name="Side Plank", description="Side Plank — 4 sets × 1 min (2 min per side).",
        category=QuestCategory.CORE, quest_type=QuestType.MANDATORY, unit=QuestUnit.MINUTES,
        base_target=4, min_target=3, max_target=6, default_sets=4, default_reps_per_set=60,
        sort_order=4,
        base_xp_reward=60, primary_stat="mental_fortitude", secondary_stat="strength", icon_key="core",
    ),
    # --- Optional Bonus ---
    dict(
        key="basketball", name="Basketball", description="Optional sport session.",
        category=QuestCategory.SPORT, quest_type=QuestType.OPTIONAL, unit=QuestUnit.MINUTES,
        base_target=25, min_target=20, max_target=30, sort_order=0,
        base_xp_reward=45, primary_stat="agility", secondary_stat="speed", icon_key="basketball",
    ),
    dict(
        key="badminton", name="Badminton", description="Optional sport session.",
        category=QuestCategory.SPORT, quest_type=QuestType.OPTIONAL, unit=QuestUnit.MINUTES,
        base_target=45, min_target=30, max_target=60, sort_order=1,
        base_xp_reward=45, primary_stat="agility", secondary_stat="speed", icon_key="badminton",
    ),
]

ITEMS = [
    dict(key="xp_boost", name="XP Boost", description="Temporarily increases XP earned from quests.",
         rarity=ItemRarity.UNCOMMON, effect_type=ItemEffectType.XP_MULTIPLIER, effect_value=1.25,
         duration_minutes=60, icon_key="xp_boost"),
    dict(key="focus_crystal", name="Focus Crystal", description="Permanently raises Focus by 1.",
         rarity=ItemRarity.RARE, effect_type=ItemEffectType.FOCUS_BOOST, effect_value=1,
         icon_key="focus_crystal"),
    dict(key="recovery_token", name="Recovery Token",
         description="Restores Recovery and reduces burnout risk.",
         rarity=ItemRarity.UNCOMMON, effect_type=ItemEffectType.RECOVERY_RESTORE, effect_value=1,
         icon_key="recovery_token"),
    dict(key="quest_voucher", name="Quest Voucher", description="Auto-completes one mandatory quest.",
         rarity=ItemRarity.RARE, effect_type=ItemEffectType.QUEST_SKIP, effect_value=1,
         icon_key="quest_voucher", is_tradeable=False),
    dict(key="mystery_chest", name="Mystery Chest", description="Contains a random common-to-rare item.",
         rarity=ItemRarity.EPIC, effect_type=ItemEffectType.CHEST_MYSTERY, effect_value=1,
         icon_key="mystery_chest"),
    dict(key="legendary_chest", name="Legendary Chest",
         description="Contains multiple rare items and guarantees a Luck point.",
         rarity=ItemRarity.LEGENDARY, effect_type=ItemEffectType.CHEST_LEGENDARY, effect_value=1,
         icon_key="legendary_chest"),
    dict(key="hyper_focus_elixir", name="Hyper Focus Elixir",
         description="Increases Focus and Discipline gains by 50% for 2 hours.",
         rarity=ItemRarity.RARE, effect_type=ItemEffectType.FOCUS_BOOST, effect_value=2,
         duration_minutes=120, icon_key="focus_crystal"),
    dict(key="recovery_infusion", name="Herbal Recovery Infusion",
         description="Accelerates recovery rate and reduces burnout risk score by 30%.",
         rarity=ItemRarity.UNCOMMON, effect_type=ItemEffectType.RECOVERY_RESTORE, effect_value=2,
         icon_key="recovery_token"),
    dict(key="iron_will_pendant", name="Pendant of Iron Will",
         description="Permanently raises Mental Fortitude attribute by +2.",
         rarity=ItemRarity.EPIC, effect_type=ItemEffectType.FOCUS_BOOST, effect_value=2,
         icon_key="focus_crystal"),
    dict(key="scholar_scroll", name="Scroll of the Ancient Scholar",
         description="Instantly grants +500 XP to study and knowledge progression.",
         rarity=ItemRarity.EPIC, effect_type=ItemEffectType.XP_MULTIPLIER, effect_value=1.5,
         icon_key="xp_boost"),
    dict(key="titan_essence", name="Essence of the Titan",
         description="Permanently raises Strength and Stamina attributes by +2.",
         rarity=ItemRarity.LEGENDARY, effect_type=ItemEffectType.FOCUS_BOOST, effect_value=3,
         icon_key="focus_crystal"),
    dict(key="shadowstride_boots", name="Shadowstride Boots",
         description="Permanently increases Agility and Speed attributes by +1.",
         rarity=ItemRarity.RARE, effect_type=ItemEffectType.FOCUS_BOOST, effect_value=1,
         icon_key="focus_crystal"),
    dict(key="talisman_serendipity", name="Talisman of Serendipity",
         description="Permanently increases Luck attribute by +2.",
         rarity=ItemRarity.EPIC, effect_type=ItemEffectType.FOCUS_BOOST, effect_value=2,
         icon_key="focus_crystal"),
    dict(key="discipline_ring", name="Ring of Unbroken Discipline",
         description="Protects active daily streak from breaking for 24 hours.",
         rarity=ItemRarity.LEGENDARY, effect_type=ItemEffectType.QUEST_SKIP, effect_value=1,
         icon_key="quest_voucher"),
]

ACHIEVEMENTS = [
    dict(key="first_quest", name="First Step", description="Complete your first quest.",
         xp_reward=50, unlock_condition_key="first_quest"),
    dict(key="streak_7", name="One Week Standing", description="Reach a 7-day streak.",
         xp_reward=150, unlock_condition_key="streak_7"),
    dict(key="streak_14", name="Fortnight of Will", description="Reach a 14-day streak.",
         xp_reward=300, unlock_condition_key="streak_14"),
    dict(key="streak_30", name="The Long Discipline", description="Reach a 30-day streak.",
         xp_reward=500, unlock_condition_key="streak_30"),
    dict(key="streak_60", name="Bi-Monthly Master", description="Reach a 60-day streak.",
         xp_reward=1000, unlock_condition_key="streak_60"),
    dict(key="streak_100", name="Unbroken", description="Reach a 100-day streak.",
         xp_reward=2000, unlock_condition_key="streak_100", is_hidden=True),
    dict(key="streak_180", name="Half-Year Ascendant", description="Reach a 180-day streak.",
         xp_reward=5000, unlock_condition_key="streak_180", is_hidden=True),
    dict(key="level_5", name="Rising Hunter", description="Reach character level 5.",
         xp_reward=100, unlock_condition_key="level_5"),
    dict(key="level_10", name="Threshold Crossed", description="Reach character level 10.",
         xp_reward=200, unlock_condition_key="level_10"),
    dict(key="level_15", name="Veteran Ascender", description="Reach character level 15.",
         xp_reward=350, unlock_condition_key="level_15"),
    dict(key="level_25", name="Ascendant Form", description="Reach character level 25.",
         xp_reward=600, unlock_condition_key="level_25"),
    dict(key="level_30", name="Master of Self", description="Reach character level 30.",
         xp_reward=800, unlock_condition_key="level_30"),
    dict(key="level_50", name="Apex Discipline", description="Reach character level 50.",
         xp_reward=1500, unlock_condition_key="level_50", is_hidden=True),
    dict(key="level_75", name="Mythic Form", description="Reach character level 75.",
         xp_reward=3000, unlock_condition_key="level_75", is_hidden=True),
    dict(key="level_100", name="God of Discipline", description="Reach character level 100.",
         xp_reward=10000, unlock_condition_key="level_100", is_hidden=True),
    dict(key="boss_slayer", name="Boss Slayer", description="Defeat your first boss.",
         xp_reward=300, unlock_condition_key="boss_slayer"),
    dict(key="boss_slayer_5", name="Raid Commander", description="Defeat 5 bosses.",
         xp_reward=1000, unlock_condition_key="boss_slayer_5"),
    dict(key="boss_slayer_10", name="Nullveil Nemesis", description="Defeat 10 bosses.",
         xp_reward=2500, unlock_condition_key="boss_slayer_10", is_hidden=True),
    dict(key="quest_50", name="Half-Century", description="Complete 50 total quests.",
         xp_reward=400, unlock_condition_key="quest_50"),
    dict(key="quest_100", name="Centurion", description="Complete 100 total quests.",
         xp_reward=800, unlock_condition_key="quest_100"),
    dict(key="quest_500", name="Legend of Discipline", description="Complete 500 total quests.",
         xp_reward=5000, unlock_condition_key="quest_500", is_hidden=True),
    dict(key="max_focus", name="Mind Like Diamond", description="Reach 50 Focus points.",
         xp_reward=750, unlock_condition_key="max_focus"),
    dict(key="max_strength", name="Iron Titan", description="Reach 50 Strength points.",
         xp_reward=750, unlock_condition_key="max_strength"),
    dict(key="max_knowledge", name="Archmage of Science", description="Reach 50 Knowledge points.",
         xp_reward=750, unlock_condition_key="max_knowledge"),
    dict(key="social_butterfly", name="Hunter Connection", description="Connect with 5 Hunters on the Network.",
         xp_reward=300, unlock_condition_key="social_butterfly"),
]

TITLES = [
    dict(key="the_initiate", display_text="The Initiate", description="Awarded at the start of the journey.",
         required_level=1),
    dict(key="the_awakened", display_text="The Awakened", description="Awarded at level 5.",
         required_level=5),
    dict(key="the_focused", display_text="The Focused", description="Awarded at level 15.",
         required_level=15),
    dict(key="the_relentless", display_text="The Relentless", description="Awarded at level 30.",
         required_level=30),
    dict(key="the_unstoppable", display_text="The Unstoppable", description="Awarded at level 40.",
         required_level=40),
    dict(key="the_sovereign", display_text="The Sovereign", description="Awarded at level 60.",
         required_level=60),
    dict(key="the_immortal", display_text="The Immortal", description="Awarded at level 80.",
         required_level=80),
    dict(key="ascendant", display_text="Ascendant", description="Awarded at level 100.",
         required_level=100),
    dict(key="boss_slayer_title", display_text="Slayer of Static",
         description="Awarded for defeating a boss.", required_achievement_key="boss_slayer"),
    dict(key="titan_of_iron", display_text="Titan of Iron",
         description="Awarded for reaching 50 Strength points.", required_achievement_key="max_strength"),
    dict(key="mind_of_diamond", display_text="Mind of Diamond",
         description="Awarded for reaching 50 Focus points.", required_achievement_key="max_focus"),
    dict(key="centurion_hunter", display_text="Centurion Hunter",
         description="Awarded for completing 100 total quests.", required_achievement_key="quest_100"),
    dict(key="nullveil_conqueror", display_text="Conqueror of Nullveil",
         description="Awarded for defeating 5 bosses.", required_achievement_key="boss_slayer_5"),
]

STORY_CHAPTERS = [
    dict(order_index=0, key="chapter_0_the_signal", title="The Signal",
         body_text=(
             "Before ASCEND, there was only static — the noise of a thousand unfinished intentions. "
             "You are not the first to hear the Signal calling structure out of that noise. "
             "You are only the first to answer it today."
         ),
         unlock_level=1),
    dict(order_index=1, key="chapter_1_first_threshold", title="The First Threshold",
         body_text=(
             "Ten days of logged quests. The system registers a pattern where there was once only "
             "intention. Nullveil stirs, sensing a will it can no longer stall indefinitely."
         ),
         unlock_level=10),
    dict(order_index=2, key="chapter_2_hollow_hours", title="The Hollow Hours",
         body_text=(
             "Level 25. The hardest chapters are never the early ones — they are the quiet middle "
             "stretches where no one is watching. You kept moving through them anyway."
         ),
         unlock_level=25),
    dict(order_index=3, key="chapter_3_echoes_of_momentum", title="Echoes of Momentum",
         body_text=(
             "Level 40. Momentum has a signature now — the system can predict your next move before "
             "you log it. That is not surveillance. That is trust, compounding."
         ),
         unlock_level=40),
    dict(order_index=4, key="chapter_4_long_ascent", title="The Long Ascent",
         body_text=(
             "Level 75. There is no final boss waiting at the top of this system, because the climb "
             "was never the obstacle. The climb was the character sheet, filling in, one stat at a time."
         ),
         unlock_level=75),
    dict(order_index=5, key="chapter_5_veil_of_doubt", title="Veil of Doubt",
         body_text=(
             "Level 90. The static attempts one final deception — convincing you that discipline is "
             "a temporary constraint rather than your true form. You step beyond the veil unbroken."
         ),
         unlock_level=90),
    dict(order_index=6, key="chapter_6_forging_the_will", title="Forging the Will",
         body_text=(
             "Level 100. Century mark achieved. Your habit loops are no longer effortful — they are "
             "second nature. You are no longer training to become someone. You are that someone."
         ),
         unlock_level=100),
    dict(order_index=7, key="chapter_7_shatter_the_ceiling", title="Shatter the Ceiling",
         body_text=(
             "Level 125. The conventional limits of human capacity were written by those who accepted "
             "friction. You have replaced friction with momentum."
         ),
         unlock_level=125),
    dict(order_index=8, key="chapter_8_realm_of_mastery", title="Realm of Mastery",
         body_text=(
             "Level 150. Mastery is not the absence of struggle — it is the quiet confidence that "
             "whatever struggle arrives tomorrow will yield to the system."
         ),
         unlock_level=150),
    dict(order_index=9, key="chapter_9_eternal_ascension", title="Eternal Ascension",
         body_text=(
             "Level 200. The apex of the ASCEND system. You have built a fortress of character that "
             "time, fatigue, and distraction can never tear down."
         ),
         unlock_level=200),
]


def _ensure_current_bosses(db) -> None:
    """
    Guarantees at least one active weekly boss and one active monthly boss
    exist for "today", so a freshly-seeded environment (or one where the
    `run_scheduler.py` cron hasn't fired yet) still has bosses to fight
    instead of an empty Boss board. This mirrors `app.services.scheduler`'s
    `ensure_weekly_boss` / `ensure_monthly_boss`, but lives here too so that
    plain `seed()` — run at app startup — is enough for local dev without
    requiring the external cron job to have run first.
    """
    today = date.today()

    week_start = today - timedelta(days=today.weekday())
    existing_weekly = (
        db.query(Boss)
        .filter(Boss.cycle == BossCycle.WEEKLY, Boss.cycle_start <= today, Boss.cycle_end >= today)
        .first()
    )
    if not existing_weekly:
        create_weekly_boss(db, week_start)

    month_start = today.replace(day=1)
    existing_monthly = (
        db.query(Boss)
        .filter(Boss.cycle == BossCycle.MONTHLY, Boss.cycle_start <= today, Boss.cycle_end >= today)
        .first()
    )
    if not existing_monthly:
        create_monthly_boss(db, month_start)


def seed() -> None:
    db = SessionLocal()
    try:
        for data in QUEST_TEMPLATES:
            existing = db.query(QuestTemplate).filter(QuestTemplate.key == data["key"]).first()
            if existing:
                for k, v in data.items():
                    setattr(existing, k, v)
            else:
                db.add(QuestTemplate(**data))

        for data in ITEMS:
            existing = db.query(ItemDefinition).filter(ItemDefinition.key == data["key"]).first()
            if existing:
                for k, v in data.items():
                    setattr(existing, k, v)
            else:
                db.add(ItemDefinition(**data))

        for data in ACHIEVEMENTS:
            existing = (
                db.query(AchievementDefinition)
                .filter(AchievementDefinition.key == data["key"])
                .first()
            )
            if existing:
                for k, v in data.items():
                    setattr(existing, k, v)
            else:
                db.add(AchievementDefinition(**data))

        for data in TITLES:
            existing = db.query(Title).filter(Title.key == data["key"]).first()
            if existing:
                for k, v in data.items():
                    setattr(existing, k, v)
            else:
                db.add(Title(**data))

        for data in STORY_CHAPTERS:
            existing = db.query(StoryChapter).filter(StoryChapter.key == data["key"]).first()
            if existing:
                for k, v in data.items():
                    setattr(existing, k, v)
            else:
                db.add(StoryChapter(**data))

        db.commit()

        # Bosses weren't part of the static catalog seed before — without
        # this, the Boss board stays empty until the external daily cron
        # (`scripts/run_scheduler.py`) happens to run, which never happens in
        # local dev. Bootstrapping here guarantees a fresh environment has a
        # boss to fight immediately.
        _ensure_current_bosses(db)

        print(f"Seeded {len(QUEST_TEMPLATES)} quest templates, {len(ITEMS)} items, "
              f"{len(ACHIEVEMENTS)} achievements, {len(TITLES)} titles, "
              f"{len(STORY_CHAPTERS)} story chapters, and ensured active bosses.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
