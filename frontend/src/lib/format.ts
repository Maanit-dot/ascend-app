import type { QuestUnit } from "@/types";

const UNIT_LABELS: Record<QuestUnit, { short: string; suffix: (n: number) => string }> = {
  questions: { short: "questions", suffix: (n) => `${formatNumber(n)} questions` },
  km: { short: "km", suffix: (n) => `${formatNumber(n)} km` },
  rounds: { short: "rounds", suffix: (n) => `${formatNumber(n)} rounds` },
  steps: { short: "steps", suffix: (n) => `${formatNumber(n)} steps` },
  reps: { short: "reps", suffix: (n) => `${formatNumber(n)} reps` },
  seconds: { short: "sec", suffix: (n) => `${formatNumber(n)} sec` },
  minutes: { short: "min", suffix: (n) => `${formatNumber(n)} min` },
  hours: { short: "hrs", suffix: (n) => `${formatNumber(n)} hrs` },
  sets: { short: "sets", suffix: (n) => `${formatNumber(n)} sets` },
};

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value);
}

export function formatQuestValue(value: number, unit: QuestUnit): string {
  return UNIT_LABELS[unit].suffix(value);
}

export function unitShortLabel(unit: QuestUnit): string {
  return UNIT_LABELS[unit].short;
}

/** Sensible default increment step per unit, used by the quick-log +/- controls. */
export function defaultStepForUnit(unit: QuestUnit): number {
  switch (unit) {
    case "questions":
      return 10;
    case "km":
      return 0.5;
    case "reps":
      return 10;
    case "steps":
      return 500;
    case "minutes":
      return 5;
    case "hours":
      return 0.5;
    case "sets":
    case "rounds":
      return 1;
    case "seconds":
      return 30;
    default:
      return 1;
  }
}

/** Dynamic level title progression */
export function getHunterTitle(level: number): string {
  if (level < 10) return "Awakening";
  if (level < 20) return "Hunter";
  if (level < 30) return "Elite Hunter";
  if (level < 40) return "High Hunter";
  if (level < 50) return "Monarch Candidate";
  if (level < 75) return "Monarch";
  if (level < 100) return "Sovereign";
  return "ASCENDANT";
}

/** Rank progression based on level */
export function getHunterRank(level: number): string {
  if (level < 10) return "E";
  if (level < 20) return "D";
  if (level < 30) return "C";
  if (level < 40) return "B";
  if (level < 50) return "A";
  return "S";
}
