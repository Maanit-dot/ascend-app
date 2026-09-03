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
  accentClass?: string;
  glowClass?: string;
  iconBgClass?: string;
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
    <div className="hud-panel relative flex flex-col justify-between p-2 h-full group hover:border-arc-500/40 transition-all duration-200 overflow-hidden">
      {/* Top: label + icon */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[8px] uppercase tracking-wider text-arc-500/60 truncate max-w-[80%]">{label}</span>
        <div className={cn(
          "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-gradient-to-br",
          iconBgClass,
          glowClass,
        )}>
          <Icon className="h-3 w-3 text-white opacity-90" />
        </div>
      </div>

      {/* Main value + trend */}
      <div className="flex items-baseline justify-between gap-1 leading-none mt-0.5">
        <div className="flex items-baseline gap-1 min-w-0">
          <span className={cn("font-display text-sm sm:text-base font-bold tabular-nums whitespace-nowrap", accentClass)}>
            {value}
          </span>
          {subValue && (
            <span className="font-mono text-[8px] text-ink-faint flex-shrink-0">{subValue}</span>
          )}
        </div>

        {trend && (
          <span className={cn(
            "font-mono text-[8px] font-medium flex-shrink-0 whitespace-nowrap",
            trendUp ? "text-emerald-400" : "text-ink-faint"
          )}>
            {trendUp ? "↑" : "→"} {trend}
          </span>
        )}
      </div>

      {/* Hover bottom edge glow */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-arc-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
}
