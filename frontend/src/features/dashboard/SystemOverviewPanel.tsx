"use client";

import { useState } from "react";
import { useQuestBoardStore } from "@/store/useQuestBoardStore";

/** Animated ASCEND CORE reactor orb centered directly inside the glowing background orb */
function AscendCore({ xpPercent, questPercent }: { xpPercent: number; questPercent: number }) {
  return (
    <div className="relative flex flex-col items-center justify-center flex-shrink-0 w-[114px] h-[114px] 2xl:w-[144px] 2xl:h-[144px]">
      {/* Dynamic XP/Completion Progress Arc Ring (hugs inner boundary of celestial plasma) */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 124 124" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="62" cy="62" r="46" stroke="rgba(139,92,246,0.18)" strokeWidth="3.5" fill="none" />
        <circle
          cx="62" cy="62" r="46"
          stroke="rgba(0,229,255,0.95)"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${(questPercent / 100) * 289.02} 289.02`}
          style={{ filter: "drop-shadow(0 0 10px rgba(0,229,255,0.95))", transition: "stroke-dasharray 1s ease" }}
        />
      </svg>

      {/* Central Core sphere (Dark void background so the percentage sits inside the dark space) */}
      <div
        className="relative z-10 flex flex-col items-center justify-center rounded-full text-center w-[70px] h-[70px] 2xl:w-[88px] 2xl:h-[88px]"
        style={{
          background: "radial-gradient(circle, rgba(10,5,26,0.96) 0%, rgba(15,7,38,0.92) 70%, rgba(0,0,0,0.98) 100%)",
          boxShadow: "inset 0 0 16px rgba(0,229,255,0.4), 0 0 20px rgba(0,0,0,0.8)",
        }}
      >
        <span className="font-mono text-[7px] 2xl:text-[8.5px] uppercase tracking-widest text-arc-300 font-bold leading-none">ASCEND CORE</span>
        <span className="font-mono text-[6px] 2xl:text-[7.5px] text-emerald-400 font-bold leading-tight mt-0.5">System Online</span>
        <span className="font-display text-lg 2xl:text-xl font-bold text-white text-glow-arc leading-none mt-0.5">
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
  const [ping] = useState<string>("32ms");
  const board = useQuestBoardStore((s) => s.board);

  const questPercent = board?.completion_percent ?? 100;
  const storageUsed = Math.min(99, Math.round(30 + xpProgressPercent * 0.25));

  return (
    <div className="hud-panel relative p-2.5 2xl:p-3.5 h-full flex flex-col justify-between overflow-hidden bg-[#020108] rounded-xl select-none">
      {/* ── User-Provided High-Res Celestial Sphere Background (Shrunk slightly and shifted right) ───────── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/custom_bg/ascend_core_full_bg.png"
        alt="Ascend Core Background"
        className="absolute inset-0 h-full w-full object-cover object-left pointer-events-none opacity-95 z-0"
        style={{
          transform: "scale(0.90) translateX(18px)",
          transformOrigin: "left center",
        }}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between flex-shrink-0">
        <h3 className="font-display text-xs 2xl:text-sm font-bold tracking-wider text-white">SYSTEM OVERVIEW</h3>
        <span className="font-mono text-[8px] 2xl:text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Online
        </span>
      </div>

      {/* Concentric Ascend Core Reactor positioned exactly over the shrunk and shifted celestial orb center */}
      <div
        className="absolute z-10 pointer-events-none"
        style={{
          top: "50%",
          left: "33.6%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <AscendCore xpPercent={xpProgressPercent} questPercent={questPercent} />
      </div>

      {/* Middle Section: Telemetry Stack positioned on the right */}
      <div className="relative z-10 flex items-center justify-end my-auto min-h-0 pointer-events-none">
        <div className="w-[42%] min-w-0 space-y-1.5 2xl:space-y-2.5 font-mono text-[8px] 2xl:text-[10px] pr-2 pointer-events-auto">
          <div>
            <span className="text-ink-muted uppercase tracking-wider block text-[7px] 2xl:text-[8px]">ACTIVE</span>
            <span className="text-emerald-400 font-bold text-[10px] 2xl:text-xs">{activeBoost ?? "2.1x XP"}</span>
          </div>

          <div>
            <span className="text-ink-muted uppercase tracking-wider block text-[7px] 2xl:text-[8px]">SYSTEM STATUS</span>
            <span className="text-emerald-400 font-bold text-[9px] 2xl:text-[11px] flex items-center gap-1">
              <span className="h-1 w-1 rounded-full bg-emerald-400" /> Online
            </span>
          </div>

          <div>
            <div className="flex justify-between text-ink-muted text-[7px] 2xl:text-[9px] mb-0.5">
              <span>STORAGE USED</span>
              <span className="text-white font-bold">{storageUsed}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-void-deep overflow-hidden">
              <div
                className="h-full rounded-full bg-cyan-400 shadow-glow-cyan"
                style={{ width: `${storageUsed}%` }}
              />
            </div>
          </div>

          <div>
            <span className="text-ink-muted uppercase tracking-wider block text-[7px] 2xl:text-[8px]">PING</span>
            <div className="flex items-center justify-between">
              <span className="text-emerald-400 font-bold text-[9px] 2xl:text-[11px]">{ping}</span>
              <svg className="h-2.5 2xl:h-3.5 w-14 2xl:w-20" viewBox="0 0 56 10" fill="none">
                <path d="M0 5H15L18 1L22 9L26 2L30 7L33 5H56" stroke="#00E6A0" strokeWidth="1" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Telemetry Boxes at Bottom */}
      <div className="relative z-10 grid grid-cols-4 gap-1.5 pt-1 flex-shrink-0">
        <div className="rounded bg-void/80 p-0.5 text-center">
          <p className="font-mono text-[6px] text-ink-muted uppercase font-semibold">ACTIVE</p>
          <p className="font-mono text-[8px] font-bold text-amber-400 truncate">{activeBoost ?? "2.1x XP"}</p>
        </div>
        <div className="rounded bg-void/80 p-0.5 text-center">
          <p className="font-mono text-[6px] text-ink-muted uppercase font-semibold">SERVER</p>
          <p className="font-mono text-[8px] font-bold text-emerald-400 truncate">Online</p>
        </div>
        <div className="rounded bg-void/80 p-0.5 text-center">
          <p className="font-mono text-[6px] text-ink-muted uppercase font-semibold">XP%</p>
          <p className="font-mono text-[8px] font-bold text-arc-300 truncate">{Math.round(xpProgressPercent || 74)}%</p>
        </div>
        <div className="rounded bg-void/80 p-0.5 text-center">
          <p className="font-mono text-[6px] text-ink-muted uppercase font-semibold">PING</p>
          <p className="font-mono text-[8px] font-bold text-cyan-300 truncate">{ping}</p>
        </div>
      </div>
    </div>
  );
}
