"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { GlassCard } from "@/components/ui/GlassCard";
import { aiApi } from "@/lib/api";
import { useUserStore } from "@/store/useUserStore";
import { cn } from "@/lib/utils";
import type { BurnoutInsight } from "@/types";

export default function StatisticsPage() {
  const user = useUserStore((s) => s.user);
  const [burnout, setBurnout] = useState<BurnoutInsight | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    aiApi.getBurnout().then((b) => {
      setBurnout(b);
      setIsLoading(false);
    });
  }, []);

  if (!user) return null;
  const { stats } = user.character;

  const radarData = [
    { stat: "KNW", value: stats.knowledge },
    { stat: "STR", value: stats.strength },
    { stat: "STA", value: stats.stamina },
    { stat: "RCV", value: stats.recovery },
    { stat: "FOC", value: stats.focus },
    { stat: "DSC", value: stats.discipline },
    { stat: "CNS", value: stats.consistency },
    { stat: "AGI", value: stats.agility },
    { stat: "SPD", value: stats.speed },
    { stat: "POT", value: stats.potential },
    { stat: "LCK", value: stats.luck },
    { stat: "MFT", value: stats.mental_fortitude },
  ];

  const riskColor: Record<BurnoutInsight["risk_level"], string> = {
    low: "text-cyan-400",
    moderate: "text-amber-400",
    high: "text-crimson-400",
    critical: "text-crimson-500",
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-primary">Statistics</h1>
        <p className="mt-1 font-body text-sm text-ink-muted">
          Your character sheet, visualized — and ARC&apos;s read on your sustainability.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GlassCard padding="md">
          <h2 className="mb-2 font-display text-base font-semibold text-ink-primary">Stat Distribution</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="75%">
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="stat" tick={{ fill: "#868DA6", fontSize: 11 }} />
                <PolarRadiusAxis tick={false} axisLine={false} />
                <Radar
                  dataKey="value"
                  stroke="#7C5CFF"
                  fill="#7C5CFF"
                  fillOpacity={0.35}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard padding="lg">
          <h2 className="mb-4 font-display text-base font-semibold text-ink-primary">
            Burnout Analysis
          </h2>
          {isLoading || !burnout ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-arc-400" />
            </div>
          ) : (
            <div>
              <div className="flex items-baseline gap-2">
                <span className={cn("font-display text-3xl font-bold", riskColor[burnout.risk_level])}>
                  {burnout.risk_level.toUpperCase()}
                </span>
                <span className="stat-value text-sm text-ink-muted">
                  {(burnout.score * 100).toFixed(0)}% risk score
                </span>
              </div>
              <p className="mt-3 font-body text-sm text-ink-secondary">{burnout.recommendation}</p>

              {burnout.contributing_factors.length > 0 && (
                <ul className="mt-4 space-y-1.5">
                  {burnout.contributing_factors.map((factor, i) => (
                    <li key={i} className="flex items-start gap-2 font-body text-xs text-ink-muted">
                      <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-crimson-400" />
                      {factor}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </GlassCard>
      </div>

      <GlassCard padding="lg">
        <h2 className="mb-3 font-display text-base font-semibold text-ink-primary">Progression Summary</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <SummaryStat label="Total XP" value={user.character.total_xp_earned.toLocaleString()} />
          <SummaryStat label="Current Streak" value={`${user.character.current_streak_days}d`} />
          <SummaryStat label="Longest Streak" value={`${user.character.longest_streak_days}d`} />
          <SummaryStat
            label="Difficulty"
            value={`×${user.character.difficulty_multiplier.toFixed(2)}`}
          />
        </div>
      </GlassCard>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-panel-border bg-void/40 p-4">
      <p className="hud-label">{label}</p>
      <p className="stat-value mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
