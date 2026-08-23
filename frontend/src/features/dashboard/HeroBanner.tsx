"use client";

import { useEffect, useRef } from "react";
import type { DailyQuestBoard } from "@/types";
import type { AscendUser } from "@/types";
import { getHunterTitle, getHunterRank } from "@/lib/format";

interface HeroBannerProps {
  user: AscendUser;
  board: DailyQuestBoard | null;
}

/** Animated purple flame SVG layer */
function FlameLayers() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-4/5"
        style={{
          background: "radial-gradient(ellipse at 50% 100%, rgba(109,40,217,0.55) 0%, rgba(91,33,182,0.3) 35%, transparent 70%)",
          filter: "blur(24px)",
          animation: "hero-aura 4s ease-in-out infinite",
        }}
      />
      <div
        className="absolute bottom-0 left-[5%] w-1/3 h-3/4"
        style={{
          background: "radial-gradient(ellipse at 20% 100%, rgba(109,40,217,0.5) 0%, rgba(139,92,246,0.2) 40%, transparent 70%)",
          filter: "blur(18px)",
          animation: "flame-rise 3.5s ease-in-out infinite",
          transformOrigin: "bottom center",
        }}
      />
      <div
        className="absolute bottom-0 right-[5%] w-1/3 h-3/4"
        style={{
          background: "radial-gradient(ellipse at 80% 100%, rgba(109,40,217,0.5) 0%, rgba(139,92,246,0.2) 40%, transparent 70%)",
          filter: "blur(18px)",
          animation: "flame-rise 4.2s ease-in-out infinite 0.7s",
          transformOrigin: "bottom center",
        }}
      />
      <div
        className="absolute top-[8%] left-1/2 -translate-x-1/2 w-1/4 h-2/5"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, rgba(162,143,255,0.45) 0%, rgba(139,92,246,0.2) 50%, transparent 75%)",
          filter: "blur(12px)",
          animation: "flame-rise 3.0s ease-in-out infinite 1.4s",
          transformOrigin: "bottom center",
        }}
      />
      <div className="energy-particle energy-particle-1" />
      <div className="energy-particle energy-particle-2" />
      <div className="energy-particle energy-particle-3" />
      <div className="energy-particle energy-particle-4" />
      <div className="energy-particle energy-particle-5" />
    </div>
  );
}

/** Shadow Hunter character silhouette — animated SVG */
function HunterSilhouette() {
  return (
    <div className="relative w-full h-full flex items-end justify-center" style={{ zIndex: 2 }}>
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-28 h-3 rounded-full"
        style={{
          background: "radial-gradient(ellipse, rgba(139,92,246,0.6) 0%, transparent 70%)",
          filter: "blur(6px)",
        }}
      />
      <svg
        viewBox="0 0 120 180"
        className="h-full w-auto max-h-full"
        style={{
          filter: "drop-shadow(0 0 12px rgba(139,92,246,0.9)) drop-shadow(0 0 24px rgba(109,40,217,0.5))",
          animation: "float-y 6s ease-in-out infinite",
        }}
        fill="none"
      >
        <ellipse cx="60" cy="22" rx="14" ry="16" fill="rgba(46,16,101,0.7)" stroke="rgba(162,143,255,0.7)" strokeWidth="1.2" />
        <path d="M42 38 C38 52 35 72 37 100 L50 100 L55 75 L65 75 L70 100 L83 100 C85 72 82 52 78 38 Z" fill="rgba(30,10,70,0.85)" stroke="rgba(139,92,246,0.5)" strokeWidth="1" />
        <path d="M55 38 L55 100" stroke="rgba(162,143,255,0.2)" strokeWidth="0.8" strokeDasharray="4,5" />
        <path d="M44 55 L50 55 M70 55 L76 55" stroke="rgba(162,143,255,0.3)" strokeWidth="0.8" />
        <path d="M43 70 L49 68 M71 68 L77 70" stroke="rgba(162,143,255,0.25)" strokeWidth="0.8" />
        <path d="M42 40 C36 50 30 62 28 78 L35 80 L40 68 L46 50 Z" fill="rgba(46,16,101,0.7)" stroke="rgba(139,92,246,0.4)" strokeWidth="1" />
        <path d="M78 40 C84 50 90 62 92 78 L85 80 L80 68 L74 50 Z" fill="rgba(46,16,101,0.7)" stroke="rgba(139,92,246,0.4)" strokeWidth="1" />
        <line x1="88" y1="82" x2="108" y2="42" stroke="rgba(162,143,255,0.9)" strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="108" cy="42" rx="4" ry="2" transform="rotate(-45 108 42)" fill="rgba(162,143,255,0.6)" />
        <line x1="88" y1="82" x2="108" y2="42" stroke="rgba(139,92,246,0.3)" strokeWidth="6" strokeLinecap="round" />
        <path d="M50 100 L48 145 L55 145 L60 120 L65 145 L72 145 L70 100 Z" fill="rgba(20,8,50,0.9)" stroke="rgba(139,92,246,0.35)" strokeWidth="1" />
        <path d="M48 145 L44 162 L58 162 L57 145 Z" fill="rgba(15,6,40,0.95)" stroke="rgba(162,143,255,0.4)" strokeWidth="0.8" />
        <path d="M63 145 L62 162 L76 162 L72 145 Z" fill="rgba(15,6,40,0.95)" stroke="rgba(162,143,255,0.4)" strokeWidth="0.8" />
        <circle cx="56" cy="20" r="3" fill="rgba(162,143,255,0.9)" style={{ filter: "blur(1px)", animation: "orb-pulse 3s ease-in-out infinite" }} />
        <circle cx="64" cy="20" r="3" fill="rgba(162,143,255,0.9)" style={{ filter: "blur(1px)", animation: "orb-pulse 3s ease-in-out infinite 0.5s" }} />
        <path d="M52 50 L55 55 L52 60" stroke="rgba(162,143,255,0.5)" strokeWidth="0.8" fill="none" />
        <path d="M68 50 L65 55 L68 60" stroke="rgba(162,143,255,0.5)" strokeWidth="0.8" fill="none" />
        <ellipse cx="60" cy="170" rx="20" ry="4" fill="rgba(109,40,217,0.35)" style={{ filter: "blur(4px)" }} />
      </svg>
    </div>
  );
}

/** Animated level ring SVG */
function LevelRing({ level, xpPercent }: { level: number; xpPercent: number }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - xpPercent / 100);

  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: 84, height: 84 }}>
      <svg className="absolute inset-0" width="84" height="84" viewBox="0 0 84 84">
        <circle cx="42" cy="42" r="39" stroke="rgba(139,92,246,0.2)" strokeWidth="1" fill="none"
          strokeDasharray="4 4" style={{ animation: "energy-rotate 20s linear infinite", transformOrigin: "42px 42px" }} />
        <circle cx="42" cy="42" r={radius} stroke="rgba(46,16,101,0.8)" strokeWidth="4" fill="none" />
        <circle
          cx="42" cy="42" r={radius}
          stroke="url(#levelGrad)"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 42 42)"
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
        <circle cx="42" cy="42" r="28" stroke="rgba(139,92,246,0.15)" strokeWidth="1" fill="none"
          style={{ animation: "energy-rotate-r 15s linear infinite", transformOrigin: "42px 42px" }} />
        <defs>
          <linearGradient id="levelGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6D28D9" />
            <stop offset="100%" stopColor="#A28FFF" />
          </linearGradient>
        </defs>
      </svg>
      <div className="relative flex flex-col items-center justify-center text-center"
        style={{ animation: "level-ring 3s ease-in-out infinite" }}>
        <span className="font-mono text-[7px] uppercase tracking-widest text-arc-400/70">Level</span>
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
      className="hud-panel-elite relative overflow-hidden h-full flex items-center"
    >
      <div className="absolute inset-0 bg-hero-gradient pointer-events-none" style={{ zIndex: 0 }} />
      <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none" style={{ zIndex: 0 }} />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-arc-500/60 to-transparent pointer-events-none" style={{ zIndex: 3 }} />
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute left-0 right-0 h-px bg-arc-400/10 animate-scan-line" />
      </div>

      <div className="relative flex items-center justify-between w-full h-full p-2.5 px-4" style={{ zIndex: 2 }}>

        {/* ── LEFT: Quote & Status ─────────── */}
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
            <p className="mt-0.5 font-mono text-[9px] text-arc-400/70 italic">— System</p>
          </div>
        </div>

        {/* ── CENTER: Animated Character Silhouette ──────────────────── */}
        <div className="relative flex-shrink-0 flex items-end justify-center h-full w-36 sm:w-44">
          <FlameLayers />
          <div
            ref={charRef}
            className="relative gpu-accelerate h-full w-full"
            style={{
              transition: "transform 0.1s ease-out",
              zIndex: 2,
            }}
          >
            <HunterSilhouette />
          </div>
        </div>

        {/* ── RIGHT: Level Ring & Stats ───────────────────── */}
        <div className="flex-shrink-0 flex items-center gap-3 pl-3 border-l border-arc-500/20">
          <div className="flex flex-col justify-center gap-1 min-w-[120px]">
            <div>
              <p className="font-mono text-[8px] uppercase tracking-widest text-arc-500/60">HUNTER</p>
              <p className="font-display text-sm font-bold text-white leading-none truncate">{user.display_name}</p>
            </div>

            <div>
              <div className="flex justify-between font-mono text-[8px] text-ink-faint mb-0.5">
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

            <div className="flex items-center gap-2 font-mono text-[9px] text-ink-secondary pt-0.5">
              <span>Rank: <strong className="text-amber-400">{rank}</strong></span>
              <span>•</span>
              <span className="truncate max-w-[80px]">{title}</span>
            </div>
          </div>

          <LevelRing level={character.level} xpPercent={character.xp_progress_percent} />
        </div>
      </div>
    </div>
  );
}
