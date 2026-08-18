import { GlassCard } from "@/components/ui/GlassCard";
import type { CharacterStats } from "@/types";

const STAT_LABELS: { key: keyof CharacterStats; label: string; abbr: string }[] = [
  { key: "knowledge", label: "Knowledge", abbr: "KNW" },
  { key: "strength", label: "Strength", abbr: "STR" },
  { key: "stamina", label: "Stamina", abbr: "STA" },
  { key: "recovery", label: "Recovery", abbr: "RCV" },
  { key: "focus", label: "Focus", abbr: "FOC" },
  { key: "discipline", label: "Discipline", abbr: "DSC" },
  { key: "consistency", label: "Consistency", abbr: "CNS" },
  { key: "agility", label: "Agility", abbr: "AGI" },
  { key: "speed", label: "Speed", abbr: "SPD" },
  { key: "potential", label: "Potential", abbr: "POT" },
  { key: "luck", label: "Luck", abbr: "LCK" },
  { key: "mental_fortitude", label: "Mental Fortitude", abbr: "MFT" },
];

export function StatSheetPreview({ stats }: { stats: CharacterStats }) {
  return (
    <GlassCard padding="md">
      <h2 className="mb-4 font-display text-base font-semibold text-ink-primary">Character Sheet</h2>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {STAT_LABELS.map(({ key, label, abbr }) => (
          <div
            key={key}
            title={label}
            className="flex flex-col items-center rounded-lg border border-panel-border bg-void/40 py-3"
          >
            <span className="hud-label text-ink-faint">{abbr}</span>
            <span className="stat-value mt-1 text-xl font-semibold">{stats[key]}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
