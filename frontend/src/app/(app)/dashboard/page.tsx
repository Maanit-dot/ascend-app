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
import { formatQuestValue, getHunterRank } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { QuestInstance } from "@/types";

/* ── Inline Quest Row (styled with cohesive 5-color Ascend Sphere palette) ─────── */
function DashboardQuestRow({
  quest,
  onLog,
}: {
  quest: QuestInstance;
  onLog: (questId: string, delta: number) => Promise<void>;
}) {
  const Icon = resolveIcon(quest.template.icon_key);
  const percent = Math.min(100, (quest.current_value / quest.target_value) * 100);

  return (
    <div
      className={cn(
        "relative group rounded-lg px-2 py-1 transition-all duration-200 select-none border",
        "bg-gradient-to-r from-[#0C081D]/95 via-[#160B35]/90 to-[#0C081D]/95",
        "border-[#2614DF]/30 hover:border-[#01C0D7]/60 shadow-[0_0_8px_rgba(38,20,223,0.12)] hover:shadow-[0_0_12px_rgba(1,192,215,0.25)]",
        quest.is_completed && "opacity-75 border-[#2614DF]/20"
      )}
    >
      <div className="flex items-center gap-2">
        {/* Clickable Quick-Check Circle */}
        <button
          type="button"
          onClick={() => !quest.is_completed && onLog(quest.id, quest.target_value - quest.current_value)}
          disabled={quest.is_completed}
          className={cn(
            "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg transition-all border",
            quest.is_completed
              ? "bg-[#01C0D7]/20 border-[#01C0D7]/50 text-[#00E5FF] shadow-[0_0_8px_rgba(1,192,215,0.3)]"
              : "bg-[#0C081D] border-[#2614DF]/40 text-[#00E5FF] hover:bg-[#2614DF]/30 hover:border-[#01C0D7]/60 hover:text-[#E8EEFF] cursor-pointer shadow-[0_0_6px_rgba(38,20,223,0.25)]"
          )}
          title={quest.is_completed ? "Quest Completed" : "Click to mark Done"}
        >
          {quest.is_completed ? (
            <CheckCircle className="h-3.5 w-3.5" />
          ) : (
            <Icon className="h-3.5 w-3.5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <p
              className={cn(
                "font-display text-[10px] font-semibold truncate",
                quest.is_completed ? "text-[#C0BEEF]/50 line-through" : "text-white group-hover:text-[#E8EEFF]"
              )}
            >
              {quest.template.name}
            </p>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="font-mono text-[8px] font-bold text-[#00E5FF] bg-[#2614DF]/25 border border-[#01C0D7]/30 px-1.5 py-0.5 rounded shadow-[0_0_6px_rgba(1,192,215,0.2)]">
                +{quest.xp_reward} XP
              </span>

              {/* Done / Complete Action Button */}
              {quest.is_completed ? (
                <span className="rounded bg-[#01C0D7]/20 border border-[#01C0D7]/40 px-1.5 py-0.5 font-mono text-[7px] text-[#00E5FF] font-bold flex items-center gap-0.5 shadow-[0_0_6px_rgba(1,192,215,0.25)]">
                  ✓ Done
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onLog(quest.id, quest.target_value - quest.current_value)}
                  className="rounded bg-gradient-to-r from-[#2614DF]/60 to-[#4D30EC]/60 px-1.5 py-0.5 font-mono text-[7px] text-[#E8EEFF] font-bold border border-[#01C0D7]/40 hover:from-[#2614DF] hover:to-[#01C0D7] hover:text-white transition-all shadow-[0_0_8px_rgba(38,20,223,0.4)] cursor-pointer"
                >
                  Done
                </button>
              )}
            </div>
          </div>

          <div className="mt-0.5 flex items-center justify-between font-mono text-[7px] text-[#C0BEEF]/70">
            <span>{formatQuestValue(quest.current_value, quest.template.unit)} / {formatQuestValue(quest.target_value, quest.template.unit)}</span>
          </div>

          <div className="mt-0.5 h-1 w-full rounded-full bg-[#0C081D] border border-[#2614DF]/25 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#2614DF] via-[#4D30EC] to-[#01C0D7] shadow-[0_0_6px_rgba(1,192,215,0.6)] transition-all duration-500"
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
    <div className="w-full max-w-[864px] 2xl:max-w-[1205px] mx-auto flex flex-col gap-2 2xl:gap-3.5 select-none min-h-full pb-4">
      {/* ── ROW 1: CINEMATIC HERO BANNER (Normal: 185px | F11: 258px) ── */}
      <div className="h-[185px] 2xl:h-[258px] flex-shrink-0">
        <HeroBanner user={user} board={board} />
      </div>

      {/* ── ROW 2: 5 KPI METRIC CARDS (Normal: 60px | F11: 75px) ───── */}
      <div className="relative h-[60px] 2xl:h-[75px] flex-shrink-0 rounded-xl overflow-hidden p-0.5 bg-gradient-to-r from-[#0C081D] via-[#2614DF]/25 to-[#0C081D] border border-[#2614DF]/40 shadow-[0_0_15px_rgba(38,20,223,0.25)]">
        {/* Ambient 5-color background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0C081D]/90 via-[#4D30EC]/20 via-[#2614DF]/25 to-[#01C0D7]/20 pointer-events-none" />
        <div className="relative z-10 grid grid-cols-5 gap-1.5 2xl:gap-2.5 h-full">
          <KpiCard
            label="QUESTS COMPLETED"
            value={`${completedCount} / ${totalCount}`}
            icon={ClipboardList}
            trend={board ? `${Math.round(board.completion_percent)}% to next` : "22% to next"}
            trendUp={false}
            accentClass="text-[#E8EEFF]"
            glowClass="shadow-[0_0_10px_rgba(1,192,215,0.4)]"
            iconBgClass="from-[#2614DF] to-[#01C0D7]"
            cardBgClass="bg-gradient-to-br from-[#0C081D]/95 via-[#160B35]/90 to-[#2614DF]/15"
          />
          <KpiCard
            label="DAILY XP"
            value={`${character.current_xp.toLocaleString()}`}
            customIcon={<span className="font-mono text-[9px] 2xl:text-[11px] font-bold text-[#E8EEFF]">XP</span>}
            trend={`↑ ${Math.round(character.xp_progress_percent || 74)}% from yesterday`}
            trendUp={true}
            accentClass="text-[#00E5FF]"
            glowClass="shadow-[0_0_10px_rgba(38,20,223,0.5)]"
            iconBgClass="from-[#2614DF] to-[#4D30EC]"
            cardBgClass="bg-gradient-to-br from-[#0C081D]/95 via-[#1A0B40]/90 to-[#4D30EC]/20"
          />
          <KpiCard
            label="OVERALL PROGRESS"
            value={`${Math.round(character.xp_progress_percent || 74)}%`}
            icon={TrendingUp}
            trend={`↑ Level ${character.level}`}
            trendUp={true}
            accentClass="text-[#E8EEFF]"
            glowClass="shadow-[0_0_10px_rgba(1,192,215,0.5)]"
            iconBgClass="from-[#4D30EC] to-[#01C0D7]"
            cardBgClass="bg-gradient-to-br from-[#0C081D]/95 via-[#160B35]/90 to-[#01C0D7]/15"
          />
          <KpiCard
            label="STREAK"
            value={`${character.current_streak_days} Days`}
            icon={Flame}
            trend="Keep it up!"
            trendUp={true}
            accentClass="text-[#C0BEEF]"
            glowClass="shadow-[0_0_10px_rgba(77,48,236,0.5)]"
            iconBgClass="from-[#4D30EC] to-[#2614DF]"
            cardBgClass="bg-gradient-to-br from-[#0C081D]/95 via-[#160B35]/90 to-[#4D30EC]/20"
          />
          <KpiCard
            label="TOTAL XP"
            value={`${(character.total_xp_earned || (character.current_xp + (character.level - 1) * 1500)).toLocaleString()}`}
            icon={Zap}
            trend={`Rank ${getHunterRank(character.level)} Hunter`}
            trendUp={true}
            accentClass="text-[#00E5FF]"
            glowClass="shadow-[0_0_10px_rgba(1,192,215,0.5)]"
            iconBgClass="from-[#01C0D7] to-[#2614DF]"
            cardBgClass="bg-gradient-to-br from-[#0C081D]/95 via-[#1A0B40]/90 to-[#01C0D7]/20"
          />
        </div>
      </div>

      {/* ── ROW 3: DAILY QUESTS (325px/453px) + SYSTEM OVERVIEW (527px/735px) (Normal: 269px | F11: 375px) ─ */}
      <div className="h-[269px] 2xl:h-[375px] grid grid-cols-12 gap-2 2xl:gap-3.5 overflow-hidden flex-shrink-0">
        {/* Daily Quests Panel — 5/12 (~38% width: 325px / 453px) */}
        <div className="col-span-5 hud-panel relative p-2.5 2xl:p-3.5 flex flex-col justify-between min-h-0 overflow-hidden bg-[#0C081D]/95 rounded-xl border border-[#2614DF]/30 shadow-[0_0_15px_rgba(38,20,223,0.15)]" id="daily-quests">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/custom_bg/daily_quests_bg.png"
            alt="Daily Quests Background"
            className="absolute inset-0 h-full w-full object-cover object-center pointer-events-none opacity-30 z-0"
          />
          <div className="relative z-10 flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="font-display text-xs 2xl:text-sm font-bold tracking-wider text-white">
                  DAILY QUESTS
                </h2>
                <p className="font-mono text-[8px] 2xl:text-[10px] text-arc-400/70 mt-0.5">
                  Complete your quests and level up.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[8px] 2xl:text-[10px] text-ink-secondary">
                  {completedCount}/{totalCount} Completed
                </span>
                <Link
                  href="/quests"
                  className="flex items-center gap-1 rounded bg-arc-500/10 px-2 py-0.5 font-mono text-[7px] 2xl:text-[9px] text-arc-300 hover:bg-arc-500/20"
                >
                  FULL LOG <ArrowRight className="h-2 w-2" />
                </Link>
              </div>
            </div>

            <div className="mt-1 2xl:mt-1.5 h-1 2xl:h-1.5 w-full flex-shrink-0 rounded-full bg-[#0C081D] border border-[#2614DF]/30 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#2614DF] via-[#4D30EC] to-[#01C0D7] shadow-[0_0_10px_rgba(1,192,215,0.6)] transition-all duration-700"
                style={{ width: `${board?.completion_percent ?? 22}%` }}
              />
            </div>

            {/* Quest list */}
            {isLoading && !board ? (
              <div className="flex items-center justify-center flex-1">
                <Loader2 className="h-4 w-4 animate-spin text-arc-400" />
              </div>
            ) : allQuests.length > 0 ? (
              <div className="mt-1.5 2xl:mt-2.5 flex-1 min-h-0 space-y-1 2xl:space-y-1.5 overflow-y-auto pr-1 scrollbar-thin">
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
            className="block text-center font-mono text-[8px] 2xl:text-[10px] text-arc-400 hover:text-arc-300 pt-1 flex-shrink-0 mt-1"
          >
            VIEW ALL QUESTS →
          </Link>
        </div>

        {/* System Overview Panel — 7/12 (~62% width: 527px / 735px) */}
        <div className="col-span-7 min-h-0 overflow-hidden h-full">
          <SystemOverviewPanel
            xpProgressPercent={character.xp_progress_percent}
            activeBoost="2.1x XP"
          />
        </div>
      </div>

      {/* ── ROW 4: ARC PROJECTION (Normal: 96px | F11: 134px) ─────────── */}
      <div className="h-[96px] 2xl:h-[134px] flex-shrink-0">
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
