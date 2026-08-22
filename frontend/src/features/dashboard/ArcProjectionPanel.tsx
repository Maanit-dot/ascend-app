"use client";

import { useUserStore } from "@/store/useUserStore";

export function ArcProjectionPanel() {
  const user = useUserStore((s) => s.user);
  const character = user?.character;
  const growthRate = character ? Math.min(99, Math.round(character.xp_progress_percent || 78)) : 78;

  return (
    <div className="hud-panel relative overflow-hidden p-3 h-full flex flex-col justify-between">
      {/* Background cyber grid */}
      <div className="absolute inset-0 cyber-grid opacity-20 pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between">
        <h3 className="font-display text-xs font-bold tracking-wider text-ink-primary">
          ARC PROJECTION
        </h3>
        <span className="font-mono text-[9px] text-arc-400 font-semibold">{growthRate}%</span>
      </div>

      {/* Center Holographic Figure / Wave */}
      <div className="relative z-10 my-2 flex items-center justify-between gap-3">
        <div className="flex-1">
          <p className="font-mono text-[10px] text-ink-muted">Learning / Adapting / Evolving</p>
          <div className="mt-1.5 h-1.5 w-full rounded-full bg-void-deep overflow-hidden">
            <div
              className="h-full rounded-full bg-stat-bar-arc shadow-glow-arc-sm transition-all duration-700"
              style={{ width: `${growthRate}%` }}
            />
          </div>
        </div>

        {/* Small holographic silhouette art with purple glow */}
        <div className="relative flex h-12 w-16 items-center justify-center flex-shrink-0">
          <div className="absolute inset-0 bg-arc-500/20 blur-md rounded-full animate-pulse-slow" />
          <svg viewBox="0 0 60 40" className="h-full w-full drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]" fill="none">
            <path
              d="M10 30 Q25 5 40 20 T55 10"
              stroke="rgba(162,143,255,0.8)"
              strokeWidth="1.5"
              fill="none"
            />
            <circle cx="40" cy="20" r="2" fill="rgba(139,92,246,1)" />
            <circle cx="55" cy="10" r="2.5" fill="rgba(162,143,255,1)" />
            <path
              d="M30 15 C32 10 38 10 40 15 L42 25 L28 25 Z"
              fill="rgba(109,40,217,0.6)"
            />
          </svg>
        </div>
      </div>

      {/* Bottom status */}
      <div className="relative z-10 flex items-center justify-between font-mono text-[8px] text-ink-faint">
        <span>Trajectory: Exponential</span>
        <span className="text-emerald-400">Optimal Sync</span>
      </div>
    </div>
  );
}
