"use client";

import { useEffect, useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle,
  Flame,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuestBoardStore } from "@/store/useQuestBoardStore";
import { useUserStore } from "@/store/useUserStore";

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Simulated per-day activity history — in a real app this would come from the backend
function useActivityHistory(year: number, month: number) {
  const { board } = useQuestBoardStore();
  const user = useUserStore((s) => s.user);

  // Generate plausible activity from streak data
  const activity = useMemo(() => {
    const map: Record<string, number> = {}; // YYYY-MM-DD → completion %
    const today = new Date();
    const streak = user?.character?.current_streak_days ?? 0;

    // Simulate historical streak days with high completion
    for (let i = 0; i < streak; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      map[key] = i === 0 ? (board?.completion_percent ?? 50) : 80 + Math.random() * 20;
    }

    // Simulate some partial days further back
    for (let i = streak; i < streak + 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      map[key] = 20 + Math.random() * 40;
    }

    return map;
  }, [board, user]);

  return activity;
}

function getDayColor(pct: number | undefined): string {
  if (pct === undefined) return "bg-void-deep/60 border-arc-500/10";
  if (pct >= 90) return "bg-emerald-500/80 border-emerald-400/60 shadow-[0_0_6px_rgba(52,211,153,0.4)]";
  if (pct >= 60) return "bg-emerald-700/60 border-emerald-600/40";
  if (pct >= 30) return "bg-amber-600/50 border-amber-500/40";
  return "bg-arc-700/30 border-arc-600/20";
}

export default function CalendarPage() {
  const user = useUserStore((s) => s.user);
  const { board, fetchToday } = useQuestBoardStore();

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(today.toISOString().slice(0, 10));

  const activity = useActivityHistory(viewYear, viewMonth);

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  const selectedActivity = selectedDate ? activity[selectedDate] : undefined;
  const selectedIsToday = selectedDate === today.toISOString().slice(0, 10);

  // Compute streak stats for this month
  const monthKeys = Object.keys(activity).filter((k) => k.startsWith(`${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`));
  const completedDays = monthKeys.filter((k) => (activity[k] ?? 0) >= 90).length;
  const activeDays = monthKeys.filter((k) => (activity[k] ?? 0) >= 30).length;

  return (
    <div className="mx-auto max-w-5xl space-y-4 h-full overflow-y-auto pr-1 scrollbar-thin">
      {/* Header */}
      <div className="hud-panel-elite p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-arc-400" />
            <h1 className="font-display text-lg font-bold tracking-[0.2em] text-white">
              QUEST CALENDAR
            </h1>
          </div>
          <p className="font-mono text-[10px] text-arc-400/70 mt-1">
            Visual record of your daily discipline. Every day counts.
          </p>
        </div>
        {/* Month stats */}
        <div className="flex items-center gap-3">
          <div className="text-center px-3 py-1.5 rounded border border-emerald-500/25 bg-emerald-950/20">
            <p className="font-mono text-[8px] text-emerald-400/70 uppercase">Perfect Days</p>
            <p className="font-display text-lg font-bold text-emerald-400">{completedDays}</p>
          </div>
          <div className="text-center px-3 py-1.5 rounded border border-arc-500/25 bg-arc-950/20">
            <p className="font-mono text-[8px] text-arc-400/70 uppercase">Active Days</p>
            <p className="font-display text-lg font-bold text-arc-300">{activeDays}</p>
          </div>
          <div className="text-center px-3 py-1.5 rounded border border-amber-500/25 bg-amber-950/20">
            <p className="font-mono text-[8px] text-amber-400/70 uppercase">Streak</p>
            <p className="font-display text-lg font-bold text-amber-400">
              {user?.character?.current_streak_days ?? 0}d
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar grid */}
        <div className="lg:col-span-2 hud-panel p-4">
          {/* Month navigator */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-arc-500/20 text-ink-faint hover:text-arc-300 hover:border-arc-400 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-center">
              <p className="font-display text-sm font-bold tracking-wider text-white">
                {MONTHS[viewMonth]}
              </p>
              <p className="font-mono text-[9px] text-arc-400/60">{viewYear}</p>
            </div>
            <button
              onClick={nextMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-arc-500/20 text-ink-faint hover:text-arc-300 hover:border-arc-400 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map((d) => (
              <div key={d} className="text-center font-mono text-[8px] uppercase text-arc-400/50 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="aspect-square" />;
              }
              const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const pct = activity[dateKey];
              const isToday = dateKey === today.toISOString().slice(0, 10);
              const isSelected = dateKey === selectedDate;
              const isFuture = new Date(dateKey) > today;

              return (
                <button
                  key={dateKey}
                  onClick={() => !isFuture && setSelectedDate(dateKey)}
                  disabled={isFuture}
                  className={cn(
                    "aspect-square rounded border text-center flex flex-col items-center justify-center transition-all duration-200 relative",
                    isFuture ? "opacity-25 cursor-not-allowed border-arc-500/10 bg-void/20" : "cursor-pointer",
                    !isFuture && getDayColor(pct),
                    isSelected && !isFuture && "ring-2 ring-arc-400 ring-offset-1 ring-offset-void",
                    isToday && "ring-2 ring-arc-300"
                  )}
                >
                  <span className={cn(
                    "font-mono text-[9px] font-bold leading-none",
                    isToday ? "text-white" : pct !== undefined ? "text-white/90" : "text-ink-faint"
                  )}>
                    {day}
                  </span>
                  {pct !== undefined && (
                    <span className="font-mono text-[6px] text-white/60 leading-none mt-0.5">
                      {Math.round(pct)}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 mt-4 pt-3 border-t border-arc-500/15">
            <span className="font-mono text-[8px] text-ink-faint">Legend:</span>
            {[
              { color: "bg-void-deep/60 border-arc-500/10", label: "No activity" },
              { color: "bg-arc-700/30 border-arc-600/20", label: "< 30%" },
              { color: "bg-amber-600/50 border-amber-500/40", label: "30-60%" },
              { color: "bg-emerald-700/60 border-emerald-600/40", label: "60-90%" },
              { color: "bg-emerald-500/80 border-emerald-400/60", label: "Perfect" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1">
                <div className={cn("h-3 w-3 rounded border", l.color)} />
                <span className="font-mono text-[7px] text-ink-faint">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel: Selected Day Detail */}
        <div className="hud-panel p-4 flex flex-col gap-3">
          <div className="border-b border-arc-500/15 pb-2">
            <h2 className="font-display text-xs font-bold tracking-wider text-white">
              {selectedDate
                ? new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "Select a day"}
            </h2>
          </div>

          {selectedDate && (
            <>
              {/* Completion circle */}
              <div className="flex flex-col items-center gap-2 py-4">
                <div className="relative h-24 w-24">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(139,92,246,0.1)" strokeWidth="2.5" />
                    <circle
                      cx="18" cy="18" r="15.9" fill="none"
                      stroke={selectedActivity !== undefined
                        ? selectedActivity >= 90 ? "#34D399"
                          : selectedActivity >= 60 ? "#6EE7B7"
                          : selectedActivity >= 30 ? "#F59E0B"
                          : "#8B5CF6"
                        : "#1e1b33"}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeDasharray={`${selectedActivity ?? 0} 100`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="font-display text-xl font-bold text-white leading-none">
                      {selectedActivity !== undefined ? `${Math.round(selectedActivity)}%` : "—"}
                    </span>
                    <span className="font-mono text-[7px] text-ink-faint uppercase">
                      {selectedActivity !== undefined ? "Done" : "No data"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedActivity !== undefined && selectedActivity >= 90 ? (
                    <span className="flex items-center gap-1 font-mono text-[9px] text-emerald-400">
                      <CheckCircle className="h-3 w-3" /> Perfect day!
                    </span>
                  ) : selectedActivity !== undefined ? (
                    <span className="font-mono text-[9px] text-amber-400">Partial completion</span>
                  ) : selectedIsToday ? (
                    <span className="font-mono text-[9px] text-arc-400">Today — in progress</span>
                  ) : (
                    <span className="font-mono text-[9px] text-ink-faint">No quest data recorded</span>
                  )}
                </div>
              </div>

              {/* Today's quests if selected === today */}
              {selectedIsToday && board && (
                <div className="flex-1 min-h-0">
                  <p className="font-mono text-[8px] uppercase text-arc-400/70 mb-2 font-bold">
                    Today&apos;s Quests
                  </p>
                  <div className="space-y-1 overflow-y-auto max-h-[280px] scrollbar-thin">
                    {board.categories.flatMap((c) => c.quests).map((q) => (
                      <div
                        key={q.id}
                        className={cn(
                          "flex items-center justify-between rounded border px-2 py-1",
                          q.is_completed
                            ? "border-emerald-500/25 bg-emerald-950/15"
                            : "border-arc-500/15 bg-arc-950/20"
                        )}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          {q.is_completed ? (
                            <CheckCircle className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                          ) : (
                            <div className="h-3 w-3 rounded-full border border-arc-500/40 flex-shrink-0" />
                          )}
                          <span className={cn(
                            "font-body text-[10px] truncate",
                            q.is_completed ? "text-ink-muted line-through" : "text-ink-primary"
                          )}>
                            {q.template.name}
                          </span>
                        </div>
                        <span className="font-mono text-[8px] text-amber-400 flex-shrink-0 ml-1">
                          +{q.xp_reward} XP
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!selectedIsToday && (
                <div className="flex flex-col items-center justify-center flex-1 py-6 gap-2 text-center">
                  <Flame className="h-6 w-6 text-arc-500/30" />
                  <p className="font-mono text-[9px] text-ink-faint">
                    Historical quest log coming soon.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
