"use client";

import { useEffect, useState } from "react";
import { useQuestBoardStore } from "@/store/useQuestBoardStore";
import { useUserStore } from "@/store/useUserStore";

/** Animated ASCEND CORE reactor orb with user-provided glowing sphere image and electric arcs */
function AscendCore({ xpPercent, questPercent }: { xpPercent: number; questPercent: number }) {
  return (
    <div className="relative flex flex-col items-center justify-center flex-shrink-0" style={{ width: 116, height: 116 }}>
      {/* ── User-Provided Glowing Blue Sphere Image placed around Core ── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/custom_bg/ascend_core_bg.png"
        alt="Ascend Core Sphere"
        className="absolute inset-0 h-full w-full object-contain pointer-events-none drop-shadow-[0_0_14px_rgba(0,229,255,0.7)]"
      />

      {/* Outermost rotating orbital nodes */}
      <svg className="absolute inset-0 core-ring-outer" width="116" height="116" viewBox="0 0 116 116">
        <circle cx="58" cy="58" r="52" stroke="rgba(168,85,247,0.3)" strokeWidth="1" fill="none" strokeDasharray="4 6" />
        {[0, 90, 180, 270].map((deg) => {
          const r = 52;
          const rad = (deg * Math.PI) / 180;
          const x = 58 + r * Math.cos(rad);
          const y = 58 + r * Math.sin(rad);
          return <circle key={deg} cx={x} cy={y} r="2" fill="#00E5FF" style={{ filter: "drop-shadow(0 0 4px #00E5FF)" }} />;
        })}
      </svg>

      {/* Central Core sphere (Dark void background so the percentage sits inside the dark black space) */}
      <div
        className="relative z-10 flex flex-col items-center justify-center rounded-full text-center"
        style={{
          width: 64,
          height: 64,
          background: "radial-gradient(circle, rgba(10,5,26,0.95) 0%, rgba(15,7,38,0.9) 70%, rgba(0,0,0,0.98) 100%)",
          boxShadow: "inset 0 0 12px rgba(0,229,255,0.35)",
        }}
      >
        <span className="font-mono text-[7px] uppercase tracking-widest text-arc-300 font-bold leading-none">ASCEND CORE</span>
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
    <div className="hud-panel relative p-2.5 h-full flex flex-col justify-between overflow-hidden bg-[#0A051A]/95 rounded-xl select-none">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <h3 className="font-display text-xs font-bold tracking-wider text-white">SYSTEM OVERVIEW</h3>
        <span className="font-mono text-[8px] text-emerald-400 font-semibold flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Online
        </span>
      </div>

      {/* Middle Section: Reactor Core on Left + Telemetry List on Right */}
      <div className="flex items-center justify-between gap-3 my-auto min-h-0">
        {/* Core Reactor surrounded by blue sphere */}
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
      <div className="relative z-10 grid grid-cols-4 gap-1 pt-1 flex-shrink-0">
        <div className="rounded bg-void/70 p-0.5 text-center">
          <p className="font-mono text-[6px] text-ink-muted uppercase font-semibold">ACTIVE</p>
          <p className="font-mono text-[8px] font-bold text-amber-400 truncate">{activeBoost ?? "2.1x XP"}</p>
        </div>
        <div className="rounded bg-void/70 p-0.5 text-center">
          <p className="font-mono text-[6px] text-ink-muted uppercase font-semibold">SERVER</p>
          <p className="font-mono text-[8px] font-bold text-emerald-400 truncate">Online</p>
        </div>
        <div className="rounded bg-void/70 p-0.5 text-center">
          <p className="font-mono text-[6px] text-ink-muted uppercase font-semibold">XP%</p>
          <p className="font-mono text-[8px] font-bold text-arc-300 truncate">{Math.round(xpProgressPercent || 74)}%</p>
        </div>
        <div className="rounded bg-void/70 p-0.5 text-center">
          <p className="font-mono text-[6px] text-ink-muted uppercase font-semibold">PING</p>
          <p className="font-mono text-[8px] font-bold text-cyan-300 truncate">{ping}</p>
        </div>
      </div>
    </div>
  );
}
