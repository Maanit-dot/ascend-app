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
  DollarSign,
  ClipboardList,
} from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import { useQuestBoardStore } from "@/store/useQuestBoardStore";
import { LevelUpModal } from "@/features/quests/LevelUpModal";
import { HeroBanner } from "@/features/dashboard/HeroBanner";
import { KpiCard } from "@/features/dashboard/KpiCard";
import { SystemOverviewPanel } from "@/features/dashboard/SystemOverviewPanel";
import { ArcProjectionPanel } from "@/features/dashboard/ArcProjectionPanel";

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
    study: "from-arc-500/20 to-arc-900/5 border-arc-500/30",
    strength: "from-crimson-500/15 to-arc-900/5 border-crimson-500/30",
    cardio: "from-cyan-500/15 to-arc-900/5 border-cyan-500/30",
    mobility: "from-cyan-400/15 to-arc-900/5 border-cyan-400/30",
    core: "from-crimson-400/15 to-arc-900/5 border-crimson-400/30",
    recovery: "from-amber-400/15 to-arc-900/5 border-amber-400/30",
    sport: "from-arc-400/15 to-arc-900/5 border-arc-400/30",
    hidden: "from-amber-500/15 to-arc-900/5 border-amber-500/30",
  };

  const BAR_COLORS: Record<string, string> = {
    study: "bg-arc-500 shadow-glow-arc-sm",
    strength: "bg-crimson-500 shadow-glow-crimson",
    cardio: "bg-cyan-500 shadow-glow-cyan",
    mobility: "bg-cyan-400 shadow-glow-cyan",
    core: "bg-crimson-400 shadow-glow-crimson",
    recovery: "bg-amber-400 shadow-glow-amber",
    sport: "bg-arc-400 shadow-glow-arc-sm",
    hidden: "bg-amber-500 shadow-glow-amber",
  };

  const gradClass = CATEGORY_COLORS[quest.template.category] ?? CATEGORY_COLORS.study;
  const barClass = BAR_COLORS[quest.template.category] ?? "bg-arc-500";

  return (
    <div
      className={cn(
        "relative group rounded-lg border bg-gradient-to-r px-2 py-1 transition-all duration-200 hover:border-arc-400/50 select-none",
        gradClass,
        catClass,
        quest.is_completed && "opacity-80"
      )}
    >
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg border",
            quest.is_completed
              ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
              : "border-arc-500/30 bg-void/70 text-arc-300"
          )}
        >
          {quest.is_completed ? (
            <CheckCircle className="h-3.5 w-3.5" />
          ) : (
            <Icon className="h-3.5 w-3.5" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <p
              className={cn(
                "font-display text-[10px] font-semibold truncate",
                quest.is_completed ? "text-ink-muted line-through" : "text-white"
              )}
            >
              {quest.template.name}
            </p>
            <span className="flex-shrink-0 font-mono text-[8px] font-bold text-amber-400">
              +{quest.xp_reward} XP
            </span>
          </div>

          <div className="mt-0.5 flex items-center justify-between font-mono text-[7px] text-ink-faint">
            <span>{formatQuestValue(quest.current_value, quest.template.unit)} / {formatQuestValue(quest.target_value, quest.template.unit)}</span>
          </div>

          <div className="mt-0.5 h-1 w-full rounded-full bg-void-deep/90 overflow-hidden border border-white/5">
            <div
              className={cn("h-full rounded-full transition-all duration-500", barClass)}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const user = useUserStore((s) => s.user);
  const patchCharacter = useUserStore((s) => s.patchCharacter);
  const {
    board,
    isLoading,
    fetchToday,
    logProgress,
    lastCompletionResult,
    clearCompletionResult,
  } = useQuestBoardStore();

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

  if (!user) return null;
  const { character } = user;

  const allQuests = board ? board.categories.flatMap((c) => c.quests) : [];
  const completedCount = allQuests.filter((q) => q.is_completed).length;
  const totalCount = allQuests.length;

  const handleLog = async (questId: string, delta: number) => {
    await logProgress(questId, delta);
  };

  return (
    <div className="h-full w-full flex flex-col justify-between overflow-hidden gap-2 select-none">
      {/* ── ROW 1: CINEMATIC HERO BANNER (Height ~195px, flex-shrink-0) ── */}
      <div className="h-[195px] flex-shrink-0">
        <HeroBanner user={user} board={board} />
      </div>

      {/* ── ROW 2: 5 KPI METRIC CARDS (Height ~65px, flex-shrink-0) ───── */}
      <div className="h-[65px] flex-shrink-0 grid grid-cols-5 gap-2">
        <KpiCard
          label="QUESTS COMPLETED"
          value={`${completedCount} / ${totalCount}`}
          icon={ClipboardList}
          trend={board ? `${Math.round(board.completion_percent)}% to next` : "22% to next"}
          trendUp={false}
          accentClass="text-arc-300"
          glowClass="shadow-glow-arc-sm"
          iconBgClass="from-purple-600 to-purple-950"
        />
        <KpiCard
          label="DAILY XP"
          value={`${character.current_xp.toLocaleString()}`}
          customIcon={<span className="font-mono text-[9px] font-bold text-blue-300">XP</span>}
          trend={`↑ ${Math.round(character.xp_progress_percent || 74)}% from yesterday`}
          trendUp={true}
          accentClass="text-blue-400"
          glowClass="shadow-glow-cyan"
          iconBgClass="from-blue-600 to-blue-950"
        />
        <KpiCard
          label="OVERALL PROGRESS"
          value={`${Math.round(character.xp_progress_percent || 74)}%`}
          icon={TrendingUp}
          trend={`↑ Level ${character.level}`}
          trendUp={true}
          accentClass="text-cyan-400"
          glowClass="shadow-glow-cyan"
          iconBgClass="from-cyan-600 to-cyan-950"
        />
        <KpiCard
          label="STREAK"
          value={`${character.current_streak_days} Days`}
          icon={Flame}
          trend="Keep it up!"
          trendUp={true}
          accentClass="text-amber-400"
          glowClass="shadow-glow-amber"
          iconBgClass="from-orange-600 to-orange-950"
        />
        <KpiCard
          label="CREDITS"
          value="15,850"
          icon={DollarSign}
          trend="Unlimited Plan"
          trendUp={false}
          accentClass="text-amber-300"
          glowClass="shadow-glow-amber"
          iconBgClass="from-amber-600 to-amber-950"
        />
      </div>

      {/* ── ROW 3: DAILY QUESTS (57%) + SYSTEM OVERVIEW (43%) (Flex 1) ─ */}
      <div className="flex-1 min-h-[220px] grid grid-cols-12 gap-2 overflow-hidden">
        {/* Daily Quests Panel — 7/12 (~58% width) */}
        <div className="col-span-7 hud-panel p-2.5 flex flex-col justify-between min-h-0 overflow-hidden bg-[#0A051A]/85 border border-arc-500/30 rounded-xl" id="daily-quests">
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="font-display text-xs font-bold tracking-wider text-white">
                  DAILY QUESTS
                </h2>
                <p className="font-mono text-[8px] text-arc-400/70 mt-0.5">
                  Complete your quests and level up.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[8px] text-ink-secondary">
                  {completedCount}/{totalCount} Completed
                </span>
                <Link
                  href="/quests"
                  className="flex items-center gap-1 rounded border border-arc-500/25 bg-arc-500/10 px-2 py-0.5 font-mono text-[7px] text-arc-300 hover:bg-arc-500/20"
                >
                  FULL LOG <ArrowRight className="h-2 w-2" />
                </Link>
              </div>
            </div>

            <div className="mt-1 h-1 w-full flex-shrink-0 rounded-full bg-void-deep overflow-hidden border border-arc-500/20">
              <div
                className="h-full rounded-full bg-stat-bar-arc shadow-glow-arc-sm transition-all duration-700"
                style={{ width: `${board?.completion_percent ?? 22}%` }}
              />
            </div>

            {/* Quest list */}
            {isLoading && !board ? (
              <div className="flex items-center justify-center flex-1">
                <Loader2 className="h-4 w-4 animate-spin text-arc-400" />
              </div>
            ) : allQuests.length > 0 ? (
              <div className="mt-1.5 flex-1 min-h-0 space-y-1 overflow-y-auto pr-1 scrollbar-thin">
                {allQuests.map((quest) => (
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
            className="block text-center font-mono text-[8px] text-arc-400 hover:text-arc-300 pt-1 border-t border-arc-500/15 flex-shrink-0 mt-1"
          >
            VIEW ALL QUESTS →
          </Link>
        </div>

        {/* System Overview Panel — 5/12 (~42% width) */}
        <div className="col-span-5 min-h-0 overflow-hidden">
          <SystemOverviewPanel
            xpProgressPercent={character.xp_progress_percent}
            activeBoost="2.1x XP"
          />
        </div>
      </div>

      {/* ── ROW 4: ARC PROJECTION (Height ~75px, flex-shrink-0) ─────────── */}
      <div className="h-[75px] flex-shrink-0">
        <ArcProjectionPanel />
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
