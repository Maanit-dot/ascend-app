"use client";

import { useUserStore } from "@/store/useUserStore";

export function ArcProjectionPanel() {
  const user = useUserStore((s) => s.user);
  const character = user?.character;
  const growthRate = character ? Math.min(99, Math.round(character.xp_progress_percent || 78)) : 78;

  return (
    <div className="hud-panel relative overflow-hidden p-2 h-full flex flex-col justify-between">
      <div className="absolute inset-0 cyber-grid opacity-20 pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between">
        <h3 className="font-display text-[10px] font-bold tracking-wider text-white">
          ARC PROJECTION
        </h3>
        <span className="font-mono text-[9px] text-arc-400 font-bold text-glow-arc">{growthRate}%</span>
      </div>

      {/* Center Holographic Figure & Progress */}
      <div className="relative z-10 my-0.5 flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[8px] text-ink-muted truncate">Learning / Adapting / Evolving</p>
          <div className="mt-1 h-1 w-full rounded-full bg-void-deep overflow-hidden">
            <div
              className="h-full rounded-full bg-stat-bar-arc shadow-glow-arc-sm transition-all duration-700"
              style={{ width: `${growthRate}%` }}
            />
          </div>
        </div>

        {/* Small holographic silhouette art with purple glow */}
        <div className="relative flex h-10 w-12 items-center justify-center flex-shrink-0">
          <div className="absolute inset-0 bg-arc-500/25 blur-md rounded-full animate-pulse-slow" />
          <svg viewBox="0 0 60 40" className="h-full w-full drop-shadow-[0_0_8px_rgba(139,92,246,0.9)]" fill="none">
            <path
              d="M10 30 Q25 5 40 20 T55 10"
              stroke="rgba(162,143,255,0.9)"
              strokeWidth="1.5"
              fill="none"
            />
            <circle cx="40" cy="20" r="2" fill="rgba(139,92,246,1)" />
            <circle cx="55" cy="10" r="2.5" fill="rgba(162,143,255,1)" />
            <path
              d="M30 15 C32 10 38 10 40 15 L42 25 L28 25 Z"
              fill="rgba(109,40,217,0.7)"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
