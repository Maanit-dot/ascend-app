"use client";

import { useEffect, useRef } from "react";
import type { DailyQuestBoard } from "@/types";
import type { AscendUser } from "@/types";
import { getHunterTitle, getHunterRank } from "@/lib/format";

interface HeroBannerProps {
  user: AscendUser;
  board: DailyQuestBoard | null;
}

export function HeroBanner({ user, board }: HeroBannerProps) {
  const bannerRef = useRef<HTMLDivElement>(null);

  const { character } = user;
  const rank = getHunterRank(character.level);
  const title = getHunterTitle(character.level);
  const classTitle =
    user.primary_track === "exam"       ? "Scholar"  :
    user.primary_track === "fitness"    ? "Warrior"  :
    user.primary_track === "discipline" ? "Monarch"  : "Hunter";
  const motivationalMsg =
    board?.companion_message ?? "You don't need to feel ready. You need to log the first rep.";

  return (
    <div
      ref={bannerRef}
      className="hud-panel-elite relative overflow-hidden h-full flex items-center bg-[#03030B] select-none"
    >
      {/* ── Text-Free Background Image (media_1787827147820.png processed) ───────── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/hero_banner_textfree_final.png"
        alt="Hero Banner Background"
        className="absolute inset-0 h-full w-full object-cover object-center pointer-events-none opacity-95"
        style={{ zIndex: 0 }}
      />

      {/* Cyber Grid & subtle scanline overlay */}
      <div className="absolute inset-0 cyber-grid opacity-15 pointer-events-none" style={{ zIndex: 1 }} />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-arc-500/80 to-transparent pointer-events-none" style={{ zIndex: 3 }} />

      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
        <div className="absolute left-0 right-0 h-px bg-arc-400/10 animate-scan-line" />
      </div>

      {/* Floating particles for live energy effect */}
      <div className="energy-particle energy-particle-1" style={{ zIndex: 1 }} />
      <div className="energy-particle energy-particle-2" style={{ zIndex: 1 }} />
      <div className="energy-particle energy-particle-3" style={{ zIndex: 1 }} />
      <div className="energy-particle energy-particle-4" style={{ zIndex: 1 }} />

      {/* ── 3-Zone Overlay Layout Structure (Positioned 1:1 Over Background) ──── */}
      <div className="relative flex items-center justify-between w-full h-full p-3 px-5" style={{ zIndex: 2 }}>

        {/* ── LEFT ZONE (25-30% Width): System Status & Dynamic Quote ────────── */}
        <div className="flex flex-col justify-center gap-1.5 w-[28%] min-w-0 pr-2">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-emerald-400 font-bold">SYSTEM ACTIVE</span>
          </div>

          <div>
            <p className="font-body text-xs sm:text-sm font-semibold text-white leading-snug drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] max-w-xs">
              &quot;{motivationalMsg}&quot;
            </p>
            <p className="mt-0.5 font-mono text-[9px] text-arc-300 italic">— System</p>
          </div>
        </div>

        {/* ── CENTER ZONE (35-40% Width): Dragon + Hunter Artwork Channel ─────────── */}
        <div className="w-[38%] h-full pointer-events-none flex-shrink-0" />

        {/* ── RIGHT ZONE (30-35% Width): Dynamic Hunter Info & Level Ring ───── */}
        <div className="flex items-center justify-end gap-3 w-[34%] min-w-0">
          {/* User Name, XP & Stats column */}
          <div className="flex flex-col justify-center gap-1 min-w-[130px] flex-1">
            <div>
              <p className="font-mono text-[8px] uppercase tracking-widest text-arc-400 font-bold">HUNTER</p>
              <div className="flex items-center gap-1.5">
                <p className="font-display text-sm sm:text-base font-bold text-white leading-none truncate">{user.display_name}</p>
                <svg className="h-3.5 w-3.5 text-arc-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
                </svg>
              </div>
            </div>

            {/* Dynamic XP Progress Bar */}
            <div>
              <div className="flex justify-between font-mono text-[8px] text-ink-muted mb-0.5 font-medium">
                <span>{character.current_xp.toLocaleString()} XP</span>
                <span>{character.xp_required_for_next_level.toLocaleString()} XP</span>
              </div>
              <div className="h-1 w-full rounded-full bg-void-deep/90 overflow-hidden border border-arc-500/30">
                <div
                  className="h-full rounded-full bg-stat-bar-arc shadow-glow-arc-sm transition-all duration-700"
                  style={{ width: `${character.xp_progress_percent}%` }}
                />
              </div>
            </div>

            {/* Dynamic 3-Column Stats (RANK | TITLE | CLASS) */}
            <div className="grid grid-cols-3 gap-1 pt-0.5 text-center font-mono text-[8px]">
              <div className="rounded border border-arc-500/30 bg-void/80 p-0.5">
                <p className="text-ink-faint text-[6px] uppercase tracking-wider font-bold">RANK</p>
                <p className="font-bold text-amber-400">{rank}</p>
              </div>
              <div className="rounded border border-arc-500/30 bg-void/80 p-0.5">
                <p className="text-ink-faint text-[6px] uppercase tracking-wider font-bold">TITLE</p>
                <p className="font-bold text-arc-300 truncate">{title}</p>
              </div>
              <div className="rounded border border-arc-500/30 bg-void/80 p-0.5">
                <p className="text-ink-faint text-[6px] uppercase tracking-wider font-bold">CLASS</p>
                <p className="font-bold text-white truncate">{classTitle}</p>
              </div>
            </div>
          </div>

          {/* Dynamic Circular Level Showcase Indicator Overlaid inside Glowing Background Ring */}
          <div className="relative flex flex-col items-center justify-center flex-shrink-0" style={{ width: 84, height: 84 }}>
            {/* Concentric rotating accent ring overlay */}
            <svg className="absolute inset-0" width="84" height="84" viewBox="0 0 84 84">
              <circle cx="42" cy="42" r="39" stroke="rgba(168,85,247,0.4)" strokeWidth="1" fill="none"
                strokeDasharray="4 4" style={{ animation: "energy-rotate 20s linear infinite", transformOrigin: "42px 42px" }} />
              <circle cx="42" cy="42" r="28" stroke="rgba(192,178,255,0.25)" strokeWidth="1" fill="none"
                style={{ animation: "energy-rotate-r 15s linear infinite", transformOrigin: "42px 42px" }} />
            </svg>

            <div className="relative z-10 flex flex-col items-center justify-center text-center">
              <span className="font-mono text-[7px] uppercase tracking-widest text-arc-300 font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">LEVEL</span>
              <span className="font-display text-2xl font-bold text-white text-glow-arc leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">{character.level}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
