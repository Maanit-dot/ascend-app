"use client";

import { useUserStore } from "@/store/useUserStore";

export function ArcProjectionPanel() {
  const user = useUserStore((s) => s.user);
  const character = user?.character;
  const growthRate = character ? Math.min(99, Math.round(character.xp_progress_percent || 78)) : 78;

  return (
    <div className="hud-panel relative overflow-hidden h-full flex items-center justify-between px-4 py-2 bg-[#060312]/90 border border-arc-500/30 rounded-xl select-none">
      {/* Background cyber grid & energy particles */}
      <div className="absolute inset-0 cyber-grid opacity-15 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-arc-500/60 to-transparent pointer-events-none" />

      {/* Left side: Label + subtitle */}
      <div className="relative z-10 flex flex-col justify-center min-w-[180px]">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-arc-400 animate-pulse" />
          <h3 className="font-display text-xs font-bold tracking-[0.2em] text-white">
            ARC PROJECTION
          </h3>
        </div>
        <p className="font-mono text-[9px] text-arc-400/70 tracking-wider uppercase mt-0.5">
          Learning / Adapting / Evolving
        </p>
      </div>

      {/* Center: Wide horizontal neon energy progress bar */}
      <div className="relative z-10 flex-1 mx-6 flex flex-col justify-center">
        <div className="relative h-2 w-full rounded-full bg-void-deep/90 overflow-hidden border border-arc-500/30">
          <div
            className="h-full rounded-full bg-gradient-to-r from-arc-600 via-arc-400 to-cyan-400 shadow-[0_0_12px_rgba(0,229,255,0.8)] transition-all duration-1000"
            style={{ width: `${growthRate}%` }}
          />
        </div>
      </div>

      {/* Right side: Percentage + Dragon Shadow Energy Artwork */}
      <div className="relative z-10 flex items-center gap-4 flex-shrink-0">
        <div className="text-right">
          <span className="font-display text-xl font-bold text-white text-glow-arc leading-none">
            {growthRate}%
          </span>
          <p className="font-mono text-[8px] text-arc-400/80 uppercase tracking-wider mt-0.5">
            Current Arc Progress
          </p>
        </div>

        {/* Embedded Dragon Shadow Energy Artwork */}
        <div className="relative h-12 w-24 overflow-hidden rounded-lg border border-arc-500/20 bg-void/60 flex items-center justify-center flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/shadow_dragon_hunter.png"
            alt="Shadow Dragon Energy"
            className="h-full w-full object-cover object-center opacity-85 hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              // Fallback to dragon_hunter_portrait if shadow_dragon_hunter missing
              (e.currentTarget as HTMLImageElement).src = "/dragon_hunter_portrait.png";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#060312]/80 via-transparent to-[#060312]/60 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
