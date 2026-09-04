"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: LucideIcon;
  customIcon?: React.ReactNode;
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
  customIcon,
  trend,
  trendUp,
  accentClass = "text-ink-primary",
  glowClass = "shadow-glow-arc",
  iconBgClass = "from-arc-700 to-arc-900",
}: KpiCardProps) {
  return (
    <div className="hud-panel relative flex flex-col justify-between p-2 h-full bg-[#0A051A]/85 border border-arc-500/30 rounded-xl group hover:border-arc-400/50 transition-all duration-200 overflow-hidden select-none">
      {/* Top: label + icon */}
      <div className="flex items-center justify-between gap-1">
        <span className="font-mono text-[7px] uppercase tracking-wider text-arc-400/70 truncate font-bold">{label}</span>
        <div className={cn(
          "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br border border-white/10",
          iconBgClass,
          glowClass,
        )}>
          {customIcon ? customIcon : Icon ? <Icon className="h-3 w-3 text-white opacity-90" /> : null}
        </div>
      </div>

      {/* Main value + trend */}
      <div className="flex items-baseline justify-between gap-1 leading-none mt-0.5">
        <div className="flex items-baseline gap-0.5 min-w-0">
          <span className={cn("font-display text-sm sm:text-base font-bold tabular-nums truncate", accentClass)}>
            {value}
          </span>
          {subValue && (
            <span className="font-mono text-[7px] text-ink-faint flex-shrink-0">{subValue}</span>
          )}
        </div>

        {trend && (
          <span className={cn(
            "font-mono text-[7px] font-medium flex-shrink-0 text-right truncate max-w-[45%]",
            trendUp ? "text-emerald-400" : "text-arc-300"
          )}>
            {trend}
          </span>
        )}
      </div>

      {/* Hover bottom edge glow */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-arc-500/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
}
