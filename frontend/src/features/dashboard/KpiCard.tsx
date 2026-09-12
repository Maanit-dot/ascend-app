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
  cardBgClass?: string;
}

export function KpiCard({
  label,
  value,
  subValue,
  icon: Icon,
  customIcon,
  trend,
  trendUp,
  accentClass = "text-white",
  glowClass = "shadow-[0_0_10px_rgba(38,20,223,0.4)]",
  iconBgClass = "from-[#2614DF] to-[#4D30EC]",
  cardBgClass,
}: KpiCardProps) {
  return (
    <div className={cn(
      "hud-panel relative flex flex-col justify-between p-2 h-full rounded-xl group transition-all duration-200 overflow-hidden select-none border border-[#2614DF]/30 hover:border-[#01C0D7]/60 shadow-[0_0_10px_rgba(12,8,29,0.8)]",
      cardBgClass ?? "bg-gradient-to-br from-[#0C081D]/95 via-[#160B35]/90 to-[#0C081D]/95"
    )}>
      {/* Top: label + icon */}
      <div className="flex items-center justify-between gap-1">
        <span className="font-mono text-[7px] uppercase tracking-wider text-[#C0BEEF]/80 truncate font-bold">{label}</span>
        <div className={cn(
          "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br border border-white/10",
          iconBgClass,
          glowClass,
        )}>
          {customIcon ? customIcon : Icon ? <Icon className="h-3 w-3 text-white opacity-95" /> : null}
        </div>
      </div>

      {/* Main value + trend */}
      <div className="flex items-baseline justify-between gap-1 leading-none mt-0.5">
        <div className="flex items-baseline gap-0.5 min-w-0">
          <span className={cn("font-display text-sm sm:text-base font-bold tabular-nums truncate drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]", accentClass)}>
            {value}
          </span>
          {subValue && (
            <span className="font-mono text-[7px] text-[#C0BEEF]/60 flex-shrink-0">{subValue}</span>
          )}
        </div>

        {trend && (
          <span className={cn(
            "font-mono text-[7px] font-medium flex-shrink-0 text-right truncate max-w-[48%]",
            trendUp ? "text-[#00E5FF]" : "text-[#C0BEEF]"
          )}>
            {trend}
          </span>
        )}
      </div>

      {/* Hover bottom edge glow with cyan starburst accent */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00E5FF]/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-[0_0_8px_#00E5FF]" />
    </div>
  );
}
