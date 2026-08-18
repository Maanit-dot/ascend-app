"use client";

import { useEffect, useState } from "react";
import { Shield, Zap, Clock, Calendar, Activity } from "lucide-react";
import { achievementApi } from "@/lib/api";
import type { Achievement } from "@/types";
import { cn } from "@/lib/utils";

function StatusRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-arc-500/10 last:border-0">
      <span className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">{label}</span>
      <span className={cn("font-mono text-[10px] font-semibold", valueClass ?? "text-ink-secondary")}>
        {value}
      </span>
    </div>
  );
}

interface SystemOverviewPanelProps {
  xpProgressPercent: number;
  activeBoost?: string | null;
}

export function SystemOverviewPanel({ xpProgressPercent, activeBoost }: SystemOverviewPanelProps) {
  const [timeStr, setTimeStr] = useState("");
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    function tick() {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setDateStr(now.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="hud-panel p-4 space-y-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-bold tracking-wider text-ink-primary">SYSTEM OVERVIEW</h3>
        <span className="system-label">Status</span>
      </div>

      {/* ASCEND emblem */}
      <div className="flex justify-center py-2">
        <div className="relative flex h-20 w-20 items-center justify-center">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-2 border-arc-500/30 animate-spin-slow" />
          <div className="absolute inset-1 rounded-full border border-arc-400/20 animate-spin-reverse" />
          {/* Inner emblem */}
          <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-arc-700/60 to-arc-950/80 border border-arc-500/40 shadow-glow-arc animate-orb-pulse">
            <svg viewBox="0 0 40 40" className="h-8 w-8" fill="none">
              <path d="M20 4L36 20L20 36L4 20L20 4Z" stroke="rgba(162,143,255,0.6)" strokeWidth="1" fill="rgba(139,92,246,0.15)" />
              <path d="M20 10L30 20L20 30L10 20L20 10Z" fill="rgba(162,143,255,0.5)" />
            </svg>
          </div>
        </div>
      </div>

      {/* Status rows */}
      <div className="space-y-0">
        <StatusRow label="System Status" value="ONLINE" valueClass="text-emerald-400" />
        <StatusRow
          label="Active Boost"
          value={activeBoost ?? "None"}
          valueClass={activeBoost ? "text-amber-400" : "text-ink-faint"}
        />
        <StatusRow label="Time" value={timeStr} valueClass="text-cyan-400" />
        <StatusRow label="Date" value={dateStr} />
        <StatusRow
          label="XP Progress"
          value={`${Math.round(xpProgressPercent)}%`}
          valueClass="text-arc-400"
        />
      </div>

      {/* Progress bar */}
      <div>
        <div className="h-1.5 w-full rounded-full bg-void-deep overflow-hidden">
          <div
            className="h-full rounded-full bg-stat-bar-arc shadow-glow-arc-sm transition-all duration-700"
            style={{ width: `${xpProgressPercent}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between font-mono text-[8px] text-ink-faint">
          <span>Overall Progress</span>
          <span>{Math.round(xpProgressPercent)}%</span>
        </div>
      </div>
    </div>
  );
}

/* ── Recent Achievement Panel ─────────────────────────────────── */

export function RecentAchievementPanel() {
  const [achievement, setAchievement] = useState<Achievement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    achievementApi
      .list()
      .then((list) => {
        // Find most recently unlocked
        const unlocked = list
          .filter((a) => a.unlocked_at)
          .sort((a, b) => new Date(b.unlocked_at!).getTime() - new Date(a.unlocked_at!).getTime());
        setAchievement(unlocked[0] ?? null);
      })
      .catch(() => setAchievement(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="hud-panel p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-bold tracking-wider text-ink-primary">RECENT ACHIEVEMENT</h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-arc-500/30 border-t-arc-400" />
        </div>
      ) : achievement ? (
        <div className="flex items-start gap-3">
          {/* Trophy icon */}
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 shadow-glow-amber">
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-amber-400" fill="currentColor">
              <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display text-sm font-bold text-ink-primary truncate">{achievement.name}</p>
            <p className="font-body text-xs text-ink-muted mt-0.5 line-clamp-2">{achievement.description}</p>
            <p className="hud-label mt-1.5 text-amber-400">+{achievement.xp_reward} XP</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
          <Activity className="h-8 w-8 text-arc-500/30" />
          <p className="font-mono text-[10px] text-ink-faint">No achievements unlocked yet.</p>
          <p className="font-mono text-[9px] text-arc-500/50">Complete quests to earn milestones.</p>
        </div>
      )}
    </div>
  );
}
