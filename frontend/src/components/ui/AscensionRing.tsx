"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AscensionRingProps {
  level: number;
  progressPercent: number; // 0-100 toward next level
  size?: number;
  streakDays?: number;
  className?: string;
}

/**
 * ASCEND's signature visual: a segmented ring HUD (not a generic circular
 * progress bar). The ring is divided into 24 discrete segments — echoing an
 * instrument dial rather than a loading spinner — that illuminate in
 * sequence as XP accrues toward the next level. The level number sits at
 * the center like a cockpit readout; a small flame glyph + streak count
 * orbits the base when the user has an active streak.
 */
export function AscensionRing({
  level,
  progressPercent,
  size = 168,
  streakDays = 0,
  className,
}: AscensionRingProps) {
  const segmentCount = 24;
  const litSegments = Math.round((progressPercent / 100) * segmentCount);
  const radius = size / 2;
  const segmentRadius = radius - 10;

  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Level ${level}, ${progressPercent.toFixed(0)}% progress to next level`}
    >
      {/* Ambient glow behind the ring */}
      <div className="absolute inset-0 rounded-full bg-arc-500/10 blur-2xl" />

      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
        {Array.from({ length: segmentCount }).map((_, i) => {
          const angle = (i / segmentCount) * 2 * Math.PI - Math.PI / 2;
          const gapAngle = (2 * Math.PI) / segmentCount;
          const segLength = gapAngle * 0.62;
          const startAngle = angle - segLength / 2;
          const endAngle = angle + segLength / 2;

          const x1 = radius + segmentRadius * Math.cos(startAngle);
          const y1 = radius + segmentRadius * Math.sin(startAngle);
          const x2 = radius + segmentRadius * Math.cos(endAngle);
          const y2 = radius + segmentRadius * Math.sin(endAngle);

          const isLit = i < litSegments;

          return (
            <motion.path
              key={i}
              d={`M ${x1} ${y1} A ${segmentRadius} ${segmentRadius} 0 0 1 ${x2} ${y2}`}
              stroke={isLit ? "url(#ascend-ring-gradient)" : "rgba(255,255,255,0.08)"}
              strokeWidth={isLit ? 4 : 3}
              strokeLinecap="round"
              fill="none"
              initial={false}
              animate={{ opacity: isLit ? 1 : 0.5 }}
              transition={{ duration: 0.4, delay: isLit ? i * 0.015 : 0 }}
            />
          );
        })}
        <defs>
          <linearGradient id="ascend-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9481FF" />
            <stop offset="60%" stopColor="#7C5CFF" />
            <stop offset="100%" stopColor="#35E7C7" />
          </linearGradient>
        </defs>
      </svg>

      {/* Center readout */}
      <div className="relative flex flex-col items-center">
        <span className="hud-label">Level</span>
        <span className="font-display text-4xl font-bold leading-none text-ink-primary">{level}</span>
        {streakDays > 0 && (
          <div className="mt-2 flex items-center gap-1 rounded-full border border-panel-border bg-void/60 px-2 py-0.5">
            <span className="text-[13px]" aria-hidden>
              🔥
            </span>
            <span className="font-mono text-[11px] font-semibold text-amber-400">{streakDays}d</span>
          </div>
        )}
      </div>
    </div>
  );
}
