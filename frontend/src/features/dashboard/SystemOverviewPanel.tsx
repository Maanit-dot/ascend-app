"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuestBoardStore } from "@/store/useQuestBoardStore";
import { useUserStore } from "@/store/useUserStore";

/** Animated ASCEND CORE reactor orb with 3 orbital rings and electric arcs */
function AscendCore({ xpPercent, questPercent }: { xpPercent: number; questPercent: number }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 min-h-0 py-1">
      <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-arc-300 font-bold mb-1">ASCEND CORE</p>

      {/* Reactor Orb container */}
      <div className="relative flex items-center justify-center" style={{ width: 104, height: 104 }}>
        {/* Outermost orbital ring with 8 cyan nodes */}
        <svg className="absolute inset-0 core-ring-outer" width="104" height="104" viewBox="0 0 104 104">
          <circle cx="52" cy="52" r="48" stroke="rgba(168,85,247,0.35)" strokeWidth="1.2" fill="none" strokeDasharray="4 6" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
            const r = 48;
            const rad = (deg * Math.PI) / 180;
            const x = 52 + r * Math.cos(rad);
            const y = 52 + r * Math.sin(rad);
            return <circle key={deg} cx={x} cy={y} r="2" fill="#00E5FF" style={{ filter: "drop-shadow(0 0 4px #00E5FF)" }} />;
          })}
        </svg>

        {/* XP progress arc ring */}
        <svg className="absolute inset-0" width="104" height="104" viewBox="0 0 104 104" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="52" cy="52" r="38" stroke="rgba(139,92,246,0.15)" strokeWidth="3" fill="none" />
          <circle
            cx="52" cy="52" r="38"
            stroke="rgba(139,92,246,0.7)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${(questPercent / 100) * 238.76} 238.76`}
            style={{ filter: "drop-shadow(0 0 4px rgba(139,92,246,0.8))", transition: "stroke-dasharray 1s ease" }}
          />
        </svg>

        {/* Electric arc lightning SVG */}
        <svg className="absolute inset-0" width="104" height="104" viewBox="0 0 104 104">
          <path
            d="M52 12 C64 16 70 30 66 42 C62 54 70 60 66 72"
            stroke="rgba(0,229,255,0.85)"
            strokeWidth="1.5"
            fill="none"
            strokeDasharray="60"
            style={{ animation: "arc-draw 2.5s ease-in-out infinite", filter: "drop-shadow(0 0 6px #00E5FF)" }}
          />
          <path
            d="M52 92 C40 88 34 74 38 62 C42 50 34 44 38 32"
            stroke="rgba(168,85,247,0.85)"
            strokeWidth="1.5"
            fill="none"
            strokeDasharray="60"
            style={{ animation: "arc-draw 2.5s ease-in-out infinite 1.25s", filter: "drop-shadow(0 0 6px #A855F7)" }}
          />
        </svg>

        {/* Inner ring */}
        <svg className="absolute inset-0 core-ring-inner" width="104" height="104" viewBox="0 0 104 104">
          <circle cx="52" cy="52" r="28" stroke="rgba(192,178,255,0.4)" strokeWidth="1" fill="none" strokeDasharray="4 2" />
        </svg>

        {/* Core orb center */}
        <div
          className="relative flex flex-col items-center justify-center rounded-full text-center gpu-accelerate"
          style={{
            width: 58,
            height: 58,
            background: "radial-gradient(circle, rgba(192,178,255,0.95) 0%, rgba(168,85,247,0.8) 30%, rgba(124,58,237,0.6) 60%, rgba(46,16,101,0.95) 100%)",
            boxShadow: "0 0 28px rgba(168,85,247,0.8), 0 0 54px rgba(139,92,246,0.4), inset 0 0 18px rgba(192,178,255,0.3)",
            animation: "core-breathe 5s ease-in-out infinite",
          }}
        >
          <span className="font-mono text-[7px] uppercase tracking-widest text-white font-bold leading-none">ASCEND CORE</span>
          <span className="font-mono text-[6px] text-emerald-400 font-bold leading-tight mt-0.5">System Online</span>
          <span className="font-display text-sm font-bold text-white text-glow-arc leading-none mt-0.5">
            {Math.round(questPercent)}%
          </span>
        </div>
      </div>
    </div>
  );
}

interface SystemOverviewPanelProps {
  xpProgressPercent: number;
  activeBoost?: string | null;
}

export function SystemOverviewPanel({ xpProgressPercent, activeBoost }: SystemOverviewPanelProps) {
  const [ping, setPing] = useState<string>("—");
  const [serverOk, setServerOk] = useState<boolean>(true);
  const board = useQuestBoardStore((s) => s.board);
  const user = useUserStore((s) => s.user);

  // Live ping to backend health endpoint
  useEffect(() => {
    async function measurePing() {
      const t0 = Date.now();
      try {
        await fetch("/api/health");
        setServerOk(true);
        setPing(`${Date.now() - t0}ms`);
      } catch {
        setServerOk(false);
        setPing("—");
      }
    }
    measurePing();
    const id = setInterval(measurePing, 30_000); // refresh every 30s
    return () => clearInterval(id);
  }, []);

  const questPercent = board?.completion_percent ?? 0;
  const totalQuests = board?.categories.flatMap((c) => c.quests).length ?? 0;
  const completedQuests = board?.categories.flatMap((c) => c.quests).filter((q) => q.is_completed).length ?? 0;

  // Rough storage estimate from XP (cosmetic)
  const storageUsed = Math.min(99, Math.round(30 + xpProgressPercent * 0.5));

  return (
    <div className="hud-panel p-2.5 h-full flex flex-col justify-between overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <h3 className="font-display text-xs font-bold tracking-wider text-white">SYSTEM OVERVIEW</h3>
        <span className={`system-label text-[8px] ${serverOk ? "text-emerald-400" : "text-crimson-400"}`}>
          {serverOk ? "● ONLINE" : "● ERROR"}
        </span>
      </div>

      {/* ASCEND Core reactor orb — shows live quest completion % */}
      <AscendCore xpPercent={xpProgressPercent} questPercent={questPercent} />

      {/* Quest completion mini summary */}
      <div className="flex-shrink-0 mb-1">
        <div className="flex items-center justify-between font-mono text-[8px] text-ink-faint mb-0.5">
          <span>Quest Progress</span>
          <span className="text-arc-300 font-bold">{completedQuests}/{totalQuests}</span>
        </div>
        <div className="h-0.5 w-full rounded-full bg-void-deep overflow-hidden">
          <div
            className="h-full rounded-full bg-stat-bar-arc shadow-glow-arc-sm transition-all duration-700"
            style={{ width: `${questPercent}%` }}
          />
        </div>
      </div>

      {/* 4 Telemetry Boxes at Bottom */}
      <div className="grid grid-cols-4 gap-1 pt-1.5 border-t border-arc-500/20 flex-shrink-0">
        <div className="rounded border border-arc-500/20 bg-void/70 p-1 text-center">
          <p className="font-mono text-[7px] text-ink-muted uppercase tracking-wider font-semibold">ACTIVE</p>
          <p className="font-mono text-[9px] font-bold text-amber-400 truncate">{activeBoost ?? "2.1x XP"}</p>
        </div>
        <div className="rounded border border-arc-500/20 bg-void/70 p-1 text-center">
          <p className="font-mono text-[7px] text-ink-muted uppercase tracking-wider font-semibold">SERVER</p>
          <p className={`font-mono text-[9px] font-bold truncate ${serverOk ? "text-emerald-400" : "text-crimson-400"}`}>
            {serverOk ? "Online" : "Down"}
          </p>
        </div>
        <div className="rounded border border-arc-500/20 bg-void/70 p-1 text-center">
          <p className="font-mono text-[7px] text-ink-muted uppercase tracking-wider font-semibold">XP%</p>
          <p className="font-mono text-[9px] font-bold text-arc-300 truncate">{Math.round(xpProgressPercent)}%</p>
        </div>
        <div className="rounded border border-arc-500/20 bg-void/70 p-1 text-center">
          <p className="font-mono text-[7px] text-ink-muted uppercase tracking-wider font-semibold">PING</p>
          <p className="font-mono text-[9px] font-bold text-cyan-300 truncate">{ping}</p>
        </div>
      </div>

      {/* Link to statistics */}
      <Link
        href="/statistics"
        className="block text-center font-mono text-[8px] text-arc-400 hover:text-arc-300 pt-1 border-t border-arc-500/10 flex-shrink-0 mt-1"
      >
        FULL STATS →
      </Link>
    </div>
  );
}
