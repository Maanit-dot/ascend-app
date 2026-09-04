"use client";

import { useEffect, useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle,
  Flame,
  Plus,
  Clock,
  AlertTriangle,
  Sparkles,
  Trash2,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuestBoardStore } from "@/store/useQuestBoardStore";
import { useUserStore } from "@/store/useUserStore";

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export interface CalendarDeadline {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  category: "exam" | "study" | "fitness" | "project";
  priority: "low" | "medium" | "critical";
  targetTime?: string;
  remindMe: boolean;
  notes?: string;
}

const DEFAULT_DEADLINES: CalendarDeadline[] = [
  {
    id: "d1",
    date: "2026-09-15",
    title: "JEE Advanced Physics Mock Test 1",
    category: "exam",
    priority: "critical",
    targetTime: "09:00 AM",
    remindMe: true,
    notes: "Revise Electrostatics & Thermodynamics formulas",
  },
  {
    id: "d2",
    date: "2026-09-20",
    title: "Chemistry Organic Reactions Submission",
    category: "study",
    priority: "medium",
    targetTime: "06:00 PM",
    remindMe: true,
  },
  {
    id: "d3",
    date: "2026-09-28",
    title: "5km Endurance Run Milestone",
    category: "fitness",
    priority: "low",
    targetTime: "07:00 AM",
    remindMe: true,
  },
];

export default function CalendarPage() {
  const user = useUserStore((s) => s.user);
  const { board, fetchToday } = useQuestBoardStore();

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(today.toISOString().slice(0, 10));

  // Deadlines state
  const [deadlines, setDeadlines] = useState<CalendarDeadline[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ascend_calendar_deadlines");
      if (saved) {
        try { return JSON.parse(saved); } catch { /* ignore */ }
      }
    }
    return DEFAULT_DEADLINES;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<"exam" | "study" | "fitness" | "project">("exam");
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "critical">("critical");
  const [newTime, setNewTime] = useState("09:00 AM");
  const [newNotes, setNewNotes] = useState("");

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ascend_calendar_deadlines", JSON.stringify(deadlines));
    }
  }, [deadlines]);

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

  function handleAddDeadline(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const deadline: CalendarDeadline = {
      id: Date.now().toString(),
      date: selectedDate,
      title: newTitle.trim(),
      category: newCategory,
      priority: newPriority,
      targetTime: newTime,
      remindMe: true,
      notes: newNotes.trim() || undefined,
    };

    setDeadlines((prev) => [...prev, deadline]);
    setNewTitle("");
    setNewNotes("");
    setIsModalOpen(false);
  }

  function handleDeleteDeadline(id: string) {
    setDeadlines((prev) => prev.filter((d) => d.id !== id));
  }

  const selectedDeadlines = deadlines.filter((d) => d.date === selectedDate);
  const selectedIsToday = selectedDate === today.toISOString().slice(0, 10);
  const selectedDateObj = new Date(selectedDate);
  const isFutureDate = selectedDateObj > today;

  return (
    <div className="mx-auto max-w-5xl space-y-4 h-full overflow-y-auto pr-1 scrollbar-thin select-none">
      {/* Header */}
      <div className="hud-panel-elite p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-arc-400" />
            <h1 className="font-display text-lg font-bold tracking-[0.2em] text-white">
              QUEST & DEADLINE CALENDAR
            </h1>
          </div>
          <p className="font-mono text-[10px] text-arc-400/70 mt-1">
            Schedule deadlines on any date. ARC will continuously remind you via HUD notifications.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg border border-arc-400/50 bg-arc-600/30 px-3 py-1.5 font-mono text-[9px] font-bold text-white hover:bg-arc-500/40 shadow-glow-arc-sm transition-all"
        >
          <Plus className="h-3.5 w-3.5 text-arc-300" />
          <span>+ ADD DEADLINE</span>
        </button>
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
              const isToday = dateKey === today.toISOString().slice(0, 10);
              const isSelected = dateKey === selectedDate;
              const hasDeadlines = deadlines.filter((d) => d.date === dateKey);

              return (
                <button
                  key={dateKey}
                  onClick={() => setSelectedDate(dateKey)}
                  className={cn(
                    "aspect-square rounded-lg border text-center flex flex-col items-center justify-between p-1 transition-all duration-200 relative",
                    isSelected
                      ? "border-arc-400 bg-arc-950/60 ring-2 ring-arc-400/80 shadow-glow-arc-sm"
                      : isToday
                      ? "border-arc-500/40 bg-void/90"
                      : "border-arc-500/15 bg-void/50 hover:border-arc-500/40 hover:bg-arc-950/20"
                  )}
                >
                  <span className={cn(
                    "font-mono text-[9px] font-bold leading-none self-start",
                    isToday ? "text-arc-300" : "text-white/90"
                  )}>
                    {day}
                  </span>

                  {/* Deadline Indicator Badges */}
                  {hasDeadlines.length > 0 && (
                    <div className="flex items-center gap-0.5 mt-auto">
                      {hasDeadlines.slice(0, 3).map((dl) => (
                        <span
                          key={dl.id}
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            dl.priority === "critical" ? "bg-crimson-400 shadow-glow-crimson" :
                            dl.priority === "medium" ? "bg-amber-400 shadow-glow-amber" :
                            "bg-cyan-400 shadow-glow-cyan"
                          )}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Details Panel */}
        <div className="hud-panel p-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-arc-500/20 pb-2">
              <div>
                <p className="font-mono text-[8px] text-arc-400/80 uppercase tracking-widest font-bold">
                  {selectedIsToday ? "TODAY'S TARGETS" : isFutureDate ? "FUTURE TARGETS" : "PAST LOG"}
                </p>
                <h3 className="font-display text-sm font-bold text-white mt-0.5">
                  {new Date(selectedDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1 rounded border border-arc-500/30 bg-arc-500/10 px-2 py-1 font-mono text-[8px] text-arc-300 hover:bg-arc-500/20"
              >
                <Plus className="h-2.5 w-2.5" /> ADD
              </button>
            </div>

            {/* Deadlines List */}
            <div className="space-y-2">
              <p className="font-mono text-[8px] text-ink-muted uppercase tracking-wider">Scheduled Deadlines ({selectedDeadlines.length})</p>

              {selectedDeadlines.length === 0 ? (
                <div className="rounded-lg border border-dashed border-arc-500/20 p-4 text-center">
                  <Clock className="h-5 w-5 text-arc-500/30 mx-auto mb-1" />
                  <p className="font-mono text-[8px] text-ink-faint">No deadlines set for this date.</p>
                </div>
              ) : (
                selectedDeadlines.map((dl) => (
                  <div
                    key={dl.id}
                    className="rounded-lg border border-arc-500/20 bg-void/80 p-2.5 space-y-1 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "rounded px-1.5 py-0.5 font-mono text-[6px] font-bold uppercase",
                        dl.priority === "critical" ? "bg-crimson-500/20 text-crimson-300 border border-crimson-500/40" :
                        dl.priority === "medium" ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" :
                        "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      )}>
                        {dl.priority} priority
                      </span>
                      <button
                        onClick={() => handleDeleteDeadline(dl.id)}
                        className="text-ink-faint hover:text-crimson-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>

                    <p className="font-display text-[11px] font-bold text-white">{dl.title}</p>
                    {dl.targetTime && (
                      <p className="font-mono text-[8px] text-arc-400 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" /> {dl.targetTime}
                      </p>
                    )}
                    {dl.notes && (
                      <p className="font-body text-[9px] text-ink-secondary">{dl.notes}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-arc-500/15">
            <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[8px]">
              <Bell className="h-3 w-3 animate-pulse" />
              <span>ARC Active Reminder System Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Deadline Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="hud-panel-elite max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-arc-500/20 pb-2">
              <h3 className="font-display text-sm font-bold text-white tracking-wider">
                ADD DEADLINE / TARGET DATE
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="font-mono text-xs text-ink-faint hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddDeadline} className="space-y-3 font-mono text-[9px]">
              <div>
                <label className="text-arc-400 uppercase tracking-wider block mb-1">Deadline Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Physics Mock Test, Chapter 5 Mastery"
                  className="w-full rounded border border-arc-500/30 bg-void/90 p-2 text-white focus:border-arc-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-arc-400 uppercase tracking-wider block mb-1">Target Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full rounded border border-arc-500/30 bg-void/90 p-2 text-white focus:border-arc-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-arc-400 uppercase tracking-wider block mb-1">Target Time</label>
                  <input
                    type="text"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    placeholder="09:00 AM"
                    className="w-full rounded border border-arc-500/30 bg-void/90 p-2 text-white focus:border-arc-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-arc-400 uppercase tracking-wider block mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full rounded border border-arc-500/30 bg-void/90 p-2 text-white focus:border-arc-400 focus:outline-none"
                  >
                    <option value="critical">🔴 Critical Priority</option>
                    <option value="medium">🟡 Medium Priority</option>
                    <option value="low">🔵 Normal Priority</option>
                  </select>
                </div>
                <div>
                  <label className="text-arc-400 uppercase tracking-wider block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full rounded border border-arc-500/30 bg-void/90 p-2 text-white focus:border-arc-400 focus:outline-none"
                  >
                    <option value="exam">📚 Exam / Test</option>
                    <option value="study">🧪 Study Goal</option>
                    <option value="fitness">⚔️ Fitness Milestone</option>
                    <option value="project">💻 Project Task</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-arc-400 uppercase tracking-wider block mb-1">Notes / Instructions</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Key concepts to revise, target accuracy, etc."
                  rows={2}
                  className="w-full rounded border border-arc-500/30 bg-void/90 p-2 text-white focus:border-arc-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-arc-500/15">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded border border-arc-500/20 px-3 py-1 text-ink-muted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-arc-600 px-4 py-1 text-white font-bold hover:bg-arc-500 shadow-glow-arc-sm transition-all"
                >
                  Save Deadline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
