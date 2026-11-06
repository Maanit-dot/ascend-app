/**
 * Shared domain types — kept in 1:1 correspondence with the FastAPI Pydantic
 * schemas so the frontend and backend never drift silently.
 */

export type PrimaryTrack = "exam" | "fitness" | "discipline" | "hybrid";

export interface CharacterStats {
  knowledge: number;
  strength: number;
  stamina: number;
  recovery: number;
  focus: number;
  discipline: number;
  consistency: number;
  agility: number;
  speed: number;
  potential: number;
  luck: number;
  mental_fortitude: number;
}

export interface CharacterProfile {
  id: string;
  level: number;
  current_xp: number;
  total_xp_earned: number;
  xp_required_for_next_level: number;
  xp_progress_percent: number;
  stats: CharacterStats;
  current_streak_days: number;
  longest_streak_days: number;
  last_quest_completed_date: string | null;
  active_title_id: string | null;
  difficulty_multiplier: number;
  burnout_risk_score: number;
}

export interface AscendUser {
  id: string;
  email: string;
  username?: string | null;
  display_name: string;
  avatar_url: string | null;
  role?: string;
  is_owner?: boolean;
  is_suspended?: boolean;
  is_banned?: boolean;
  last_platform?: string;
  is_onboarded: boolean;
  timezone: string;
  primary_track: PrimaryTrack;
  created_at: string;
  character: CharacterProfile;
}

export interface UserSessionItem {
  id: string;
  client_type: string;
  device_name: string;
  ip_address: string | null;
  last_active_at: string;
  created_at: string;
  is_revoked: boolean;
  is_current?: boolean;
}

export interface AppModuleAction {
  id: string;
  name: string;
  description: string;
  requires_confirmation?: boolean;
}

export interface AppModule {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  color: string;
  auth_type: "oauth2" | "api_key" | "embedded" | "local_rpc";
  is_installed: boolean;
  is_enabled: boolean;
  is_connected: boolean;
  account_identifier?: string | null;
  last_synced_at?: string | null;
  supported_actions: AppModuleAction[];
  default_settings?: Record<string, any>;
  user_settings?: Record<string, any>;
}

export interface OwnerMetrics {
  total_registered_users: number;
  active_users_15m: number;
  active_website_users: number;
  active_desktop_users: number;
  total_desktop_installations: number;
  blocked_installations: number;
  suspended_or_banned_users: number;
  server_uptime_seconds: number;
  timestamp: string;
}

export interface OwnerUserItem {
  id: string;
  email: string;
  username?: string | null;
  display_name: string;
  role: string;
  is_suspended: boolean;
  suspension_reason?: string | null;
  is_banned: boolean;
  ban_reason?: string | null;
  last_login_at?: string | null;
  last_platform?: string | null;
  created_at: string;
  level: number;
  total_xp: number;
}

export interface OwnerInstallation {
  id: string;
  device_id: string;
  user_id?: string | null;
  user_email?: string | null;
  hostname: string;
  os_version: string;
  app_version: string;
  is_blocked: boolean;
  blocked_reason?: string | null;
  first_installed_at: string;
  last_seen_at: string;
}

export interface AuditLogEntry {
  id: string;
  actor_email: string;
  action: string;
  target_type?: string | null;
  target_id?: string | null;
  details?: string | null;
  ip_address?: string | null;
  created_at: string;
}

export interface SystemAnnouncement {
  title: string;
  message: string;
  variant: "info" | "warning" | "alert";
  updated_at?: string;
}

export type QuestCategory =
  | "study"
  | "strength"
  | "cardio"
  | "mobility"
  | "core"
  | "recovery"
  | "sport"
  | "hidden";

export type QuestType = "mandatory" | "optional" | "hidden" | "boss_contribution";

export type QuestUnit =
  | "questions"
  | "km"
  | "rounds"
  | "steps"
  | "reps"
  | "seconds"
  | "minutes"
  | "hours"
  | "sets";

export interface QuestTemplate {
  id: string;
  key: string;
  name: string;
  description: string;
  category: QuestCategory;
  unit: QuestUnit;
  icon_key: string;
  default_sets?: number | null;
  default_reps_per_set?: number | null;
  allows_bonus?: boolean;
}

export interface QuestInstance {
  id: string;
  assigned_date: string;
  quest_type: QuestType;
  target_value: number;
  current_value: number;
  xp_reward: number;
  is_completed: boolean;
  completed_at: string | null;
  ai_rationale: string | null;
  difficulty_snapshot: number;
  template: QuestTemplate;
}

/** A labeled group of quests for the board UI, e.g. "Cardio", "Core". */
export interface QuestCategorySection {
  label: string;
  quests: QuestInstance[];
}

export interface DailyQuestBoard {
  date: string;
  categories: QuestCategorySection[];
  optional: QuestInstance[];
  hidden: QuestInstance[];
  companion_message: string;
  difficulty_multiplier: number;
  completion_percent: number;
}

export interface QuestCompletionResult {
  quest: QuestInstance;
  xp_awarded: number;
  leveled_up: boolean;
  new_level: number;
  unlocks: string[];
  achievement_unlocks: string[];
}

export interface QuestHistoryEntry {
  date: string;
  total_quests: number;
  completed_quests: number;
  completion_percent: number;
  xp_earned: number;
}

export type BossArchetype =
  | "procrastination"
  | "fatigue"
  | "distraction"
  | "chaos"
  | "stagnation"
  | "doubt";

export type BossCycle = "weekly" | "monthly";

export interface Boss {
  id: string;
  name: string;
  archetype: BossArchetype;
  cycle: BossCycle;
  lore_text: string;
  icon_key: string;
  cycle_start: string;
  cycle_end: string;
  max_hp: number;
  current_hp: number;
  hp_percent: number;
  is_defeated: boolean;
  reward_xp: number;
}

export interface BossParticipation {
  boss: Boss;
  damage_dealt: number;
  quests_contributed: number;
  reward_claimed: boolean;
}

export type ItemRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
export type ItemEffectType =
  | "xp_multiplier"
  | "focus_boost"
  | "recovery_restore"
  | "quest_skip"
  | "chest_mystery"
  | "chest_legendary";

export interface ItemDefinition {
  id: string;
  key: string;
  name: string;
  description: string;
  rarity: ItemRarity;
  effect_type: ItemEffectType;
  effect_value: number;
  icon_key: string;
}

export interface InventoryItem {
  id: string;
  item: ItemDefinition;
  quantity: number;
  is_active_buff: boolean;
  buff_expires_at: string | null;
}

export interface Achievement {
  key: string;
  name: string;
  description: string;
  icon_key: string;
  xp_reward: number;
  is_hidden: boolean;
  unlocked_at: string | null;
}

export interface Title {
  id: string;
  key: string;
  display_text: string;
  description: string;
  unlocked_at: string | null;
}

export interface StoryChapter {
  key: string;
  title: string;
  body_text: string | null;
  is_unlocked: boolean;
  cover_art_key: string;
}

export type NotificationType =
  | "quest_reminder"
  | "level_up"
  | "boss_update"
  | "achievement_unlock"
  | "ai_message"
  | "burnout_warning"
  | "social_message"
  | "system";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export type BurnoutRiskLevel = "low" | "moderate" | "high" | "critical";

export interface BurnoutInsight {
  score: number;
  risk_level: BurnoutRiskLevel;
  contributing_factors: string[];
  recommendation: string;
}

export interface WeakSubject {
  subject: string;
  accuracy_estimate: number;
  recommendation: string;
}

/** One (subject, chapter) total — powers the Statistics breakdown panel. */
export interface SubjectBreakdownRow {
  subject: string;
  chapter: string;
  total_questions: number;
}
