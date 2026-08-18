"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  accentClass?: string;     // text color class for value
  glowClass?: string;       // shadow class for icon area
  iconBgClass?: string;     // bg gradient class for icon pill
}

export function KpiCard({
  label,
  value,
  subValue,
  icon: Icon,
  trend,
  trendUp,
  accentClass = "text-ink-primary",
  glowClass = "shadow-glow-arc",
  iconBgClass = "from-arc-700 to-arc-900",
}: KpiCardProps) {
  return (
    <div className="kpi-card group hover:border-arc-500/40 transition-all duration-200">
      {/* Top: label + icon */}
      <div className="flex items-center justify-between mb-2">
        <span className="system-label">{label}</span>
        <div className={cn(
          "flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br",
          iconBgClass,
          glowClass,
        )}>
          <Icon className="h-3.5 w-3.5 text-white opacity-90" />
        </div>
      </div>

      {/* Main value */}
      <div className="flex items-baseline gap-1.5">
        <span className={cn("font-display text-2xl font-bold leading-none tabular-nums", accentClass)}>
          {value}
        </span>
        {subValue && (
          <span className="font-mono text-[10px] text-ink-faint">{subValue}</span>
        )}
      </div>

      {/* Trend line */}
      {trend && (
        <div className={cn(
          "mt-1.5 flex items-center gap-1 font-mono text-[9px]",
          trendUp ? "text-emerald-400" : "text-ink-faint"
        )}>
          <span>{trendUp ? "↑" : "→"}</span>
          <span>{trend}</span>
        </div>
      )}

      {/* Bottom glow line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-arc-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
