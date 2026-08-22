"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
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
      {/* Base energy glow — bottom-up */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-4/5"
        style={{
          background: "radial-gradient(ellipse at 50% 100%, rgba(109,40,217,0.55) 0%, rgba(91,33,182,0.3) 35%, transparent 70%)",
          filter: "blur(24px)",
          animation: "hero-aura 4s ease-in-out infinite",
        }}
      />
      {/* Left wing flame */}
      <div
        className="absolute bottom-0 left-[5%] w-1/3 h-3/4"
        style={{
          background: "radial-gradient(ellipse at 20% 100%, rgba(109,40,217,0.5) 0%, rgba(139,92,246,0.2) 40%, transparent 70%)",
          filter: "blur(18px)",
          animation: "flame-rise 3.5s ease-in-out infinite",
          transformOrigin: "bottom center",
        }}
      />
      {/* Right wing flame */}
      <div
        className="absolute bottom-0 right-[5%] w-1/3 h-3/4"
        style={{
          background: "radial-gradient(ellipse at 80% 100%, rgba(109,40,217,0.5) 0%, rgba(139,92,246,0.2) 40%, transparent 70%)",
          filter: "blur(18px)",
          animation: "flame-rise 4.2s ease-in-out infinite 0.7s",
          transformOrigin: "bottom center",
        }}
      />
      {/* Top crown energy */}
      <div
        className="absolute top-[8%] left-1/2 -translate-x-1/2 w-1/4 h-2/5"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, rgba(162,143,255,0.45) 0%, rgba(139,92,246,0.2) 50%, transparent 75%)",
          filter: "blur(12px)",
          animation: "flame-rise 3.0s ease-in-out infinite 1.4s",
          transformOrigin: "bottom center",
        }}
      />
      {/* Energy particles */}
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
      {/* Ground glow */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-4 rounded-full"
        style={{
          background: "radial-gradient(ellipse, rgba(139,92,246,0.6) 0%, transparent 70%)",
          filter: "blur(8px)",
        }}
      />
      {/* Hunter SVG */}
      <svg
        viewBox="0 0 120 180"
        className="h-full w-auto max-h-full"
        style={{
          filter: "drop-shadow(0 0 16px rgba(139,92,246,0.9)) drop-shadow(0 0 32px rgba(109,40,217,0.5))",
          animation: "float-y 6s ease-in-out infinite",
        }}
        fill="none"
      >
        {/* Head */}
        <ellipse cx="60" cy="22" rx="14" ry="16"
          fill="rgba(46,16,101,0.7)"
          stroke="rgba(162,143,255,0.7)" strokeWidth="1.2" />

        {/* Torso / coat */}
        <path d="M42 38 C38 52 35 72 37 100 L50 100 L55 75 L65 75 L70 100 L83 100 C85 72 82 52 78 38 Z"
          fill="rgba(30,10,70,0.85)"
          stroke="rgba(139,92,246,0.5)" strokeWidth="1" />

        {/* Coat details */}
        <path d="M55 38 L55 100" stroke="rgba(162,143,255,0.2)" strokeWidth="0.8" strokeDasharray="4,5" />
        <path d="M44 55 L50 55 M70 55 L76 55" stroke="rgba(162,143,255,0.3)" strokeWidth="0.8" />
        <path d="M43 70 L49 68 M71 68 L77 70" stroke="rgba(162,143,255,0.25)" strokeWidth="0.8" />

        {/* Left arm */}
        <path d="M42 40 C36 50 30 62 28 78 L35 80 L40 68 L46 50 Z"
          fill="rgba(46,16,101,0.7)"
          stroke="rgba(139,92,246,0.4)" strokeWidth="1" />

        {/* Right arm */}
        <path d="M78 40 C84 50 90 62 92 78 L85 80 L80 68 L74 50 Z"
          fill="rgba(46,16,101,0.7)"
          stroke="rgba(139,92,246,0.4)" strokeWidth="1" />

        {/* Sword/weapon right hand — glow effect */}
        <line x1="88" y1="82" x2="108" y2="42" stroke="rgba(162,143,255,0.9)" strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="108" cy="42" rx="4" ry="2" transform="rotate(-45 108 42)"
          fill="rgba(162,143,255,0.6)" />
        {/* Sword glow */}
        <line x1="88" y1="82" x2="108" y2="42" stroke="rgba(139,92,246,0.3)" strokeWidth="6" strokeLinecap="round" />

        {/* Legs */}
        <path d="M50 100 L48 145 L55 145 L60 120 L65 145 L72 145 L70 100 Z"
          fill="rgba(20,8,50,0.9)"
          stroke="rgba(139,92,246,0.35)" strokeWidth="1" />

        {/* Boots */}
        <path d="M48 145 L44 162 L58 162 L57 145 Z"
          fill="rgba(15,6,40,0.95)" stroke="rgba(162,143,255,0.4)" strokeWidth="0.8" />
        <path d="M63 145 L62 162 L76 162 L72 145 Z"
          fill="rgba(15,6,40,0.95)" stroke="rgba(162,143,255,0.4)" strokeWidth="0.8" />

        {/* Energy eye / face glow */}
        <circle cx="56" cy="20" r="3" fill="rgba(162,143,255,0.9)"
          style={{ filter: "blur(1px)", animation: "orb-pulse 3s ease-in-out infinite" }} />
        <circle cx="64" cy="20" r="3" fill="rgba(162,143,255,0.9)"
          style={{ filter: "blur(1px)", animation: "orb-pulse 3s ease-in-out infinite 0.5s" }} />

        {/* Energy lines on torso */}
        <path d="M52 50 L55 55 L52 60" stroke="rgba(162,143,255,0.5)" strokeWidth="0.8" fill="none" />
        <path d="M68 50 L65 55 L68 60" stroke="rgba(162,143,255,0.5)" strokeWidth="0.8" fill="none" />

        {/* Shadow at feet */}
        <ellipse cx="60" cy="170" rx="20" ry="4"
          fill="rgba(109,40,217,0.35)"
          style={{ filter: "blur(4px)" }} />
      </svg>
    </div>
  );
}

/** Animated level ring SVG */
function LevelRing({ level, xpPercent }: { level: number; xpPercent: number }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - xpPercent / 100);

  return (
    <div className="relative flex items-center justify-center" style={{ width: 110, height: 110 }}>
      {/* Outer decorative ring */}
      <svg className="absolute inset-0" width="110" height="110" viewBox="0 0 110 110">
        {/* Outer border ring */}
        <circle cx="55" cy="55" r="52" stroke="rgba(139,92,246,0.2)" strokeWidth="1" fill="none"
          strokeDasharray="4 4" style={{ animation: "energy-rotate 20s linear infinite", transformOrigin: "55px 55px" }} />
        {/* Track */}
        <circle cx="55" cy="55" r={radius} stroke="rgba(46,16,101,0.8)" strokeWidth="5" fill="none" />
        {/* Progress arc */}
        <circle
          cx="55" cy="55" r={radius}
          stroke="url(#levelGrad)"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 55 55)"
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
        {/* Inner decorative ring */}
        <circle cx="55" cy="55" r="36" stroke="rgba(139,92,246,0.15)" strokeWidth="1" fill="none"
          style={{ animation: "energy-rotate-r 15s linear infinite", transformOrigin: "55px 55px" }} />
        <defs>
          <linearGradient id="levelGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6D28D9" />
            <stop offset="100%" stopColor="#A28FFF" />
          </linearGradient>
        </defs>
      </svg>
      {/* Center content */}
      <div className="relative flex flex-col items-center justify-center text-center"
        style={{ animation: "level-ring 3s ease-in-out infinite" }}>
        <span className="font-mono text-[9px] uppercase tracking-widest text-arc-400/60">Level</span>
        <span className="font-display text-3xl font-bold text-white text-glow-arc leading-none">{level}</span>
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

  // Subtle mouse parallax on character
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
      className="hud-panel-elite relative overflow-hidden"
      style={{ minHeight: 200 }}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-hero-gradient pointer-events-none" style={{ zIndex: 0 }} />
      {/* Cyber grid overlay */}
      <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none" style={{ zIndex: 0 }} />
      {/* Top edge highlight */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-arc-500/60 to-transparent pointer-events-none" style={{ zIndex: 3 }} />
      {/* Scan line */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute left-0 right-0 h-px bg-arc-400/10 animate-scan-line" />
      </div>

      <div className="relative flex items-stretch gap-0 p-0" style={{ zIndex: 2 }}>

        {/* ── LEFT: System Status + Motivational Message ─────────── */}
        <div className="flex flex-col justify-center px-6 py-5 gap-3 flex-1 min-w-0" style={{ flex: "0 0 32%" }}>
          {/* System active badge */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-emerald-400">System Active</span>
          </div>

          {/* Message */}
          <div>
            <p className="font-display text-[15px] font-bold text-ink-primary leading-snug"
              style={{ maxWidth: 240 }}>
              {motivationalMsg}
            </p>
            <p className="mt-2 font-mono text-[10px] text-arc-400/60 italic">— System</p>
          </div>

          {/* Corner bracket accent */}
          <div className="absolute bottom-3 left-6">
            <span className="font-mono text-[8px] text-arc-500/30 tracking-widest">SYS.V3.0.0</span>
          </div>
        </div>

        {/* ── CENTER: Animated Hunter Character ──────────────────── */}
        <div
          className="relative flex-shrink-0 flex items-end justify-center"
          style={{ flex: "0 0 36%", minHeight: 200 }}
        >
          {/* Flame / energy layer behind character */}
          <FlameLayers />

          {/* Character silhouette with parallax */}
          <div
            ref={charRef}
            className="relative gpu-accelerate"
            style={{
              height: "100%",
              width: "100%",
              transition: "transform 0.1s ease-out",
              zIndex: 2,
            }}
          >
            <HunterSilhouette />
          </div>

          {/* Bottom ground-level glow */}
          <div
            className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none"
            style={{
              background: "linear-gradient(to top, rgba(109,40,217,0.4), transparent)",
              zIndex: 1,
            }}
          />
        </div>

        {/* ── RIGHT: Hunter Stats + Level Ring ───────────────────── */}
        <div
          className="flex-shrink-0 flex flex-col justify-center gap-3 px-5 py-4 border-l border-arc-500/20"
          style={{ flex: "0 0 32%" }}
        >
          {/* Hunter label + name */}
          <div>
            <p className="font-mono text-[9px] uppercase tracking-widest text-arc-500/60">Hunter</p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="font-display text-xl font-bold text-white leading-none">{user.display_name}</p>
              {/* Star symbol */}
              <svg className="h-4 w-4 text-arc-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
              </svg>
            </div>
          </div>

          {/* XP bar */}
          <div style={{ minWidth: 150 }}>
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

          {/* Level ring + stats row */}
          <div className="flex items-center gap-4">
            <LevelRing level={character.level} xpPercent={character.xp_progress_percent} />

            <div className="flex flex-col gap-2">
              {[
                { label: "Rank",  value: rank },
                { label: "Title", value: title },
                { label: "Class", value: classTitle },
              ].map((item) => (
                <div key={item.label}>
                  <p className="system-label mb-0.5">{item.label}</p>
                  <p className="font-mono text-[11px] font-bold text-ink-secondary truncate">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
