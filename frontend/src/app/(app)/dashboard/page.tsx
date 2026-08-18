"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle, Flame, Loader2, TrendingUp, Zap, BarChart2 } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import { useQuestBoardStore } from "@/store/useQuestBoardStore";
import { LevelUpModal } from "@/features/quests/LevelUpModal";
import { HeroBanner } from "@/features/dashboard/HeroBanner";
import { KpiCard } from "@/features/dashboard/KpiCard";
import { SystemOverviewPanel, RecentAchievementPanel } from "@/features/dashboard/SystemOverviewPanel";
import { resolveIcon } from "@/lib/icon-map";
import { formatQuestValue } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { QuestInstance } from "@/types";

/* ── Inline Quest Row (reference-style compact quest card) ─────── */
function DashboardQuestRow({
  quest,
  onLog,
}: {
  quest: QuestInstance;
  onLog: (questId: string, delta: number) => Promise<void>;
}) {
  const Icon = resolveIcon(quest.template.icon_key);
  const percent = Math.min(100, (quest.current_value / quest.target_value) * 100);
  const catClass = `quest-card-${quest.template.category}` as string;

  const CATEGORY_COLORS: Record<string, string> = {
    study:    "from-arc-500/20 to-arc-900/5",
    strength: "from-crimson-500/15 to-arc-900/5",
    cardio:   "from-cyan-500/15 to-arc-900/5",
    mobility: "from-cyan-400/15 to-arc-900/5",
    core:     "from-crimson-400/15 to-arc-900/5",
    recovery: "from-amber-400/15 to-arc-900/5",
    sport:    "from-arc-400/15 to-arc-900/5",
    hidden:   "from-amber-500/15 to-arc-900/5",
  };

  const BAR_COLORS: Record<string, string> = {
    study:    "bg-arc-500",
    strength: "bg-crimson-500",
    cardio:   "bg-cyan-500",
    mobility: "bg-cyan-400",
    core:     "bg-crimson-400",
    recovery: "bg-amber-400",
    sport:    "bg-arc-400",
    hidden:   "bg-amber-500",
  };

  const gradClass = CATEGORY_COLORS[quest.template.category] ?? CATEGORY_COLORS.study;
  const barClass  = BAR_COLORS[quest.template.category] ?? "bg-arc-500";

  return (
    <div className={cn(
      "relative group rounded-lg border border-arc-500/15 bg-gradient-to-r p-3 transition-all duration-200 hover:border-arc-500/35",
      gradClass,
      catClass,
      quest.is_completed && "opacity-80",
    )}>
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className={cn(
          "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border",
          quest.is_completed
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
            : "border-arc-500/25 bg-void/50 text-ink-muted",
        )}>
          {quest.is_completed
            ? <CheckCircle className="h-4 w-4" />
            : <Icon className="h-4 w-4" />
          }
        </div>

        {/* Title + progress */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={cn(
              "font-body text-xs font-semibold truncate",
              quest.is_completed ? "text-ink-muted line-through" : "text-ink-primary",
            )}>
              {quest.template.name}
            </p>
            <span className="flex-shrink-0 font-mono text-[9px] font-semibold text-amber-400">
              +{quest.xp_reward} XP
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-1.5 h-1 w-full rounded-full bg-void-deep/80 overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", barClass, quest.is_completed && "bg-emerald-500")}
              style={{ width: `${percent}%` }}
            />
          </div>

          <div className="mt-1 flex items-center justify-between">
            <span className="font-mono text-[9px] text-ink-faint">
              {formatQuestValue(quest.current_value, quest.template.unit)} / {formatQuestValue(quest.target_value, quest.template.unit)}
            </span>
            {!quest.is_completed && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onLog(quest.id, 1)}
                  className="rounded px-1.5 py-0.5 font-mono text-[8px] border border-arc-500/25 text-arc-300 hover:bg-arc-500/15 transition-colors"
                >
                  +1
                </button>
                <button
                  onClick={() => onLog(quest.id, quest.target_value - quest.current_value)}
                  className="rounded px-1.5 py-0.5 font-mono text-[8px] bg-arc-500/15 text-arc-300 hover:bg-arc-500/25 transition-colors"
                >
                  Done
                </button>
              </div>
            )}
            {quest.is_completed && (
              <span className="font-mono text-[9px] text-emerald-400 flex items-center gap-0.5">
                <CheckCircle className="h-2.5 w-2.5" /> Done
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Dashboard Page ──────────────────────────────────────── */
export default function DashboardPage() {
  const user = useUserStore((s) => s.user);
  const patchCharacter = useUserStore((s) => s.patchCharacter);
  const { board, isLoading, fetchToday, logProgress, lastCompletionResult, clearCompletionResult } =
    useQuestBoardStore();

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

  async function handleLog(questId: string, delta: number) {
    await logProgress(questId, delta);
  }

  if (!user) return null;
  const { character } = user;

  // Flatten all mandatory quests for the dashboard preview
  const allMandatory = board?.categories.flatMap((s) => s.quests) ?? [];
  const completedCount = allMandatory.filter((q) => q.is_completed).length;
  const totalCount = allMandatory.length;

  return (
    <div className="mx-auto max-w-full space-y-4">
      {/* ── Row 1: Hero Banner ──────────────────────────────── */}
      <HeroBanner user={user} board={board} />

      {/* ── Row 2: KPI Metric Cards ─────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Quests Completed"
          value={completedCount}
          subValue={`/ ${totalCount}`}
          icon={CheckCircle}
          trend={board ? `${Math.round(board.completion_percent)}% today` : "Loading..."}
          trendUp={board ? board.completion_percent >= 50 : false}
          accentClass="text-arc-400"
          glowClass="shadow-glow-arc-sm"
          iconBgClass="from-arc-700 to-arc-950"
        />
        <KpiCard
          label="Daily XP"
          value={character.current_xp.toLocaleString()}
          subValue="XP"
          icon={Zap}
          trend={`+${Math.round(character.xp_progress_percent)}% to next`}
          trendUp={true}
          accentClass="text-amber-400"
          glowClass="shadow-glow-amber"
          iconBgClass="from-amber-600 to-amber-950"
        />
        <KpiCard
          label="Overall Progress"
          value={`${Math.round(character.xp_progress_percent)}%`}
          icon={TrendingUp}
          trend={`Level ${character.level}`}
          trendUp={true}
          accentClass="text-cyan-400"
          glowClass="shadow-glow-cyan"
          iconBgClass="from-cyan-700 to-cyan-950"
        />
        <KpiCard
          label="Streak"
          value={character.current_streak_days}
          subValue="Days"
          icon={Flame}
          trend={character.current_streak_days > 0 ? "Keep it up!" : "Start today"}
          trendUp={character.current_streak_days > 0}
          accentClass="text-amber-300"
          glowClass="shadow-glow-amber"
          iconBgClass="from-orange-700 to-orange-950"
        />
      </div>

      {/* ── Row 3: Daily Quests + System Overview ────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Daily Quests Panel — 2/3 width */}
        <div className="lg:col-span-2 hud-panel p-4 space-y-3" id="daily-quests">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-sm font-bold tracking-wider text-ink-primary">DAILY QUESTS</h2>
              <p className="font-mono text-[9px] text-arc-400/60 mt-0.5">
                Complete your quests and level up
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-ink-secondary">
                {completedCount}/{totalCount} Completed
              </span>
              <Link
                href="/quests"
                className="flex items-center gap-1 rounded-lg border border-arc-500/25 bg-arc-500/10 px-2.5 py-1 font-mono text-[9px] text-arc-300 hover:bg-arc-500/20 transition-colors"
              >
                Full Log <ArrowRight className="h-2.5 w-2.5" />
              </Link>
            </div>
          </div>

          {/* Completion progress bar */}
          <div className="h-1 w-full rounded-full bg-void-deep overflow-hidden">
            <div
              className="h-full rounded-full bg-stat-bar-arc shadow-glow-arc-sm transition-all duration-700"
              style={{ width: `${board?.completion_percent ?? 0}%` }}
            />
          </div>

          {/* Quest list */}
          {isLoading && !board ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-arc-400" />
            </div>
          ) : allMandatory.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {allMandatory.map((quest) => (
                <DashboardQuestRow key={quest.id} quest={quest} onLog={handleLog} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <BarChart2 className="h-8 w-8 text-arc-500/30" />
              <p className="font-mono text-[10px] text-ink-faint">No quests available today.</p>
            </div>
          )}
        </div>

        {/* Right column: System Overview + Recent Achievement */}
        <div className="flex flex-col gap-4">
          <SystemOverviewPanel
            xpProgressPercent={character.xp_progress_percent}
            activeBoost={null}
          />
          <RecentAchievementPanel />
        </div>
      </div>

      {/* Level-Up Modal (existing, untouched) */}
      <LevelUpModal
        isOpen={!!lastCompletionResult?.leveledUp}
        newLevel={lastCompletionResult?.newLevel ?? character.level}
        unlocks={lastCompletionResult?.unlocks ?? []}
        onClose={() => {
          if (lastCompletionResult) {
            patchCharacter({ level: lastCompletionResult.newLevel });
          }
          clearCompletionResult();
        }}
      />
    </div>
  );
}
