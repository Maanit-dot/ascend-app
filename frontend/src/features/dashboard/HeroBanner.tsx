"use client";

import { useEffect, useRef } from "react";
import type { DailyQuestBoard } from "@/types";
import type { AscendUser } from "@/types";
import { getHunterTitle, getHunterRank } from "@/lib/format";

interface HeroBannerProps {
  user: AscendUser;
  board: DailyQuestBoard | null;
}

/** Animated level ring SVG overlay */
function LevelRingOverlay({ level, xpPercent }: { level: number; xpPercent: number }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - xpPercent / 100);

  return (
    <div className="relative flex flex-col items-center justify-center flex-shrink-0" style={{ width: 96, height: 96 }}>
      {/* Concentric rotating outer HUD rings */}
      <svg className="absolute inset-0 z-10" width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r="44" stroke="rgba(168,85,247,0.4)" strokeWidth="1.2" fill="none"
          strokeDasharray="4 4" style={{ animation: "energy-rotate 20s linear infinite", transformOrigin: "48px 48px" }} />
        <circle cx="48" cy="48" r={radius} stroke="rgba(53,16,111,0.6)" strokeWidth="4" fill="none" />
        <circle
          cx="48" cy="48" r={radius}
          stroke="url(#levelGradHero)"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 48 48)"
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
        <circle cx="48" cy="48" r="26" stroke="rgba(192,178,255,0.3)" strokeWidth="1" fill="none"
          style={{ animation: "energy-rotate-r 15s linear infinite", transformOrigin: "48px 48px" }} />
        <defs>
          <linearGradient id="levelGradHero" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="50%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#E9D5FF" />
          </linearGradient>
        </defs>
      </svg>

      {/* Center Level Content */}
      <div className="relative z-20 flex flex-col items-center justify-center text-center"
        style={{ animation: "level-ring 3s ease-in-out infinite" }}>
        <span className="font-mono text-[7px] uppercase tracking-widest text-arc-300 font-bold">LEVEL</span>
        <span className="font-display text-2xl font-bold text-white text-glow-arc leading-none">{level}</span>
      </div>
    </div>
  );
}

export function HeroBanner({ user, board }: HeroBannerProps) {
  const bannerRef = useRef<HTMLDivElement>(null);
  const charRef = useRef<HTMLDivElement>(null);

  const { character } = user;
  const rank = getHunterRank(character.level);
  const title = getHunterTitle(character.level);
  const classTitle =
    user.primary_track === "exam"       ? "Scholar"  :
    user.primary_track === "fitness"    ? "Warrior"  :
    user.primary_track === "discipline" ? "Monarch"  : "Hunter";
  const motivationalMsg =
    board?.companion_message ?? "You don't need to feel ready. You need to log the first rep.";

  useEffect(() => {
    const banner = bannerRef.current;
    const charEl = charRef.current;
    if (!banner || !charEl) return;

    let rafId: number;
    function onMouseMove(e: MouseEvent) {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const rect = banner!.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) / rect.width;
        const dy = (e.clientY - cy) / rect.height;
        charEl!.style.transform = `translate(${dx * -6}px, ${dy * -4}px)`;
      });
    }
    function onMouseLeave() {
      cancelAnimationFrame(rafId);
      charEl!.style.transform = "translate(0,0)";
    }

    banner.addEventListener("mousemove", onMouseMove);
    banner.addEventListener("mouseleave", onMouseLeave);
    return () => {
      banner.removeEventListener("mousemove", onMouseMove);
      banner.removeEventListener("mouseleave", onMouseLeave);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={bannerRef}
      className="hud-panel-elite relative overflow-hidden h-full flex items-center bg-void"
    >
      <div className="absolute inset-0 bg-hero-gradient pointer-events-none" style={{ zIndex: 0 }} />
      <div className="absolute inset-0 cyber-grid opacity-25 pointer-events-none" style={{ zIndex: 0 }} />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-arc-500/80 to-transparent pointer-events-none" style={{ zIndex: 3 }} />

      <div className="relative flex items-center justify-between w-full h-full p-2.5 px-4" style={{ zIndex: 2 }}>

        {/* ── LEFT: Quote & System Status ─────────── */}
        <div className="flex flex-col justify-center gap-1.5 flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-emerald-400 font-semibold">System Active</span>
          </div>

          <div>
            <p className="font-display text-xs sm:text-sm font-bold text-white leading-snug max-w-xs">
              &quot;{motivationalMsg}&quot;
            </p>
            <p className="mt-0.5 font-mono text-[9px] text-arc-300 italic">— System</p>
          </div>
        </div>

        {/* ── CENTER: High-Fidelity Shadow Dragon + Anime Hunter Reference Artwork ──────────────────── */}
        <div className="relative flex-shrink-0 flex items-end justify-center h-full w-48 sm:w-60 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/dragon_hunter_portrait.png"
            alt="Shadow Dragon & Hunter"
            className="h-full w-full object-cover object-bottom drop-shadow-[0_0_24px_rgba(168,85,247,0.9)] transition-transform duration-300 hover:scale-105"
          />
        </div>

        {/* ── RIGHT: Hunter Level Core & Stats ───────────────────── */}
        <div className="flex-shrink-0 flex items-center gap-3 pl-3 border-l border-arc-500/25">
          <div className="flex flex-col justify-center gap-1 min-w-[130px]">
            <div>
              <p className="font-mono text-[8px] uppercase tracking-widest text-arc-400/80 font-bold">HUNTER</p>
              <div className="flex items-center gap-1.5">
                <p className="font-display text-sm font-bold text-white leading-none truncate">{user.display_name}</p>
                <svg className="h-3 w-3 text-arc-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
                </svg>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-mono text-[8px] text-ink-muted mb-0.5">
                <span>{character.current_xp.toLocaleString()} XP</span>
                <span>{character.xp_required_for_next_level.toLocaleString()} XP</span>
              </div>
              <div className="h-1 w-full rounded-full bg-void-deep/80 overflow-hidden">
                <div
                  className="h-full rounded-full bg-stat-bar-arc shadow-glow-arc-sm transition-all duration-700"
                  style={{ width: `${character.xp_progress_percent}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1 pt-0.5 text-center font-mono text-[8px]">
              <div className="rounded border border-arc-500/25 bg-void/60 p-0.5">
                <p className="text-ink-faint text-[7px]">RANK</p>
                <p className="font-bold text-amber-400">{rank}</p>
              </div>
              <div className="rounded border border-arc-500/25 bg-void/60 p-0.5">
                <p className="text-ink-faint text-[7px]">TITLE</p>
                <p className="font-bold text-arc-300 truncate">{title}</p>
              </div>
              <div className="rounded border border-arc-500/25 bg-void/60 p-0.5">
                <p className="text-ink-faint text-[7px]">CLASS</p>
                <p className="font-bold text-white truncate">{classTitle}</p>
              </div>
            </div>
          </div>

          {/* Level Showcase with Flaming Ring Background */}
          <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: 96, height: 96 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/flaming_level_ring_centered.png"
              alt="Flaming Level Ring"
              className="absolute inset-0 h-full w-full object-cover rounded-full filter drop-shadow-[0_0_12px_rgba(168,85,247,0.9)] pointer-events-none"
            />
            <LevelRingOverlay level={character.level} xpPercent={character.xp_progress_percent} />
          </div>
        </div>
      </div>
    </div>
  );
}
