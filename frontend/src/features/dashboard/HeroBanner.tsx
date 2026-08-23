"use client";

import { useEffect, useRef } from "react";
import type { DailyQuestBoard } from "@/types";
import type { AscendUser } from "@/types";
import { getHunterTitle, getHunterRank } from "@/lib/format";

interface HeroBannerProps {
  user: AscendUser;
  board: DailyQuestBoard | null;
}

/** Animated purple flame and plasma energy particles */
function FlameLayers() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      {/* Base purple energy glow */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-full"
        style={{
          background: "radial-gradient(ellipse at 50% 100%, rgba(139,92,246,0.65) 0%, rgba(109,40,217,0.4) 35%, rgba(46,16,101,0.2) 65%, transparent 80%)",
          filter: "blur(20px)",
          animation: "hero-aura 4s ease-in-out infinite",
        }}
      />
      {/* Left rising flame plume */}
      <div
        className="absolute bottom-0 left-[10%] w-2/5 h-full"
        style={{
          background: "radial-gradient(ellipse at 30% 100%, rgba(162,143,255,0.5) 0%, rgba(109,40,217,0.25) 45%, transparent 75%)",
          filter: "blur(16px)",
          animation: "flame-rise 3.5s ease-in-out infinite",
          transformOrigin: "bottom center",
        }}
      />
      {/* Right rising flame plume */}
      <div
        className="absolute bottom-0 right-[10%] w-2/5 h-full"
        style={{
          background: "radial-gradient(ellipse at 70% 100%, rgba(162,143,255,0.5) 0%, rgba(109,40,217,0.25) 45%, transparent 75%)",
          filter: "blur(16px)",
          animation: "flame-rise 4.2s ease-in-out infinite 0.7s",
          transformOrigin: "bottom center",
        }}
      />
      {/* Floating particles */}
      <div className="energy-particle energy-particle-1" />
      <div className="energy-particle energy-particle-2" />
      <div className="energy-particle energy-particle-3" />
      <div className="energy-particle energy-particle-4" />
      <div className="energy-particle energy-particle-5" />
    </div>
  );
}

/** Epic Shadow Dragon Head + Anime Shadow Hunter Silhouette SVG */
function ShadowDragonAndHunter() {
  return (
    <div className="relative w-full h-full flex items-end justify-center" style={{ zIndex: 2 }}>
      {/* Ground plasma glow */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-36 h-3 rounded-full"
        style={{
          background: "radial-gradient(ellipse, rgba(162,143,255,0.8) 0%, rgba(109,40,217,0.4) 50%, transparent 75%)",
          filter: "blur(6px)",
        }}
      />

      <svg
        viewBox="0 0 200 200"
        className="h-full w-auto max-h-full drop-shadow-[0_0_20px_rgba(162,143,255,0.85)]"
        style={{ animation: "float-y 6s ease-in-out infinite" }}
        fill="none"
      >
        {/* ── Shadow Dragon Head Silhouette (Left/Top) ──────── */}
        <g opacity="0.85" style={{ filter: "drop-shadow(0 0 12px rgba(139,92,246,0.9))" }}>
          {/* Dragon Snout & Jaws */}
          <path
            d="M20 55 C35 30 75 18 105 28 C125 35 140 50 135 75 C120 70 95 62 75 68 C55 74 35 85 20 55 Z"
            fill="url(#dragonHeadGrad)"
          />
          {/* Dragon Horns */}
          <path
            d="M85 22 C100 5 130 0 145 10 C130 18 110 22 95 26 Z"
            fill="url(#dragonHornGrad)"
          />
          <path
            d="M65 30 C75 12 100 8 115 16 C102 24 88 28 75 32 Z"
            fill="url(#dragonHornGrad)"
          />
          {/* Dragon Glowing Eye */}
          <ellipse cx="68" cy="46" rx="5" ry="3" fill="#00E5FF" style={{ filter: "blur(0.8px)" }} />
          <circle cx="68" cy="46" r="2" fill="#FFFFFF" />
          {/* Dragon Teeth & Flame Breath Trails */}
          <path
            d="M30 62 L36 68 L42 63 L48 69 L54 64 L60 70 L66 65"
            stroke="rgba(162,143,255,0.9)"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M15 65 C5 60 0 75 10 85 C20 95 40 85 30 70 Z"
            fill="rgba(139,92,246,0.4)"
            style={{ filter: "blur(4px)" }}
          />
        </g>

        {/* ── Anime Shadow Hunter Silhouette (Center/Front) ─── */}
        <g style={{ filter: "drop-shadow(0 0 10px rgba(109,40,217,0.9))" }}>
          {/* Hair & Head */}
          <path
            d="M100 70 C90 70 85 82 87 96 C93 96 100 92 105 92 C110 92 115 96 121 96 C123 82 118 70 108 70 Z"
            fill="#1E0A46"
            stroke="rgba(162,143,255,0.8)"
            strokeWidth="1"
          />
          {/* Hair Spikes */}
          <path d="M96 72 L90 62 L100 66 L108 58 L112 66 L122 62 L116 74" fill="#2E1065" />

          {/* Eyes Glow */}
          <circle cx="98" cy="85" r="2" fill="#00E5FF" style={{ filter: "blur(0.5px)" }} />
          <circle cx="106" cy="85" r="2" fill="#00E5FF" style={{ filter: "blur(0.5px)" }} />

          {/* Coat & Collar */}
          <path
            d="M84 100 C78 118 75 140 77 175 L100 175 L106 145 L112 145 L118 175 L141 175 C143 140 140 118 134 100 Z"
            fill="#0F0628"
            stroke="rgba(139,92,246,0.6)"
            strokeWidth="1.2"
          />
          {/* High Collar */}
          <path d="M86 98 L94 110 L100 102 L106 102 L112 110 L122 98" fill="#1A093D" stroke="rgba(162,143,255,0.7)" strokeWidth="1" />

          {/* Shadow Aura Ribbons */}
          <path
            d="M74 125 C62 135 55 155 60 170 C70 165 75 145 78 132 Z"
            fill="rgba(139,92,246,0.6)"
            style={{ filter: "blur(2px)" }}
          />
          <path
            d="M144 125 C156 135 163 155 158 170 C148 165 143 145 140 132 Z"
            fill="rgba(139,92,246,0.6)"
            style={{ filter: "blur(2px)" }}
          />

          {/* Boots */}
          <path d="M88 175 L84 195 L98 195 L96 175 Z" fill="#060312" stroke="rgba(162,143,255,0.5)" strokeWidth="0.8" />
          <path d="M108 175 L106 195 L120 195 L116 175 Z" fill="#060312" stroke="rgba(162,143,255,0.5)" strokeWidth="0.8" />
        </g>

        {/* Gradients */}
        <defs>
          <linearGradient id="dragonHeadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7B2CFF" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#35106F" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0B041C" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="dragonHornGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#5B21B6" />
            <stop offset="100%" stopColor="#A855F7" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

/** Animated Level Core Ring SVG */
function LevelRing({ level, xpPercent }: { level: number; xpPercent: number }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - xpPercent / 100);

  return (
    <div className="relative flex flex-col items-center justify-center flex-shrink-0" style={{ width: 90, height: 90 }}>
      {/* Concentric rotating outer HUD rings */}
      <svg className="absolute inset-0" width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r="42" stroke="rgba(139,92,246,0.25)" strokeWidth="1" fill="none"
          strokeDasharray="4 4" style={{ animation: "energy-rotate 20s linear infinite", transformOrigin: "45px 45px" }} />
        <circle cx="45" cy="45" r={radius} stroke="rgba(46,16,101,0.9)" strokeWidth="4.5" fill="none" />
        <circle
          cx="45" cy="45" r={radius}
          stroke="url(#levelGradHero)"
          strokeWidth="4.5"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 45 45)"
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
        <circle cx="45" cy="45" r="26" stroke="rgba(162,143,255,0.2)" strokeWidth="1" fill="none"
          style={{ animation: "energy-rotate-r 15s linear infinite", transformOrigin: "45px 45px" }} />
        <defs>
          <linearGradient id="levelGradHero" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="50%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#C0B2FF" />
          </linearGradient>
        </defs>
      </svg>

      {/* Center Level Content */}
      <div className="relative flex flex-col items-center justify-center text-center"
        style={{ animation: "level-ring 3s ease-in-out infinite" }}>
        <span className="font-mono text-[7px] uppercase tracking-widest text-arc-400/80">LEVEL</span>
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
            <p className="mt-0.5 font-mono text-[9px] text-arc-400/70 italic">— System</p>
          </div>
        </div>

        {/* ── CENTER: Epic Shadow Dragon + Hunter Artwork ──────────────────── */}
        <div className="relative flex-shrink-0 flex items-end justify-center h-full w-40 sm:w-52">
          <FlameLayers />
          <div
            ref={charRef}
            className="relative gpu-accelerate h-full w-full"
            style={{
              transition: "transform 0.1s ease-out",
              zIndex: 2,
            }}
          >
            <ShadowDragonAndHunter />
          </div>
        </div>

        {/* ── RIGHT: Hunter Level Core & Stats ───────────────────── */}
        <div className="flex-shrink-0 flex items-center gap-3 pl-3 border-l border-arc-500/20">
          <div className="flex flex-col justify-center gap-1 min-w-[130px]">
            <div>
              <p className="font-mono text-[8px] uppercase tracking-widest text-arc-500/60">HUNTER</p>
              <div className="flex items-center gap-1.5">
                <p className="font-display text-sm font-bold text-white leading-none truncate">{user.display_name}</p>
                <svg className="h-3 w-3 text-arc-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
                </svg>
              </div>
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

            <div className="grid grid-cols-3 gap-1 pt-0.5 text-center font-mono text-[8px]">
              <div className="rounded border border-arc-500/15 bg-void/50 p-0.5">
                <p className="text-ink-faint text-[7px]">RANK</p>
                <p className="font-bold text-amber-400">{rank}</p>
              </div>
              <div className="rounded border border-arc-500/15 bg-void/50 p-0.5">
                <p className="text-ink-faint text-[7px]">TITLE</p>
                <p className="font-bold text-arc-300 truncate">{title}</p>
              </div>
              <div className="rounded border border-arc-500/15 bg-void/50 p-0.5">
                <p className="text-ink-faint text-[7px]">CLASS</p>
                <p className="font-bold text-white truncate">{classTitle}</p>
              </div>
            </div>
          </div>

          <LevelRing level={character.level} xpPercent={character.xp_progress_percent} />
        </div>
      </div>
    </div>
  );
}
