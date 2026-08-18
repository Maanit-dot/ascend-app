"use client";

import { cn } from "@/lib/utils";
import type { DailyQuestBoard } from "@/types";
import type { AscendUser } from "@/types";

import { getHunterTitle, getHunterRank } from "@/lib/format";

interface HeroBannerProps {
  user: AscendUser;
  board: DailyQuestBoard | null;
}

export function HeroBanner({ user, board }: HeroBannerProps) {
  const { character } = user;
  const rank = getHunterRank(character.level);
  const title = getHunterTitle(character.level);
  const classTitle = user.primary_track === "exam" ? "Scholar" : user.primary_track === "fitness" ? "Warrior" : user.primary_track === "discipline" ? "Monarch" : "Hunter";
  const motivationalMsg = board?.companion_message ?? "The system is watching. Your progress defines your future.";

  return (
    <div className="hud-panel relative overflow-hidden min-h-[160px]">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
      {/* Cyber grid overlay */}
      <div className="absolute inset-0 cyber-grid opacity-40 pointer-events-none" />
      {/* Purple radial glow from left */}
      <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-arc-500/20 to-transparent pointer-events-none" />
      {/* Scan line effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute left-0 right-0 h-px bg-arc-400/10 animate-scan-line" />
      </div>

      <div className="relative z-10 flex items-stretch gap-0 p-0">
        {/* Left: Character silhouette area */}
        <div className="relative flex-shrink-0 w-36 min-h-[160px] flex items-end justify-center">
          {/* Silhouette gradient/shape representing character */}
          <div className="absolute inset-0 bg-gradient-to-t from-arc-900/80 via-arc-800/20 to-transparent" />
          <div className="relative mb-0 flex flex-col items-center justify-end h-full pb-3">
            {/* Character icon / avatar representation */}
            <div className="relative flex h-24 w-20 items-end justify-center">
              {/* Glowing base */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-3 bg-arc-500/40 blur-xl rounded-full" />
              {/* Simple stylized figure placeholder */}
              <svg viewBox="0 0 80 100" className="h-full w-full drop-shadow-[0_0_12px_rgba(139,92,246,0.7)]" fill="none">
                {/* Body silhouette — abstract hunter shape */}
                <ellipse cx="40" cy="20" rx="12" ry="14" fill="rgba(139,92,246,0.3)" stroke="rgba(162,143,255,0.6)" strokeWidth="1"/>
                <path d="M28 34 C24 45 22 60 24 80 L32 80 L36 55 L44 55 L48 80 L56 80 C58 60 56 45 52 34 Z" fill="rgba(109,40,217,0.5)" stroke="rgba(162,143,255,0.4)" strokeWidth="1"/>
                <path d="M28 38 L18 55 L24 57 L32 45 Z" fill="rgba(109,40,217,0.4)" stroke="rgba(162,143,255,0.3)" strokeWidth="1"/>
                <path d="M52 38 L62 55 L56 57 L48 45 Z" fill="rgba(109,40,217,0.4)" stroke="rgba(162,143,255,0.3)" strokeWidth="1"/>
                {/* Energy lines */}
                <line x1="40" y1="34" x2="40" y2="80" stroke="rgba(162,143,255,0.15)" strokeWidth="1" strokeDasharray="3,4"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Center: Title + Message */}
        <div className="flex flex-1 flex-col justify-center px-4 py-4 gap-2">
          {/* System status line */}
          <div className="flex items-center gap-2">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400">
              <span className="animate-ping absolute h-1.5 w-1.5 rounded-full bg-emerald-400 opacity-60" />
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-400/80">System Active</span>
          </div>

          {/* Motivational message */}
          <div>
            <p className="font-display text-base font-bold text-ink-primary leading-snug max-w-xs">
              {motivationalMsg}
            </p>
            <p className="mt-1 font-mono text-[10px] text-arc-400/70 italic">— System</p>
          </div>
        </div>

        {/* Right: Character stats cluster */}
        <div className="flex-shrink-0 flex flex-col justify-center gap-3 px-5 py-4 border-l border-arc-500/20">
          {/* User name */}
          <div>
            <p className="font-mono text-[9px] uppercase tracking-widest text-arc-500/60">Hunter</p>
            <p className="font-display text-lg font-bold text-white leading-none">{user.display_name}</p>
          </div>

          {/* XP bar */}
          <div className="min-w-[160px]">
            <div className="flex justify-between font-mono text-[9px] text-ink-faint mb-1">
              <span>{character.current_xp.toLocaleString()} XP</span>
              <span>{character.xp_required_for_next_level.toLocaleString()} XP</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-void-deep/80 overflow-hidden">
              <div
                className="h-full rounded-full bg-stat-bar-arc shadow-glow-arc-sm transition-all duration-700"
                style={{ width: `${character.xp_progress_percent}%` }}
              />
            </div>
          </div>

          {/* Rank / Title / Class */}
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: "Rank", value: rank },
              { label: "Title", value: title },
              { label: "Class", value: classTitle },
            ].map((item) => (
              <div key={item.label}>
                <p className="system-label mb-0.5">{item.label}</p>
                <p className="font-mono text-[10px] font-bold text-ink-secondary truncate">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
