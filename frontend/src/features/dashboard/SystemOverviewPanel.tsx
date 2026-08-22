"use client";

import { useEffect, useState } from "react";
import { achievementApi } from "@/lib/api";
import type { Achievement } from "@/types";
import { cn } from "@/lib/utils";
import Link from "next/link";

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

/** Animated ASCEND CORE orb with orbital rings and electric arcs */
function AscendCore({ xpPercent }: { xpPercent: number }) {
  return (
    <div className="flex flex-col items-center gap-2 py-1">
      {/* Core header */}
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-arc-500/60">Ascend Core</p>

      {/* Orb container */}
      <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
        {/* Outermost decorative ring — slow spin */}
        <svg className="absolute inset-0 core-ring-outer" width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="56" stroke="rgba(139,92,246,0.15)" strokeWidth="1" fill="none"
            strokeDasharray="3 5" />
          {/* Energy node dots */}
          {[0, 60, 120, 180, 240, 300].map((deg) => {
            const r = 56;
            const rad = (deg * Math.PI) / 180;
            const x = 60 + r * Math.cos(rad);
            const y = 60 + r * Math.sin(rad);
            return <circle key={deg} cx={x} cy={y} r="2.5" fill="rgba(162,143,255,0.5)" />;
          })}
        </svg>

        {/* Middle orbital ring — reverse spin */}
        <svg className="absolute inset-0 core-ring-mid" width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="44" stroke="rgba(139,92,246,0.25)" strokeWidth="1.5" fill="none"
            strokeDasharray="8 4" />
        </svg>

        {/* Electric arc SVG — animated stroke-dashoffset */}
        <svg className="absolute inset-0" width="120" height="120" viewBox="0 0 120 120">
          <path
            d="M60 16 C72 22 78 36 74 48 C70 60 80 66 76 78"
            stroke="rgba(162,143,255,0.6)"
            strokeWidth="1.5"
            fill="none"
            strokeDasharray="80"
            style={{ animation: "arc-draw 2.5s ease-in-out infinite" }}
          />
          <path
            d="M60 104 C48 98 42 84 46 72 C50 60 40 54 44 42"
            stroke="rgba(109,40,217,0.5)"
            strokeWidth="1.5"
            fill="none"
            strokeDasharray="80"
            style={{ animation: "arc-draw 2.5s ease-in-out infinite 1.25s" }}
          />
        </svg>

        {/* Inner ring — fast spin */}
        <svg className="absolute inset-0 core-ring-inner" width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="32" stroke="rgba(139,92,246,0.3)" strokeWidth="1" fill="none"
            strokeDasharray="6 3" />
        </svg>

        {/* Core orb */}
        <div
          className="relative flex flex-col items-center justify-center rounded-full text-center gpu-accelerate"
          style={{
            width: 68,
            height: 68,
            background: "radial-gradient(circle, rgba(162,143,255,0.85) 0%, rgba(139,92,246,0.6) 30%, rgba(109,40,217,0.5) 60%, rgba(46,16,101,0.9) 100%)",
            boxShadow: "0 0 30px rgba(139,92,246,0.6), 0 0 60px rgba(139,92,246,0.25), inset 0 0 20px rgba(162,143,255,0.15)",
            animation: "core-breathe 5s ease-in-out infinite",
          }}
        >
          <span className="font-mono text-[8px] uppercase tracking-widest text-arc-200/80 leading-none">System</span>
          <span className="font-mono text-[7px] text-emerald-400 font-semibold leading-tight">Online</span>
          <span className="font-display text-base font-bold text-white text-glow-arc leading-none mt-0.5">
            {Math.round(xpPercent)}%
          </span>
        </div>
      </div>

      {/* Core label */}
      <div className="text-center">
        <p className="font-mono text-[9px] text-emerald-400 font-semibold tracking-wider">● System Online</p>
      </div>
    </div>
  );
}

export function SystemOverviewPanel({ xpProgressPercent, activeBoost }: SystemOverviewPanelProps) {
  const [timeStr, setTimeStr] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [ping, setPing] = useState<string>("--");

  useEffect(() => {
    function tick() {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setDateStr(now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Quick ping simulation
  useEffect(() => {
    const pingStart = Date.now();
    fetch("/api/health").catch(() => {}).finally(() => {
      const ms = Date.now() - pingStart;
      setPing(`${ms}ms`);
    });
  }, []);

  return (
    <div className="hud-panel p-3 space-y-3 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xs font-bold tracking-wider text-ink-primary">SYSTEM OVERVIEW</h3>
        <span className="system-label">Status</span>
      </div>

      {/* ASCEND Core */}
      <AscendCore xpPercent={xpProgressPercent} />

      {/* Status rows */}
      <div className="flex-1 space-y-0">
        <StatusRow label="Active Boost" value={activeBoost ?? "None"} valueClass={activeBoost ? "text-amber-400" : "text-ink-faint"} />
        <StatusRow label="Server Status" value="Online" valueClass="text-emerald-400" />
        <StatusRow label="Time" value={timeStr} valueClass="text-cyan-400" />
        <StatusRow label="Date" value={dateStr} />
        <StatusRow label="XP Progress" value={`${Math.round(xpProgressPercent)}%`} valueClass="text-arc-400" />
        <StatusRow label="Ping" value={ping} valueClass="text-arc-300" />
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
        const unlocked = list
          .filter((a) => a.unlocked_at)
          .sort((a, b) => new Date(b.unlocked_at!).getTime() - new Date(a.unlocked_at!).getTime());
        setAchievement(unlocked[0] ?? null);
      })
      .catch(() => setAchievement(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="hud-panel p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xs font-bold tracking-wider text-ink-primary">RECENT ACHIEVEMENT</h3>
        {achievement && (
          <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[8px] text-emerald-400">
            NEW
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-arc-500/30 border-t-arc-400" />
        </div>
      ) : achievement ? (
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 shadow-glow-amber">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-amber-400" fill="currentColor">
              <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display text-xs font-bold text-ink-primary truncate">{achievement.name}</p>
            <p className="font-body text-[11px] text-ink-muted mt-0.5 line-clamp-2">{achievement.description}</p>
            <p className="hud-label mt-1 text-amber-400">+{achievement.xp_reward} XP</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-4 text-center gap-1">
          <div className="h-6 w-6 rounded-full border border-arc-500/20 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="h-3 w-3 text-arc-500/40" fill="currentColor">
              <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 18l-6.2 3.1 1.2-6.9-5-4.9 6.9-1z"/>
            </svg>
          </div>
          <p className="font-mono text-[9px] text-ink-faint">No achievements yet.</p>
        </div>
      )}

      <Link
        href="/achievements"
        className="flex items-center justify-center gap-1 rounded border border-arc-500/20 bg-arc-500/5 px-2 py-1.5 font-mono text-[9px] text-arc-400 hover:bg-arc-500/15 transition-colors"
      >
        VIEW ALL ACHIEVEMENTS →
      </Link>
    </div>
  );
}
