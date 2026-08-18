"use client";

import { motion } from "framer-motion";
import { Skull, Swords } from "lucide-react";
import { differenceInHours, parseISO } from "date-fns";
import { GlassCard } from "@/components/ui/GlassCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/utils";
import type { Boss } from "@/types";

const ARCHETYPE_COPY: Record<Boss["archetype"], string> = {
  procrastination: "Procrastination",
  fatigue: "Fatigue",
  distraction: "Distraction",
  chaos: "Chaos",
  stagnation: "Stagnation",
  doubt: "Doubt",
};

export function BossCard({ boss, onClaim }: { boss: Boss; onClaim?: () => void }) {
  const hoursLeft = Math.max(0, differenceInHours(parseISO(boss.cycle_end), new Date()));
  const daysLeft = Math.floor(hoursLeft / 24);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <GlassCard
        padding="lg"
        glow={boss.is_defeated ? "cyan" : "crimson"}
        className="relative overflow-hidden"
      >
        <div className="absolute -right-6 -top-6 opacity-[0.06]">
          <Skull className="h-40 w-40" />
        </div>

        <div className="relative z-10">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <span
                className={cn(
                  "hud-label rounded-full border px-2 py-0.5",
                  boss.cycle === "weekly"
                    ? "border-arc-500/30 text-arc-400"
                    : "border-amber-500/30 text-amber-400"
                )}
              >
                {boss.cycle === "weekly" ? "Weekly Boss" : "Monthly Raid"}
              </span>
              <h3 className="mt-2 font-display text-xl font-bold text-ink-primary">{boss.name}</h3>
              <p className="hud-label mt-0.5 text-ink-faint">{ARCHETYPE_COPY[boss.archetype]}</p>
            </div>
            {!boss.is_defeated && (
              <span className="hud-label whitespace-nowrap text-ink-muted">{daysLeft}d {hoursLeft % 24}h left</span>
            )}
          </div>

          <p className="font-body text-sm leading-relaxed text-ink-secondary">{boss.lore_text}</p>

          <div className="mt-5">
            <ProgressBar
              value={boss.hp_percent}
              variant={boss.is_defeated ? "cyan" : "crimson"}
              label={boss.is_defeated ? "Defeated" : "HP Remaining"}
              showPercent
            />
            <p className="stat-value mt-1.5 text-xs text-ink-muted">
              {Math.round(boss.current_hp).toLocaleString()} / {Math.round(boss.max_hp).toLocaleString()} HP
            </p>
          </div>

          {boss.is_defeated && onClaim && (
            <button onClick={onClaim} className="btn-primary mt-5 w-full">
              <Swords className="h-4 w-4" />
              Claim {boss.reward_xp} XP Reward
            </button>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}
