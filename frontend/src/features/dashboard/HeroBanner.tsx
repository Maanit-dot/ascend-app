"use client";

import { useEffect, useRef } from "react";
import type { DailyQuestBoard } from "@/types";
import type { AscendUser } from "@/types";
import { getHunterTitle, getHunterRank } from "@/lib/format";

interface HeroBannerProps {
  user: AscendUser;
  board: DailyQuestBoard | null;
}

/** Layered purple plasma fire and energy particles */
function FlameLayers() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-full"
        style={{
          background: "radial-gradient(ellipse at 50% 100%, rgba(168,85,247,0.55) 0%, rgba(124,58,237,0.35) 40%, rgba(53,16,111,0.15) 70%, transparent 85%)",
          filter: "blur(22px)",
          animation: "hero-aura 4s ease-in-out infinite",
        }}
      />
      <div
        className="absolute bottom-0 left-[10%] w-2/5 h-full"
        style={{
          background: "radial-gradient(ellipse at 30% 100%, rgba(192,178,255,0.45) 0%, rgba(124,58,237,0.25) 45%, transparent 75%)",
          filter: "blur(18px)",
          animation: "flame-rise 3.5s ease-in-out infinite",
          transformOrigin: "bottom center",
        }}
      />
      <div
        className="absolute bottom-0 right-[10%] w-2/5 h-full"
        style={{
          background: "radial-gradient(ellipse at 70% 100%, rgba(192,178,255,0.45) 0%, rgba(124,58,237,0.25) 45%, transparent 75%)",
          filter: "blur(18px)",
          animation: "flame-rise 4.2s ease-in-out infinite 0.7s",
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

/** Epic Shadow Dragon Head + Anime Shadow Hunter Silhouette SVG */
function ShadowDragonAndHunter() {
  return (
    <div className="relative w-full h-full flex items-end justify-center" style={{ zIndex: 2 }}>
      {/* Ground purple plasma glow */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-44 h-4 rounded-full"
        style={{
          background: "radial-gradient(ellipse, rgba(168,85,247,0.9) 0%, rgba(124,58,237,0.5) 50%, transparent 80%)",
          filter: "blur(6px)",
        }}
      />

      <svg
        viewBox="0 0 220 200"
        className="h-full w-auto max-h-full drop-shadow-[0_0_24px_rgba(168,85,247,0.9)]"
        style={{ animation: "float-y 6s ease-in-out infinite" }}
        fill="none"
      >
        {/* ── Shadow Dragon Head Silhouette ──────── */}
        <g opacity="0.9" style={{ filter: "drop-shadow(0 0 16px rgba(168,85,247,0.95))" }}>
          {/* Dragon Snout & Jaws */}
          <path
            d="M20 55 C38 28 80 15 115 26 C135 32 150 48 145 72 C130 68 105 60 85 66 C65 72 40 85 20 55 Z"
            fill="url(#dragonHeadGrad)"
          />
          {/* Dragon Horns */}
          <path
            d="M95 20 C110 2 140 -2 155 8 C140 16 120 20 105 24 Z"
            fill="url(#dragonHornGrad)"
          />
          <path
            d="M75 28 C85 10 110 6 125 14 C112 22 98 26 85 30 Z"
            fill="url(#dragonHornGrad)"
          />
          {/* Dragon Glowing Eye */}
          <ellipse cx="74" cy="44" rx="5" ry="3" fill="#00E5FF" style={{ filter: "blur(0.8px)" }} />
          <circle cx="74" cy="44" r="2" fill="#FFFFFF" />
          {/* Dragon Teeth & Flame Breath Trails */}
          <path
            d="M32 60 L38 66 L44 61 L50 67 L56 62 L62 68 L68 63"
            stroke="rgba(192,178,255,0.95)"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M15 65 C5 60 0 75 10 85 C20 95 40 85 30 70 Z"
            fill="rgba(168,85,247,0.5)"
            style={{ filter: "blur(4px)" }}
          />
        </g>

        {/* ── Anime Shadow Hunter Silhouette ─── */}
        <g style={{ filter: "drop-shadow(0 0 12px rgba(124,58,237,0.95))" }}>
          {/* Hair & Head */}
          <path
            d="M110 70 C100 70 95 82 97 96 C103 96 110 92 115 92 C120 92 125 96 131 96 C133 82 128 70 118 70 Z"
            fill="#1E0A46"
            stroke="rgba(192,178,255,0.9)"
            strokeWidth="1"
          />
          {/* Hair Spikes */}
          <path d="M106 72 L100 60 L110 66 L118 56 L122 66 L132 60 L126 74" fill="#2E1065" />

          {/* Eyes Glow */}
          <circle cx="108" cy="85" r="2.2" fill="#00E5FF" style={{ filter: "blur(0.5px)" }} />
          <circle cx="116" cy="85" r="2.2" fill="#00E5FF" style={{ filter: "blur(0.5px)" }} />

          {/* Coat & Collar */}
          <path
            d="M94 100 C88 118 85 140 87 175 L110 175 L116 145 L122 145 L128 175 L151 175 C153 140 150 118 144 100 Z"
            fill="#0F0628"
            stroke="rgba(168,85,247,0.7)"
            strokeWidth="1.2"
          />
          <path d="M96 98 L104 110 L110 102 L116 102 L122 110 L132 98" fill="#1A093D" stroke="rgba(192,178,255,0.8)" strokeWidth="1" />

          {/* Shadow Aura Ribbons */}
          <path
            d="M84 125 C72 135 65 155 70 170 C80 165 85 145 88 132 Z"
            fill="rgba(168,85,247,0.65)"
            style={{ filter: "blur(2px)" }}
          />
          <path
            d="M154 125 C166 135 173 155 168 170 C158 165 153 145 150 132 Z"
            fill="rgba(168,85,247,0.65)"
            style={{ filter: "blur(2px)" }}
          />

          {/* Boots */}
          <path d="M98 175 L94 195 L108 195 L106 175 Z" fill="#060312" stroke="rgba(192,178,255,0.5)" strokeWidth="0.8" />
          <path d="M118 175 L116 195 L130 195 L126 175 Z" fill="#060312" stroke="rgba(192,178,255,0.5)" strokeWidth="0.8" />
        </g>

        {/* Gradients */}
        <defs>
          <linearGradient id="dragonHeadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9333EA" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#4C1D95" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#0B041C" stopOpacity="0.98" />
          </linearGradient>
          <linearGradient id="dragonHornGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6D28D9" />
            <stop offset="100%" stopColor="#C084FC" />
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
    <div className="relative flex flex-col items-center justify-center flex-shrink-0" style={{ width: 92, height: 92 }}>
      {/* Concentric rotating outer HUD rings */}
      <svg className="absolute inset-0" width="92" height="92" viewBox="0 0 92 92">
        <circle cx="46" cy="46" r="43" stroke="rgba(168,85,247,0.3)" strokeWidth="1" fill="none"
          strokeDasharray="4 4" style={{ animation: "energy-rotate 20s linear infinite", transformOrigin: "46px 46px" }} />
        <circle cx="46" cy="46" r={radius} stroke="rgba(53,16,111,0.95)" strokeWidth="4.5" fill="none" />
        <circle
          cx="46" cy="46" r={radius}
          stroke="url(#levelGradHero)"
          strokeWidth="4.5"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 46 46)"
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
        <circle cx="46" cy="46" r="26" stroke="rgba(192,178,255,0.25)" strokeWidth="1" fill="none"
          style={{ animation: "energy-rotate-r 15s linear infinite", transformOrigin: "46px 46px" }} />
        <defs>
          <linearGradient id="levelGradHero" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="50%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#E9D5FF" />
          </linearGradient>
        </defs>
      </svg>

      {/* Center Level Content */}
      <div className="relative flex flex-col items-center justify-center text-center"
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
      className="hud-panel-elite relative overflow-hidden h-full flex items-center"
    >
      <div className="absolute inset-0 bg-hero-gradient pointer-events-none" style={{ zIndex: 0 }} />
      <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none" style={{ zIndex: 0 }} />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-arc-500/80 to-transparent pointer-events-none" style={{ zIndex: 3 }} />
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute left-0 right-0 h-px bg-arc-400/15 animate-scan-line" />
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
            <p className="mt-0.5 font-mono text-[9px] text-arc-300 italic">— System</p>
          </div>
        </div>

        {/* ── CENTER: Epic Shadow Dragon + Anime Hunter Artwork ──────────────────── */}
        <div className="relative flex-shrink-0 flex items-end justify-center h-full w-44 sm:w-56">
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

          <LevelRing level={character.level} xpPercent={character.xp_progress_percent} />
        </div>
      </div>
    </div>
  );
}
