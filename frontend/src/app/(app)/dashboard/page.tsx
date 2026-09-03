"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle,
  Flame,
  Loader2,
  TrendingUp,
  Zap,
  BarChart2,
  Gem,
} from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import { useQuestBoardStore } from "@/store/useQuestBoardStore";
import { LevelUpModal } from "@/features/quests/LevelUpModal";
import { HeroBanner } from "@/features/dashboard/HeroBanner";
import { KpiCard } from "@/features/dashboard/KpiCard";
import { SystemOverviewPanel } from "@/features/dashboard/SystemOverviewPanel";

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
    study: "from-arc-500/20 to-arc-900/5",
    strength: "from-crimson-500/15 to-arc-900/5",
    cardio: "from-cyan-500/15 to-arc-900/5",
    mobility: "from-cyan-400/15 to-arc-900/5",
    core: "from-crimson-400/15 to-arc-900/5",
    recovery: "from-amber-400/15 to-arc-900/5",
    sport: "from-arc-400/15 to-arc-900/5",
    hidden: "from-amber-500/15 to-arc-900/5",
  };

  const BAR_COLORS: Record<string, string> = {
    study: "bg-arc-500",
    strength: "bg-crimson-500",
    cardio: "bg-cyan-500",
    mobility: "bg-cyan-400",
    core: "bg-crimson-400",
    recovery: "bg-amber-400",
    sport: "bg-arc-400",
    hidden: "bg-amber-500",
  };

  const gradClass = CATEGORY_COLORS[quest.template.category] ?? CATEGORY_COLORS.study;
  const barClass = BAR_COLORS[quest.template.category] ?? "bg-arc-500";

  return (
    <div
      className={cn(
        "relative group rounded border border-arc-500/15 bg-gradient-to-r px-2 py-1.5 transition-all duration-200 hover:border-arc-500/35",
        gradClass,
        catClass,
        quest.is_completed && "opacity-80"
      )}
    >
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded border",
            quest.is_completed
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-arc-500/25 bg-void/50 text-ink-muted"
          )}
        >
          {quest.is_completed ? (
            <CheckCircle className="h-3 w-3" />
          ) : (
            <Icon className="h-3 w-3" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1.5">
            <p
              className={cn(
                "font-body text-xs font-semibold truncate",
                quest.is_completed ? "text-ink-muted line-through" : "text-ink-primary"
              )}
            >
              {quest.template.name}
            </p>
            <span className="flex-shrink-0 font-mono text-[9px] font-semibold text-amber-400">
              +{quest.xp_reward} XP
            </span>
          </div>

          <div className="mt-0.5 h-1 w-full rounded-full bg-void-deep/80 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                barClass,
                quest.is_completed && "bg-emerald-500"
              )}
              style={{ width: `${percent}%` }}
            />
          </div>

          <div className="mt-0.5 flex items-center justify-between">
            <span className="font-mono text-[8px] text-ink-faint">
              {formatQuestValue(quest.current_value, quest.template.unit)} /{" "}
              {formatQuestValue(quest.target_value, quest.template.unit)}
            </span>
            {!quest.is_completed && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onLog(quest.id, 1)}
                  className="rounded px-1 font-mono text-[8px] border border-arc-500/25 text-arc-300 hover:bg-arc-500/15"
                >
                  +1
                </button>
                <button
                  onClick={() => onLog(quest.id, quest.target_value - quest.current_value)}
                  className="rounded px-1 font-mono text-[8px] bg-arc-500/15 text-arc-300 hover:bg-arc-500/25"
                >
                  Done
                </button>
              </div>
            )}
            {quest.is_completed && (
              <span className="font-mono text-[8px] text-emerald-400 flex items-center gap-0.5">
                <CheckCircle className="h-2 w-2" /> Done
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

  const allMandatory = board?.categories.flatMap((s) => s.quests) ?? [];
  const completedCount = allMandatory.filter((q) => q.is_completed).length;
  const totalCount = allMandatory.length;

  return (
    <div className="h-full w-full flex flex-col justify-between overflow-hidden gap-2">
      {/* ── ROW 1: HERO BANNER (Fixed ~165px) ───────────────── */}
      <div className="h-[165px] flex-shrink-0">
        <HeroBanner user={user} board={board} />
      </div>

      {/* ── ROW 2: 5 KPI METRIC CARDS (Fixed ~60px) ─────────── */}
      <div className="h-[60px] flex-shrink-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        <KpiCard
          label="QUESTS COMPLETED"
          value={`${completedCount} / ${totalCount}`}
          icon={CheckCircle}
          trend={board ? `${Math.round(board.completion_percent)}% to next` : "0% to next"}
          trendUp={board ? board.completion_percent >= 50 : false}
          accentClass="text-arc-300"
          glowClass="shadow-glow-arc-sm"
          iconBgClass="from-purple-600 to-purple-950"
        />
        <KpiCard
          label="DAILY XP"
          value={`${character.current_xp.toLocaleString()} XP`}
          icon={Zap}
          trend={`+${Math.round(character.xp_progress_percent)}% from yesterday`}
          trendUp={true}
          accentClass="text-blue-400"
          glowClass="shadow-glow-cyan"
          iconBgClass="from-blue-600 to-blue-950"
        />
        <KpiCard
          label="OVERALL PROGRESS"
          value={`${Math.round(character.xp_progress_percent)}%`}
          icon={TrendingUp}
          trend="Keep going, Hunter!"
          trendUp={true}
          accentClass="text-cyan-400"
          glowClass="shadow-glow-cyan"
          iconBgClass="from-cyan-600 to-cyan-950"
        />
        <KpiCard
          label="STREAK"
          value={`${character.current_streak_days} Days`}
          icon={Flame}
          trend="Best: 12 Days"
          trendUp={character.current_streak_days > 0}
          accentClass="text-amber-400"
          glowClass="shadow-glow-amber"
          iconBgClass="from-orange-600 to-orange-950"
        />
        <KpiCard
          label="CREDITS"
          value="15,850"
          icon={Gem}
          trend="+250 today"
          trendUp={true}
          accentClass="text-amber-300"
          glowClass="shadow-glow-amber"
          iconBgClass="from-amber-600 to-amber-950"
        />
      </div>

      {/* ── ROW 3: DAILY QUESTS (2/3) + SYSTEM OVERVIEW (1/3) (Flex 1) ─ */}
      <div className="flex-1 min-h-[180px] grid grid-cols-1 lg:grid-cols-3 gap-2 overflow-hidden">
        {/* Daily Quests Panel — 2/3 width */}
        <div className="lg:col-span-2 hud-panel p-2.5 flex flex-col justify-between min-h-0 overflow-hidden" id="daily-quests">
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="font-display text-xs font-bold tracking-wider text-white">
                  DAILY QUESTS
                </h2>
                <p className="font-mono text-[8px] text-arc-400/60 mt-0.5">
                  Complete your quests and level up.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] text-ink-secondary">
                  {completedCount}/{totalCount} Completed
                </span>
                <Link
                  href="/quests"
                  className="flex items-center gap-1 rounded border border-arc-500/25 bg-arc-500/10 px-2 py-0.5 font-mono text-[8px] text-arc-300 hover:bg-arc-500/20"
                >
                  FULL LOG <ArrowRight className="h-2 w-2" />
                </Link>
              </div>
            </div>

            <div className="mt-1.5 h-1 w-full flex-shrink-0 rounded-full bg-void-deep overflow-hidden">
              <div
                className="h-full rounded-full bg-stat-bar-arc shadow-glow-arc-sm transition-all duration-700"
                style={{ width: `${board?.completion_percent ?? 0}%` }}
              />
            </div>

            {/* Quest list */}
            {isLoading && !board ? (
              <div className="flex items-center justify-center flex-1">
                <Loader2 className="h-4 w-4 animate-spin text-arc-400" />
              </div>
            ) : allMandatory.length > 0 ? (
              <div className="mt-1.5 flex-1 min-h-0 space-y-1 overflow-y-auto pr-1 scrollbar-thin">
                {allMandatory.map((quest) => (
                  <DashboardQuestRow key={quest.id} quest={quest} onLog={handleLog} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 gap-1">
                <BarChart2 className="h-5 w-5 text-arc-500/30" />
                <p className="font-mono text-[8px] text-ink-faint">No quests available today.</p>
              </div>
            )}
          </div>

          <Link
            href="/quests"
            className="block text-center font-mono text-[8px] text-arc-400 hover:text-arc-300 pt-1.5 border-t border-arc-500/10 flex-shrink-0"
          >
            VIEW ALL QUESTS →
          </Link>
        </div>

        {/* System Overview Panel — 1/3 width */}
        <div className="lg:col-span-1 hud-panel min-h-0 overflow-hidden">
          <SystemOverviewPanel
            xpProgressPercent={character.xp_progress_percent}
            activeBoost="2.1x XP"
          />
        </div>
      </div>



      {/* Level-Up Modal */}
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
