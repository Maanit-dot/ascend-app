"use client";

import { useEffect, useState } from "react";
import { useQuestBoardStore } from "@/store/useQuestBoardStore";
import { useUserStore } from "@/store/useUserStore";

/** Animated ASCEND CORE reactor orb with 3 orbital rings and electric arcs */
function AscendCore({ xpPercent, questPercent }: { xpPercent: number; questPercent: number }) {
  return (
    <div className="relative flex flex-col items-center justify-center flex-shrink-0" style={{ width: 112, height: 112 }}>
      {/* Outermost orbital ring with 8 cyan nodes */}
      <svg className="absolute inset-0 core-ring-outer" width="112" height="112" viewBox="0 0 112 112">
        <circle cx="56" cy="56" r="52" stroke="rgba(168,85,247,0.35)" strokeWidth="1.2" fill="none" strokeDasharray="4 6" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
          const r = 52;
          const rad = (deg * Math.PI) / 180;
          const x = 56 + r * Math.cos(rad);
          const y = 56 + r * Math.sin(rad);
          return <circle key={deg} cx={x} cy={y} r="2" fill="#00E5FF" style={{ filter: "drop-shadow(0 0 4px #00E5FF)" }} />;
        })}
      </svg>

      {/* XP progress arc ring */}
      <svg className="absolute inset-0" width="112" height="112" viewBox="0 0 112 112" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="56" cy="56" r="42" stroke="rgba(139,92,246,0.15)" strokeWidth="3" fill="none" />
        <circle
          cx="56" cy="56" r="42"
          stroke="rgba(139,92,246,0.85)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${(questPercent / 100) * 263.89} 263.89`}
          style={{ filter: "drop-shadow(0 0 6px rgba(139,92,246,0.9))", transition: "stroke-dasharray 1s ease" }}
        />
      </svg>

      {/* Electric arc lightning SVG */}
      <svg className="absolute inset-0" width="112" height="112" viewBox="0 0 112 112">
        <path
          d="M56 14 C68 18 76 32 72 46 C68 58 76 64 72 78"
          stroke="rgba(0,229,255,0.85)"
          strokeWidth="1.5"
          fill="none"
          strokeDasharray="60"
          style={{ animation: "arc-draw 2.5s ease-in-out infinite", filter: "drop-shadow(0 0 6px #00E5FF)" }}
        />
        <path
          d="M56 98 C44 94 36 80 40 66 C44 54 36 48 40 34"
          stroke="rgba(168,85,247,0.85)"
          strokeWidth="1.5"
          fill="none"
          strokeDasharray="60"
          style={{ animation: "arc-draw 2.5s ease-in-out infinite 1.25s", filter: "drop-shadow(0 0 6px #A855F7)" }}
        />
      </svg>

      {/* Inner rotating ring */}
      <svg className="absolute inset-0 core-ring-inner" width="112" height="112" viewBox="0 0 112 112">
        <circle cx="56" cy="56" r="32" stroke="rgba(192,178,255,0.4)" strokeWidth="1" fill="none" strokeDasharray="4 2" />
      </svg>

      {/* Central Core sphere */}
      <div
        className="relative flex flex-col items-center justify-center rounded-full text-center gpu-accelerate"
        style={{
          width: 62,
          height: 62,
          background: "radial-gradient(circle, rgba(192,178,255,0.95) 0%, rgba(168,85,247,0.8) 30%, rgba(124,58,237,0.6) 60%, rgba(46,16,101,0.95) 100%)",
          boxShadow: "0 0 28px rgba(168,85,247,0.8), 0 0 54px rgba(139,92,246,0.4), inset 0 0 18px rgba(192,178,255,0.3)",
          animation: "core-breathe 5s ease-in-out infinite",
        }}
      >
        <span className="font-mono text-[7px] uppercase tracking-widest text-white font-bold leading-none">ASCEND CORE</span>
        <span className="font-mono text-[6px] text-emerald-400 font-bold leading-tight mt-0.5">System Online</span>
        <span className="font-display text-base font-bold text-white text-glow-arc leading-none mt-0.5">
          {Math.round(questPercent || 100)}%
        </span>
      </div>
    </div>
  );
}

interface SystemOverviewPanelProps {
  xpProgressPercent: number;
  activeBoost?: string | null;
}

export function SystemOverviewPanel({ xpProgressPercent, activeBoost }: SystemOverviewPanelProps) {
  const [ping, setPing] = useState<string>("32ms");
  const [serverOk, setServerOk] = useState<boolean>(true);
  const board = useQuestBoardStore((s) => s.board);

  const questPercent = board?.completion_percent ?? 100;
  const storageUsed = Math.min(99, Math.round(30 + xpProgressPercent * 0.25));

  return (
    <div className="hud-panel p-2.5 h-full flex flex-col justify-between overflow-hidden bg-[#0A051A]/85 border border-arc-500/30 rounded-xl select-none">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <h3 className="font-display text-xs font-bold tracking-wider text-white">SYSTEM OVERVIEW</h3>
        <span className="font-mono text-[8px] text-emerald-400 font-semibold flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Online
        </span>
      </div>

      {/* Middle Section: Reactor Core on Left + Telemetry List on Right */}
      <div className="flex items-center justify-between gap-3 my-auto min-h-0">
        {/* Core Reactor */}
        <AscendCore xpPercent={xpProgressPercent} questPercent={questPercent} />

        {/* Telemetry Stack on Right */}
        <div className="flex-1 min-w-0 space-y-1.5 font-mono text-[8px]">
          <div>
            <span className="text-ink-muted uppercase tracking-wider block text-[7px]">ACTIVE</span>
            <span className="text-emerald-400 font-bold text-[10px]">{activeBoost ?? "2.1x XP"}</span>
          </div>

          <div>
            <span className="text-ink-muted uppercase tracking-wider block text-[7px]">SYSTEM STATUS</span>
            <span className="text-emerald-400 font-bold text-[9px] flex items-center gap-1">
              <span className="h-1 w-1 rounded-full bg-emerald-400" /> Online
            </span>
          </div>

          <div>
            <div className="flex justify-between text-ink-muted text-[7px] mb-0.5">
              <span>STORAGE USED</span>
              <span className="text-white font-bold">{storageUsed}%</span>
            </div>
            <div className="h-1 w-full rounded-full bg-void-deep overflow-hidden border border-arc-500/20">
              <div
                className="h-full rounded-full bg-cyan-400 shadow-glow-cyan"
                style={{ width: `${storageUsed}%` }}
              />
            </div>
          </div>

          <div>
            <span className="text-ink-muted uppercase tracking-wider block text-[7px]">PING</span>
            <div className="flex items-center justify-between">
              <span className="text-emerald-400 font-bold text-[9px]">{ping}</span>
              <svg className="h-2.5 w-14" viewBox="0 0 56 10" fill="none">
                <path d="M0 5H15L18 1L22 9L26 2L30 7L33 5H56" stroke="#00E6A0" strokeWidth="1" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Telemetry Boxes at Bottom */}
      <div className="grid grid-cols-4 gap-1 pt-1 border-t border-arc-500/20 flex-shrink-0">
        <div className="rounded border border-arc-500/20 bg-void/70 p-0.5 text-center">
          <p className="font-mono text-[6px] text-ink-muted uppercase font-semibold">ACTIVE</p>
          <p className="font-mono text-[8px] font-bold text-amber-400 truncate">{activeBoost ?? "2.1x XP"}</p>
        </div>
        <div className="rounded border border-arc-500/20 bg-void/70 p-0.5 text-center">
          <p className="font-mono text-[6px] text-ink-muted uppercase font-semibold">SERVER</p>
          <p className="font-mono text-[8px] font-bold text-emerald-400 truncate">Online</p>
        </div>
        <div className="rounded border border-arc-500/20 bg-void/70 p-0.5 text-center">
          <p className="font-mono text-[6px] text-ink-muted uppercase font-semibold">XP%</p>
          <p className="font-mono text-[8px] font-bold text-arc-300 truncate">{Math.round(xpProgressPercent || 74)}%</p>
        </div>
        <div className="rounded border border-arc-500/20 bg-void/70 p-0.5 text-center">
          <p className="font-mono text-[6px] text-ink-muted uppercase font-semibold">PING</p>
          <p className="font-mono text-[8px] font-bold text-cyan-300 truncate">{ping}</p>
        </div>
      </div>
    </div>
  );
}
