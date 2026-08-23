"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface SystemOverviewPanelProps {
  xpProgressPercent: number;
  activeBoost?: string | null;
}

/** Animated ASCEND CORE orb with orbital rings and electric arcs */
function AscendCore({ xpPercent }: { xpPercent: number }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 min-h-0 py-1">
      {/* Core header */}
      <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-arc-500/60 mb-1">Ascend Core</p>

      {/* Orb container */}
      <div className="relative flex items-center justify-center" style={{ width: 100, height: 100 }}>
        {/* Outermost ring */}
        <svg className="absolute inset-0 core-ring-outer" width="100" height="100" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="46" stroke="rgba(139,92,246,0.18)" strokeWidth="1" fill="none" strokeDasharray="3 5" />
          {[0, 60, 120, 180, 240, 300].map((deg) => {
            const r = 46;
            const rad = (deg * Math.PI) / 180;
            const x = 50 + r * Math.cos(rad);
            const y = 50 + r * Math.sin(rad);
            return <circle key={deg} cx={x} cy={y} r="2" fill="rgba(162,143,255,0.6)" />;
          })}
        </svg>

        {/* Middle orbital ring */}
        <svg className="absolute inset-0 core-ring-mid" width="100" height="100" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="36" stroke="rgba(139,92,246,0.25)" strokeWidth="1.2" fill="none" strokeDasharray="6 3" />
        </svg>

        {/* Electric arc SVG */}
        <svg className="absolute inset-0" width="100" height="100" viewBox="0 0 100 100">
          <path
            d="M50 14 C60 18 66 30 62 40 C58 50 66 55 62 65"
            stroke="rgba(162,143,255,0.6)"
            strokeWidth="1.2"
            fill="none"
            strokeDasharray="60"
            style={{ animation: "arc-draw 2.5s ease-in-out infinite" }}
          />
          <path
            d="M50 86 C40 82 34 70 38 60 C42 50 34 45 38 35"
            stroke="rgba(109,40,217,0.5)"
            strokeWidth="1.2"
            fill="none"
            strokeDasharray="60"
            style={{ animation: "arc-draw 2.5s ease-in-out infinite 1.25s" }}
          />
        </svg>

        {/* Inner ring */}
        <svg className="absolute inset-0 core-ring-inner" width="100" height="100" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="26" stroke="rgba(139,92,246,0.3)" strokeWidth="1" fill="none" strokeDasharray="4 2" />
        </svg>

        {/* Core orb center */}
        <div
          className="relative flex flex-col items-center justify-center rounded-full text-center gpu-accelerate"
          style={{
            width: 54,
            height: 54,
            background: "radial-gradient(circle, rgba(162,143,255,0.85) 0%, rgba(139,92,246,0.6) 30%, rgba(109,40,217,0.5) 60%, rgba(46,16,101,0.9) 100%)",
            boxShadow: "0 0 24px rgba(139,92,246,0.6), 0 0 48px rgba(139,92,246,0.25), inset 0 0 16px rgba(162,143,255,0.15)",
            animation: "core-breathe 5s ease-in-out infinite",
          }}
        >
          <span className="font-mono text-[7px] uppercase tracking-widest text-arc-200/80 leading-none">ASCEND CORE</span>
          <span className="font-mono text-[6px] text-emerald-400 font-semibold leading-tight">System Online</span>
          <span className="font-display text-sm font-bold text-white text-glow-arc leading-none mt-0.5">
            {Math.round(xpPercent)}%
          </span>
        </div>
      </div>
    </div>
  );
}

export function SystemOverviewPanel({ xpProgressPercent, activeBoost }: SystemOverviewPanelProps) {
  const [ping, setPing] = useState<string>("32ms");

  useEffect(() => {
    const pingStart = Date.now();
    fetch("/api/health").catch(() => {}).finally(() => {
      const ms = Date.now() - pingStart;
      if (ms > 0 && ms < 500) setPing(`${ms}ms`);
    });
  }, []);

  return (
    <div className="hud-panel p-2.5 h-full flex flex-col justify-between overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <h3 className="font-display text-xs font-bold tracking-wider text-white">SYSTEM OVERVIEW</h3>
        <span className="system-label text-[8px]">STATUS</span>
      </div>

      {/* ASCEND Core reactor orb */}
      <AscendCore xpPercent={xpProgressPercent} />

      {/* 4 Telemetry Boxes at Bottom (Exact match to reference screenshot) */}
      <div className="grid grid-cols-4 gap-1 pt-1.5 border-t border-arc-500/15 flex-shrink-0">
        <div className="rounded border border-arc-500/15 bg-void/60 p-1 text-center">
          <p className="font-mono text-[7px] text-ink-faint uppercase tracking-wider">ACTIVE</p>
          <p className="font-mono text-[9px] font-bold text-amber-400 truncate">{activeBoost ?? "2.1x XP"}</p>
        </div>
        <div className="rounded border border-arc-500/15 bg-void/60 p-1 text-center">
          <p className="font-mono text-[7px] text-ink-faint uppercase tracking-wider">SERVER STATUS</p>
          <p className="font-mono text-[9px] font-bold text-emerald-400 truncate">Online</p>
        </div>
        <div className="rounded border border-arc-500/15 bg-void/60 p-1 text-center">
          <p className="font-mono text-[7px] text-ink-faint uppercase tracking-wider">STORAGE USED</p>
          <p className="font-mono text-[9px] font-bold text-arc-300 truncate">46%</p>
        </div>
        <div className="rounded border border-arc-500/15 bg-void/60 p-1 text-center">
          <p className="font-mono text-[7px] text-ink-faint uppercase tracking-wider">PING</p>
          <p className="font-mono text-[9px] font-bold text-cyan-300 truncate">{ping}</p>
        </div>
      </div>
    </div>
  );
}
