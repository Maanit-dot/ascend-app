"use client";

import { useUserStore } from "@/store/useUserStore";
import { GlassCard } from "@/components/ui/GlassCard";
import { Shield, Zap, Flame, Trophy, Award, Heart, Activity, Dumbbell, BookOpen, Sparkles, Brain, Compass } from "lucide-react";
import { getHunterTitle, getHunterRank } from "@/lib/format";
import { cn } from "@/lib/utils";

interface StatCardProps {
  name: string;
  code: string;
  value: number;
  description: string;
  icon: React.ElementType;
  color: string;
  borderGlow: string;
}

export default function CharacterPage() {
  const user = useUserStore((s) => s.user);

  if (!user) return null;
  const { character } = user;
  const { stats } = character;

  const currentTitle = getHunterTitle(character.level);
  const currentRank = getHunterRank(character.level);

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
        <h1 className="font-display text-2xl font-bold text-ink-primary">CHARACTER SHEET</h1>
        <p className="mt-1 font-body text-sm text-ink-muted">
          Your complete 12-stat attribute breakdown, vitals, rank, and progression sheet.
        </p>
      </div>

      <GlassCard padding="lg">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-arc-500 to-arc-800 opacity-80 blur-md animate-pulse-slow" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-arc-600 to-arc-900 border-2 border-arc-400 overflow-hidden shadow-glow-arc">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={user.avatar_url || "/hunter_avatar.jpg"}
                  alt={user.display_name}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-2xl font-bold text-white">{user.display_name}</h2>
                <span className="rounded border border-arc-500/40 bg-arc-500/15 px-2 py-0.5 font-mono text-xs font-bold text-arc-300">
                  Rank {currentRank}
                </span>
              </div>
              <p className="mt-0.5 font-mono text-xs text-arc-400">The {currentTitle}</p>
              <p className="mt-1 font-mono text-[11px] text-ink-muted">
                Track: <span className="uppercase text-ink-secondary">{user.primary_track}</span> • Joined {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-xl border border-arc-500/25 bg-void/60 p-4 md:w-80">
            <div className="flex items-center justify-between">
              <span className="system-label">LEVEL</span>
              <span className="font-display text-3xl font-bold text-arc-400 text-glow-arc">
                {character.level}
              </span>
            </div>
            <div className="flex justify-between font-mono text-xs text-ink-muted">
              <span>{character.current_xp.toLocaleString()} XP</span>
              <span>{character.xp_required_for_next_level.toLocaleString()} XP</span>
            </div>
            <div className="h-2 w-full rounded-full bg-void-deep overflow-hidden">
              <div
                className="h-full rounded-full bg-stat-bar-arc shadow-glow-arc-sm transition-all duration-700"
                style={{ width: `${character.xp_progress_percent}%` }}
              />
            </div>
            <p className="text-right font-mono text-[10px] text-arc-400">
              Total XP Earned: {character.total_xp_earned.toLocaleString()} XP
            </p>
          </div>
        </div>
      </GlassCard>

      <div>
        <h2 className="mb-3 font-display text-base font-bold tracking-wider text-ink-primary">
          CHARACTER STATS (12-ATTRIBUTE SHEET)
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
    </div>
  );
}
