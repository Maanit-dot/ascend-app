"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0-100
  variant?: "arc" | "cyan" | "amber" | "crimson";
  label?: string;
  showPercent?: boolean;
  size?: "sm" | "md";
  className?: string;
}

const VARIANT_GRADIENT: Record<NonNullable<ProgressBarProps["variant"]>, string> = {
  arc: "bg-gradient-to-r from-arc-600 via-arc-500 to-arc-400",
  cyan: "bg-gradient-to-r from-cyan-600 via-cyan-500 to-cyan-400",
  amber: "bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300",
  crimson: "bg-gradient-to-r from-crimson-600 via-crimson-500 to-crimson-400",
};

export function ProgressBar({
  value,
  variant = "arc",
  label,
  showPercent = false,
  size = "md",
  className,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("w-full", className)}>
      {(label || showPercent) && (
        <div className="mb-1.5 flex items-center justify-between">
          {label && <span className="hud-label">{label}</span>}
          {showPercent && <span className="stat-value text-xs">{clamped.toFixed(0)}%</span>}
        </div>
      )}
      <div className={cn("progress-track", size === "sm" ? "h-1.5" : "h-2.5")}>
        <motion.div
          className={cn("progress-fill", VARIANT_GRADIENT[variant])}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}
