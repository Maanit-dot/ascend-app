"use client";

import { useEffect, useState } from "react";
import { useQuestBoardStore } from "@/store/useQuestBoardStore";
import { useUserStore } from "@/store/useUserStore";

/** Animated ASCEND CORE reactor orb centered directly inside the glowing background orb */
function AscendCore({ xpPercent, questPercent }: { xpPercent: number; questPercent: number }) {
  return (
    <div className="relative flex flex-col items-center justify-center flex-shrink-0" style={{ width: 130, height: 130 }}>
      {/* Concentric rotating orbital accent rings */}
      <svg className="absolute inset-0 core-ring-outer" width="130" height="130" viewBox="0 0 130 130">
        <circle cx="65" cy="65" r="58" stroke="rgba(168,85,247,0.35)" strokeWidth="1.2" fill="none" strokeDasharray="4 6" />
        {[0, 90, 180, 270].map((deg) => {
          const r = 58;
          const rad = (deg * Math.PI) / 180;
          const x = 65 + r * Math.cos(rad);
          const y = 65 + r * Math.sin(rad);
          return <circle key={deg} cx={x} cy={y} r="2.5" fill="#00E5FF" style={{ filter: "drop-shadow(0 0 6px #00E5FF)" }} />;
        })}
      </svg>

      {/* Dynamic XP/Completion Progress Arc Ring */}
      <svg className="absolute inset-0" width="130" height="130" viewBox="0 0 130 130" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="65" cy="65" r="46" stroke="rgba(139,92,246,0.15)" strokeWidth="3" fill="none" />
        <circle
          cx="65" cy="65" r="46"
          stroke="rgba(0,229,255,0.85)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${(questPercent / 100) * 289.02} 289.02`}
          style={{ filter: "drop-shadow(0 0 8px rgba(0,229,255,0.9))", transition: "stroke-dasharray 1s ease" }}
        />
      </svg>

      {/* Central Core sphere (Dark void background so the percentage sits inside the dark space) */}
      <div
        className="relative z-10 flex flex-col items-center justify-center rounded-full text-center"
        style={{
          width: 72,
          height: 72,
          background: "radial-gradient(circle, rgba(10,5,26,0.95) 0%, rgba(15,7,38,0.9) 70%, rgba(0,0,0,0.98) 100%)",
          boxShadow: "inset 0 0 14px rgba(0,229,255,0.35)",
        }}
      >
        <span className="font-mono text-[7px] uppercase tracking-widest text-arc-300 font-bold leading-none">ASCEND CORE</span>
        <span className="font-mono text-[6px] text-emerald-400 font-bold leading-tight mt-0.5">System Online</span>
        <span className="font-display text-lg font-bold text-white text-glow-arc leading-none mt-0.5">
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
    <div className="hud-panel relative p-2.5 h-full flex flex-col justify-between overflow-hidden bg-[#020108] rounded-xl select-none">
      {/* ── User-Provided High-Res Celestial Sphere Background ───────── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/custom_bg/ascend_core_full_bg.png"
        alt="Ascend Core Background"
        className="absolute inset-0 h-full w-full object-cover object-left pointer-events-none opacity-95 z-0"
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between flex-shrink-0">
        <h3 className="font-display text-xs font-bold tracking-wider text-white">SYSTEM OVERVIEW</h3>
        <span className="font-mono text-[8px] text-emerald-400 font-semibold flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Online
        </span>
      </div>

      {/* Middle Section: Reactor Core on Left + Telemetry List on Right */}
      <div className="relative z-10 flex items-center justify-between gap-4 my-auto min-h-0">
        {/* Core Reactor placed concentric over the background glowing sphere */}
        <div className="w-[50%] flex items-center justify-center flex-shrink-0">
          <AscendCore xpPercent={xpProgressPercent} questPercent={questPercent} />
        </div>

        {/* Telemetry Stack on Right */}
        <div className="flex-1 min-w-0 space-y-1.5 font-mono text-[8px] pr-2">
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
            <div className="h-1 w-full rounded-full bg-void-deep overflow-hidden">
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
