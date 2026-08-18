"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Plus, Sparkles } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { resolveIcon } from "@/lib/icon-map";
import { defaultStepForUnit, formatQuestValue } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { QuestInstance } from "@/types";

interface QuestCardProps {
  quest: QuestInstance;
  onLog: (delta: number) => Promise<void>;
}

const DEFAULT_ACCENT = { border: "border-l-arc-500", icon: "text-arc-400 border-arc-500/30 bg-arc-500/10", bar: "arc" as const };

const CATEGORY_ACCENT: Record<string, { border: string; icon: string; bar: "arc" | "cyan" | "amber" | "crimson" }> = {
  study:    { border: "border-l-arc-500",    icon: "text-arc-400 border-arc-500/30 bg-arc-500/10",      bar: "arc" },
  strength: { border: "border-l-crimson-500", icon: "text-crimson-400 border-crimson-500/30 bg-crimson-500/10", bar: "crimson" },
  cardio:   { border: "border-l-cyan-500",   icon: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",   bar: "cyan" },
  mobility: { border: "border-l-cyan-400",   icon: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",   bar: "cyan" },
  core:     { border: "border-l-crimson-400", icon: "text-crimson-400 border-crimson-400/30 bg-crimson-400/10", bar: "crimson" },
  recovery: { border: "border-l-amber-400",  icon: "text-amber-400 border-amber-400/30 bg-amber-400/10", bar: "amber" },
  sport:    { border: "border-l-arc-400",    icon: "text-arc-400 border-arc-400/30 bg-arc-400/10",      bar: "arc" },
  hidden:   { border: "border-l-amber-500",  icon: "text-amber-400 border-amber-500/30 bg-amber-500/10", bar: "amber" },
};

export function QuestCard({ quest, onLog }: QuestCardProps) {
  const [isLogging, setIsLogging] = useState(false);
  const Icon = resolveIcon(quest.template.icon_key);
  const step = defaultStepForUnit(quest.template.unit);
  const percent = Math.min(100, (quest.current_value / quest.target_value) * 100);

  const accent = CATEGORY_ACCENT[quest.template.category] ?? DEFAULT_ACCENT;

  async function handleLog(delta: number) {
    if (quest.is_completed || isLogging) return;
    setIsLogging(true);
    try {
      await onLog(delta);
    } finally {
      setIsLogging(false);
    }
  }

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div
        className={cn(
          "relative rounded-lg border border-arc-500/15 bg-panel/60 pl-3 pr-3 py-3 backdrop-blur-sm",
          "border-l-2 transition-all duration-200 hover:border-arc-500/30",
          accent.border,
          quest.is_completed && "opacity-75 bg-emerald-500/[0.03] border-emerald-500/20 border-l-emerald-500",
        )}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn(
            "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border",
            quest.is_completed
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : accent.icon,
          )}>
            {quest.is_completed ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            {/* Title row */}
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className={cn(
                "font-body text-sm font-semibold truncate",
                quest.is_completed ? "text-ink-muted" : "text-ink-primary",
              )}>
                {quest.template.name}
              </h3>
              <span className="flex-shrink-0 font-mono text-[9px] font-semibold text-amber-400">
                +{quest.xp_reward} XP
              </span>
            </div>

            {/* AI rationale */}
            {quest.ai_rationale && (
              <p className="mb-1.5 flex items-start gap-1 font-body text-[10px] text-ink-muted">
                <Sparkles className="mt-0.5 h-2.5 w-2.5 flex-shrink-0 text-arc-400" />
                <span>{quest.ai_rationale}</span>
              </p>
            )}

            {/* Progress bar */}
            <ProgressBar
              value={percent}
              variant={quest.is_completed ? "cyan" : accent.bar}
              size="sm"
            />

            {/* Progress value + actions */}
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] text-ink-faint">
                {formatQuestValue(quest.current_value, quest.template.unit)} /{" "}
                {formatQuestValue(quest.target_value, quest.template.unit)}
              </span>

              {!quest.is_completed && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleLog(step)}
                    disabled={isLogging}
                    className="flex h-6 items-center gap-0.5 rounded-md border border-arc-500/25 bg-void/60 px-2 font-mono text-[9px] font-semibold text-ink-secondary transition-colors hover:border-arc-500/50 hover:text-ink-primary disabled:opacity-40"
                  >
                    <Plus className="h-2.5 w-2.5" />
                    {step}
                  </button>
                  <button
                    onClick={() => handleLog(quest.target_value - quest.current_value)}
                    disabled={isLogging}
                    className="h-6 rounded-md bg-arc-500/15 px-2.5 font-mono text-[9px] font-semibold text-arc-300 transition-colors hover:bg-arc-500/25 disabled:opacity-40"
                  >
                    Done
                  </button>
                </div>
              )}

              {quest.is_completed && (
                <span className="flex items-center gap-1 font-mono text-[9px] text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" /> Complete
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
