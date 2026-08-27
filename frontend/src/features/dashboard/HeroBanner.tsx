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
          background: "radial-gradient(ellipse at 50% 100%, rgba(168,85,247,0.65) 0%, rgba(124,58,237,0.4) 35%, rgba(53,16,111,0.2) 70%, transparent 85%)",
          filter: "blur(22px)",
          animation: "hero-aura 4s ease-in-out infinite",
        }}
      />
      <div
        className="absolute bottom-0 left-[10%] w-2/5 h-full"
        style={{
          background: "radial-gradient(ellipse at 30% 100%, rgba(192,178,255,0.5) 0%, rgba(124,58,237,0.3) 45%, transparent 75%)",
          filter: "blur(16px)",
          animation: "flame-rise 3.5s ease-in-out infinite",
          transformOrigin: "bottom center",
        }}
      />
      <div
        className="absolute bottom-0 right-[10%] w-2/5 h-full"
        style={{
          background: "radial-gradient(ellipse at 70% 100%, rgba(192,178,255,0.5) 0%, rgba(124,58,237,0.3) 45%, transparent 75%)",
          filter: "blur(16px)",
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

/** High-Detail Shadow Dragon Head + Anime Shadow Hunter Silhouette SVG */
function ShadowDragonAndHunter() {
  return (
    <div className="relative w-full h-full flex items-end justify-center" style={{ zIndex: 2 }}>
      {/* Ground purple plasma glow */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-4 rounded-full"
        style={{
          background: "radial-gradient(ellipse, rgba(168,85,247,0.95) 0%, rgba(124,58,237,0.6) 50%, transparent 80%)",
          filter: "blur(6px)",
        }}
      />

      <svg
        viewBox="0 0 240 210"
        className="h-full w-auto max-h-full drop-shadow-[0_0_24px_rgba(168,85,247,0.95)]"
        style={{ animation: "float-y 6s ease-in-out infinite" }}
        fill="none"
      >
        {/* ── Shadow Dragon Head Silhouette (Left / Back) ──────── */}
        <g opacity="0.95" style={{ filter: "drop-shadow(0 0 16px rgba(168,85,247,0.95))" }}>
          {/* Main Skull & Upper Jaw */}
          <path
            d="M15 65 C35 30 85 15 125 28 C150 35 168 55 160 85 C140 80 110 70 88 76 C65 82 38 98 15 65 Z"
            fill="url(#dragonHeadGrad)"
          />
          {/* Main Horn 1 */}
          <path
            d="M105 22 C125 0 160 -5 180 8 C160 18 135 22 118 26 Z"
            fill="url(#dragonHornGrad)"
          />
          {/* Main Horn 2 */}
          <path
            d="M85 30 C98 10 128 5 145 15 C130 24 112 28 95 32 Z"
            fill="url(#dragonHornGrad)"
          />
          {/* Dragon Snout Ridge */}
          <path
            d="M35 55 C50 40 80 32 105 38 L95 48 C75 42 50 48 35 55 Z"
            fill="rgba(192,178,255,0.3)"
          />

          {/* Dragon Glowing Cyan Eye */}
          <ellipse cx="80" cy="48" rx="6" ry="3.5" fill="#00E5FF" style={{ filter: "blur(0.8px)" }} />
          <circle cx="80" cy="48" r="2.2" fill="#FFFFFF" />
          {/* Eye Trail Light */}
          <path d="M84 48 Q100 46 115 50" stroke="#00E5FF" strokeWidth="1.5" opacity="0.8" />

          {/* Dragon Fangs & Jaws */}
          <path
            d="M28 70 L34 78 L42 71 L48 79 L56 72 L64 80 L70 73 M20 72 Q35 88 55 82"
            stroke="rgba(192,178,255,0.95)"
            strokeWidth="1.8"
            fill="none"
          />

          {/* Dragon Smoke / Plasma Breath Plumes */}
          <path
            d="M10 72 C-5 65 -10 85 5 95 C20 105 45 95 30 75 Z"
            fill="rgba(168,85,247,0.6)"
            style={{ filter: "blur(5px)" }}
          />
          <path
            d="M-5 85 C-15 95 0 110 15 105 C30 100 20 85 5 85 Z"
            fill="rgba(124,58,237,0.5)"
            style={{ filter: "blur(6px)" }}
          />
        </g>

        {/* ── Anime Shadow Hunter (Center / Front) ─── */}
        <g style={{ filter: "drop-shadow(0 0 14px rgba(124,58,237,0.95))" }}>
          {/* Spiky Anime Hair */}
          <path
            d="M120 72 L112 58 L122 65 L132 52 L136 65 L148 58 L140 72 L150 70 L142 82 L152 84 L138 92 C134 78 128 72 120 72 Z"
            fill="#2E1065"
            stroke="rgba(192,178,255,0.9)"
            strokeWidth="1"
          />
          <path d="M125 76 L118 85 C124 85 130 82 135 82 C140 82 145 86 150 86 L144 76 Z" fill="#1E0A46" />

          {/* Glowing Eyes */}
          <circle cx="126" cy="88" r="2.5" fill="#00E5FF" style={{ filter: "blur(0.5px)" }} />
          <circle cx="135" cy="88" r="2.5" fill="#00E5FF" style={{ filter: "blur(0.5px)" }} />

          {/* High Collar Coat & Cloak */}
          <path
            d="M104 105 C98 125 94 148 96 185 L122 185 L128 152 L134 152 L140 185 L166 185 C168 148 165 125 159 105 Z"
            fill="#0F0628"
            stroke="rgba(168,85,247,0.85)"
            strokeWidth="1.4"
          />
          {/* Coat Collar & Buttons */}
          <path d="M106 102 L116 116 L122 108 L128 108 L134 116 L144 102" fill="#1A093D" stroke="rgba(192,178,255,0.9)" strokeWidth="1.2" />
          <circle cx="125" cy="122" r="1.5" fill="#A855F7" />
          <circle cx="125" cy="134" r="1.5" fill="#A855F7" />
          <circle cx="125" cy="146" r="1.5" fill="#A855F7" />

          {/* Shadow Aura Ribbons Left & Right */}
          <path
            d="M92 130 C78 142 70 165 76 180 C88 175 93 152 96 138 Z"
            fill="rgba(168,85,247,0.7)"
            style={{ filter: "blur(2px)" }}
          />
          <path
            d="M170 130 C184 142 192 165 186 180 C174 175 169 152 166 138 Z"
            fill="rgba(168,85,247,0.7)"
            style={{ filter: "blur(2px)" }}
          />

          {/* Boots */}
          <path d="M108 185 L102 205 L118 205 L116 185 Z" fill="#060312" stroke="rgba(192,178,255,0.6)" strokeWidth="0.8" />
          <path d="M130 185 L128 205 L144 205 L138 185 Z" fill="#060312" stroke="rgba(192,178,255,0.6)" strokeWidth="0.8" />
        </g>

        {/* Gradients */}
        <defs>
          <linearGradient id="dragonHeadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A855F7" stopOpacity="0.98" />
            <stop offset="50%" stopColor="#6D28D9" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0B041C" stopOpacity="0.99" />
          </linearGradient>
          <linearGradient id="dragonHornGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#E9D5FF" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

/** Animated Level Core Ring SVG with Flaming Purple Ring */
function LevelRing({ level, xpPercent }: { level: number; xpPercent: number }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - xpPercent / 100);

  return (
    <div className="relative flex flex-col items-center justify-center flex-shrink-0" style={{ width: 100, height: 100 }}>
      {/* ── Flaming Purple Aura Ring background ── */}
      <div className="absolute inset-0 pointer-events-none rounded-full" style={{ zIndex: 0 }}>
        <div
          className="absolute -inset-2 rounded-full"
          style={{
            background: "conic-gradient(from 0deg, rgba(168,85,247,0.7), rgba(124,58,237,0.2), rgba(192,178,255,0.8), rgba(109,40,217,0.3), rgba(168,85,247,0.7))",
            filter: "blur(8px)",
            animation: "energy-rotate 12s linear infinite",
          }}
        />
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(168,85,247,0.4) 0%, rgba(124,58,237,0.2) 60%, transparent 85%)",
            filter: "blur(5px)",
            animation: "orb-pulse 3s ease-in-out infinite",
          }}
        />
      </div>

      {/* ── Concentric HUD SVG Rings ── */}
      <svg className="relative z-10" width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="46" stroke="rgba(168,85,247,0.35)" strokeWidth="1.2" fill="none"
          strokeDasharray="4 4" style={{ animation: "energy-rotate 20s linear infinite", transformOrigin: "50px 50px" }} />
        <circle cx="50" cy="50" r={radius} stroke="rgba(53,16,111,0.95)" strokeWidth="5" fill="none" />
        <circle
          cx="50" cy="50" r={radius}
          stroke="url(#levelGradHero)"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 50 50)"
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
        <circle cx="50" cy="50" r="27" stroke="rgba(192,178,255,0.3)" strokeWidth="1" fill="none"
          style={{ animation: "energy-rotate-r 15s linear infinite", transformOrigin: "50px 50px" }} />
        <defs>
          <linearGradient id="levelGradHero" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="50%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#E9D5FF" />
          </linearGradient>
        </defs>
      </svg>

      {/* ── Center Level Number & Crest ── */}
      <div className="absolute z-20 flex flex-col items-center justify-center text-center"
        style={{ animation: "level-ring 3s ease-in-out infinite" }}>
        <span className="font-mono text-[7px] uppercase tracking-widest text-arc-300 font-bold">LEVEL</span>
        <span className="font-display text-2xl font-bold text-white text-glow-arc leading-none">{level}</span>
        {/* Diamond Rank Crest */}
        <svg className="h-3.5 w-3.5 text-arc-400 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
        </svg>
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

        {/* ── CENTER: High-Detail Shadow Dragon + Anime Hunter Artwork ──────────────────── */}
        <div className="relative flex-shrink-0 flex items-end justify-center h-full w-48 sm:w-60">
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
