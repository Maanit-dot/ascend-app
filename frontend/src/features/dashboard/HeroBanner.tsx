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
      {/* ── User-Provided Background Image ───────── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/custom_bg/hero_banner_bg.png"
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
        <div className="flex flex-col justify-center gap-1.5 2xl:gap-3 w-[28%] min-w-0 pr-2">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="relative flex h-2 w-2 2xl:h-2.5 2xl:w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 2xl:h-2.5 2xl:w-2.5 rounded-full bg-emerald-400" />
            </span>
            <span className="font-mono text-[8px] 2xl:text-[10px] uppercase tracking-[0.2em] text-emerald-400 font-bold">SYSTEM ACTIVE</span>
          </div>

          <div>
            <p className="font-body text-xs sm:text-sm 2xl:text-base font-semibold text-white leading-snug drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] max-w-xs 2xl:max-w-md">
              &quot;{motivationalMsg}&quot;
            </p>
            <p className="mt-0.5 2xl:mt-1 font-mono text-[9px] 2xl:text-[11px] text-arc-300 italic">— System</p>
          </div>
        </div>

        {/* ── CENTER ZONE (35-40% Width): Dragon + Hunter Artwork Channel ─────────── */}
        <div className="w-[35%] h-full pointer-events-none flex-shrink-0" />

        {/* ── RIGHT ZONE (30-35% Width): Dynamic Hunter Info & Level Ring ───── */}
        <div className="flex items-center justify-end gap-3 2xl:gap-5 w-[37%] min-w-0 self-center">
          {/* User Name, XP & Stats column */}
          <div className="flex flex-col justify-center gap-1 2xl:gap-2 min-w-[130px] 2xl:min-w-[180px] flex-1">
            <div>
              <p className="font-mono text-[8px] 2xl:text-[10px] uppercase tracking-widest text-arc-400 font-bold">HUNTER</p>
              <div className="flex items-center gap-1.5">
                <p className="font-display text-sm sm:text-base 2xl:text-xl font-bold text-white leading-none truncate">{user.display_name}</p>
                <svg className="h-3.5 w-3.5 2xl:h-5 2xl:w-5 text-arc-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
                </svg>
              </div>
            </div>

            {/* Dynamic XP Progress Bar */}
            <div>
              <div className="flex justify-between font-mono text-[8px] 2xl:text-[10px] text-ink-muted mb-0.5 font-medium">
                <span>{character.current_xp.toLocaleString()} XP</span>
                <span>{character.xp_required_for_next_level.toLocaleString()} XP</span>
              </div>
              <div className="h-1 2xl:h-1.5 w-full rounded-full bg-void-deep/90 overflow-hidden">
                <div
                  className="h-full rounded-full bg-stat-bar-arc shadow-glow-arc-sm transition-all duration-700"
                  style={{ width: `${character.xp_progress_percent}%` }}
                />
              </div>
            </div>

            {/* Dynamic 3-Column Stats (RANK | TITLE | CLASS) */}
            <div className="grid grid-cols-3 gap-1 pt-0.5 text-center font-mono text-[8px]">
              <div className="rounded bg-void/80 p-0.5">
                <p className="text-ink-faint text-[6px] uppercase tracking-wider font-bold">RANK</p>
                <p className="font-bold text-amber-400">{rank}</p>
              </div>
              <div className="rounded bg-void/80 p-0.5">
                <p className="text-ink-faint text-[6px] uppercase tracking-wider font-bold">TITLE</p>
                <p className="font-bold text-arc-300 truncate">{title}</p>
              </div>
              <div className="rounded bg-void/80 p-0.5">
                <p className="text-ink-faint text-[6px] uppercase tracking-wider font-bold">CLASS</p>
                <p className="font-bold text-white truncate">{classTitle}</p>
              </div>
            </div>
          </div>

          {/* Dynamic Level Indicator — aligned dead-center with the background glowing level sphere */}
          <div
            className="relative flex flex-col items-center justify-center flex-shrink-0 self-center"
            style={{ width: 84, height: 84, marginTop: "-8px", marginRight: "6px" }}
          >
            <div className="relative z-10 flex flex-col items-center justify-center text-center">
              <span className="font-mono text-[7px] uppercase tracking-widest text-arc-300 font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">LEVEL</span>
              <span className="font-display text-2xl font-bold text-white text-glow-arc leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">{character.level}</span>
              <svg className="h-3 w-6 text-arc-400 mt-0.5" viewBox="0 0 24 10" fill="currentColor">
                <path d="M12 10L6 0H0L8 7L12 10L16 7L24 0H18L12 10Z" opacity="0.8" />
              </svg>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
