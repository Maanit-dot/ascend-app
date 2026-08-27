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
      className="hud-panel-elite relative overflow-hidden h-full flex items-center bg-void select-none"
    >
      {/* ── Background Image directly from reference screenshot ── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/hero_banner_bg_clean.png"
        alt="Hero Banner Background"
        className="absolute inset-0 h-full w-full object-cover pointer-events-none opacity-90"
        style={{ zIndex: 0 }}
      />

      {/* Cyber Grid & top accent line overlay */}
      <div className="absolute inset-0 cyber-grid opacity-20 pointer-events-none" style={{ zIndex: 1 }} />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-arc-500/80 to-transparent pointer-events-none" style={{ zIndex: 3 }} />

      {/* ── Foreground Dynamic Elements Overlaid 1:1 on top of Background ── */}
      <div className="relative flex items-center justify-between w-full h-full p-2.5 px-4" style={{ zIndex: 2 }}>

        {/* ── LEFT: Dynamic Motivational Quote & System Status ─────────── */}
        <div className="flex flex-col justify-center gap-1 flex-1 min-w-0 pr-2 max-w-[210px]">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-emerald-400 font-bold">SYSTEM ACTIVE</span>
          </div>

          <div>
            <p className="font-display text-[11px] sm:text-xs font-bold text-white leading-snug drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              &quot;{motivationalMsg}&quot;
            </p>
            <p className="mt-0.5 font-mono text-[8px] text-arc-300 italic">— System</p>
          </div>
        </div>

        {/* ── CENTER: Dragon + Hunter Artwork Area (Visible from Background Image) ── */}
        <div className="flex-shrink-0 w-40 sm:w-52 h-full pointer-events-none" />

        {/* ── RIGHT: Dynamic Hunter Stats & Level Circle ───────────────────── */}
        <div className="flex-shrink-0 flex items-center gap-2 pl-2">
          {/* User Name & XP Info */}
          <div className="flex flex-col justify-center gap-1 min-w-[125px]">
            <div>
              <p className="font-mono text-[7px] uppercase tracking-widest text-arc-400/80 font-bold">HUNTER</p>
              <div className="flex items-center gap-1">
                <p className="font-display text-xs sm:text-sm font-bold text-white leading-none truncate">{user.display_name}</p>
                <svg className="h-3 w-3 text-arc-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
                </svg>
              </div>
            </div>

            {/* Live Dynamic XP Bar */}
            <div>
              <div className="flex justify-between font-mono text-[7px] text-ink-muted mb-0.5">
                <span>{character.current_xp.toLocaleString()} XP</span>
                <span>{character.xp_required_for_next_level.toLocaleString()} XP</span>
              </div>
              <div className="h-1 w-full rounded-full bg-void-deep/90 overflow-hidden border border-arc-500/20">
                <div
                  className="h-full rounded-full bg-stat-bar-arc shadow-glow-arc-sm transition-all duration-700"
                  style={{ width: `${character.xp_progress_percent}%` }}
                />
              </div>
            </div>

            {/* Dynamic Rank / Title / Class */}
            <div className="grid grid-cols-3 gap-1 pt-0.5 text-center font-mono text-[7px]">
              <div className="rounded border border-arc-500/25 bg-void/80 p-0.5">
                <p className="text-ink-faint text-[6px]">RANK</p>
                <p className="font-bold text-amber-400">{rank}</p>
              </div>
              <div className="rounded border border-arc-500/25 bg-void/80 p-0.5">
                <p className="text-ink-faint text-[6px]">TITLE</p>
                <p className="font-bold text-arc-300 truncate">{title}</p>
              </div>
              <div className="rounded border border-arc-500/25 bg-void/80 p-0.5">
                <p className="text-ink-faint text-[6px]">CLASS</p>
                <p className="font-bold text-white truncate">{classTitle}</p>
              </div>
            </div>
          </div>

          {/* Dynamic Level Showcase Ring Overlaid on top of Flaming Background */}
          <div className="relative flex flex-col items-center justify-center flex-shrink-0" style={{ width: 88, height: 88 }}>
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
