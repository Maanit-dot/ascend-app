import {
  BookOpenText,
  Footprints,
  Dumbbell,
  Waves,
  Shield,
  Moon,
  PersonStanding,
  CircleDot,
  Sparkles,
  Skull,
  Gift,
  Zap,
  Wind,
  BatteryCharging,
  Ticket,
  Package,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  jee_questions: BookOpenText,
  running: Footprints,
  pushups: Dumbbell,
  mobility: Waves,
  core: Shield,
  sleep: Moon,
  walking: PersonStanding,
  basketball: CircleDot,
  badminton: CircleDot,
  default_boss: Skull,
  default_item: Gift,
  xp_boost: Zap,
  focus_crystal: Sparkles,
  recovery_token: BatteryCharging,
  quest_voucher: Ticket,
  mystery_chest: Package,
  legendary_chest: Package,
  default_achievement: Sparkles,
  default_chapter: BookOpenText,
  default: Wind,
};

export function resolveIcon(iconKey: string): LucideIcon {
  return ICON_MAP[iconKey] ?? ICON_MAP.default!;
}
