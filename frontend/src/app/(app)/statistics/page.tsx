"use client";

import { useEffect, useState } from "react";
import { Loader2, Shield, Zap, Flame, Trophy, Award, Heart, Activity, Dumbbell, BookOpen, Sparkles, Brain, Compass } from "lucide-react";
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

interface StatCardProps {
  name: string;
  code: string;
  value: number;
  description: string;
  icon: React.ElementType;
  color: string;
  borderGlow: string;
}

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

  const statCards: StatCardProps[] = [
    { name: "Knowledge", code: "KNW", value: stats.knowledge, description: "Mastery of subjects, exam prep, and academic problem solving.", icon: BookOpen, color: "text-arc-400", borderGlow: "border-arc-500/30 bg-arc-500/5" },
    { name: "Strength", code: "STR", value: stats.strength, description: "Physical power, resistance training, and muscular endurance.", icon: Dumbbell, color: "text-crimson-400", borderGlow: "border-crimson-500/30 bg-crimson-500/5" },
    { name: "Stamina", code: "STA", value: stats.stamina, description: "Cardiovascular capacity, longevity, and high-energy output.", icon: Activity, color: "text-cyan-400", borderGlow: "border-cyan-500/30 bg-cyan-500/5" },
    { name: "Recovery", code: "RCV", value: stats.recovery, description: "Restorative sleep, stress reduction, and fatigue resistance.", icon: Heart, color: "text-emerald-400", borderGlow: "border-emerald-500/30 bg-emerald-500/5" },
    { name: "Focus", code: "FOC", value: stats.focus, description: "Deep-work concentration and immunity to digital distractions.", icon: Brain, color: "text-amber-400", borderGlow: "border-amber-500/30 bg-amber-500/5" },
    { name: "Discipline", code: "DSC", value: stats.discipline, description: "Sticking to routines and executing when motivation is low.", icon: Shield, color: "text-purple-400", borderGlow: "border-purple-500/30 bg-purple-500/5" },
    { name: "Consistency", code: "CNS", value: stats.consistency, description: "Sustaining daily habit loops without breaking streak momentum.", icon: Flame, color: "text-orange-400", borderGlow: "border-orange-500/30 bg-orange-500/5" },
    { name: "Agility", code: "AGI", value: stats.agility, description: "Physical flexibility, mobility work, and body mechanics.", icon: Zap, color: "text-yellow-400", borderGlow: "border-yellow-500/30 bg-yellow-500/5" },
    { name: "Speed", code: "SPD", value: stats.speed, description: "Task completion velocity and rapid reaction time.", icon: Sparkles, color: "text-teal-400", borderGlow: "border-teal-500/30 bg-teal-500/5" },
    { name: "Potential", code: "POT", value: stats.potential, description: "Unlocking bonus multiplier growth and long-term attribute caps.", icon: Compass, color: "text-indigo-400", borderGlow: "border-indigo-500/30 bg-indigo-500/5" },
    { name: "Luck", code: "LCK", value: stats.luck, description: "Probability of rare item drops and mystery chest roll quality.", icon: Award, color: "text-pink-400", borderGlow: "border-pink-500/30 bg-pink-500/5" },
    { name: "Mental Fortitude", code: "MFT", value: stats.mental_fortitude, description: "Overcoming burnout risk and resisting psychological fatigue.", icon: Trophy, color: "text-rose-400", borderGlow: "border-rose-500/30 bg-rose-500/5" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-primary">Statistics & Character Sheet</h1>
        <p className="mt-1 font-body text-sm text-ink-muted">
          Your 12 core RPG attributes, radar distribution, and discipline insights.
        </p>
      </div>

      {/* ── 12 Attribute Stats Grid ── */}
      <div>
        <h2 className="mb-3 font-display text-base font-bold tracking-wider text-ink-primary">
          CHARACTER ATTRIBUTE SHEET (12 STATS)
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {statCards.map((st) => {
            const Icon = st.icon;
            return (
              <div
                key={st.code}
                className={cn(
                  "relative rounded-xl border p-4 transition-all duration-200 hover:scale-[1.01]",
                  st.borderGlow
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("h-4 w-4", st.color)} />
                    <span className="font-display text-sm font-bold text-ink-primary">{st.name}</span>
                  </div>
                  <span className={cn("font-mono text-xs font-bold uppercase tracking-wider", st.color)}>
                    {st.code}
                  </span>
                </div>

                <div className="flex items-baseline justify-between mt-1">
                  <span className="font-display text-2xl font-bold text-white">{st.value}</span>
                  <span className="font-mono text-[10px] text-ink-faint">pts</span>
                </div>

                <p className="mt-2 font-body text-xs text-ink-muted leading-relaxed">
                  {st.description}
                </p>
              </div>
            );
          })}
        </div>
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
