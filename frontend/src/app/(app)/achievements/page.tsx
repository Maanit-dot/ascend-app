"use client";

import { useEffect, useState } from "react";
import { Loader2, Lock, Trophy } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { achievementApi, userApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Achievement, AscendUser, Title } from "@/types";
import { useUserStore } from "@/store/useUserStore";
import { useUIStore } from "@/store/useUIStore";

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [titles, setTitles] = useState<Title[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);
  const pushToast = useUIStore((s) => s.pushToast);

  useEffect(() => {
    Promise.all([achievementApi.list(), achievementApi.listTitles()]).then(([a, t]) => {
      setAchievements(a);
      setTitles(t);
      setIsLoading(false);
    });
  }, []);

  async function handleEquipTitle(titleId: string) {
    try {
      const updated = await userApi.updateProfile({ active_title_id: titleId });
      setUser(updated as unknown as AscendUser);
      pushToast({ variant: "success", title: "Title equipped" });
    } catch {
      pushToast({ variant: "danger", title: "Could not equip title" });
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-primary">Achievements</h1>
        <p className="mt-1 font-body text-sm text-ink-muted">
          Milestones earned through sustained discipline. Some are hidden until unlocked.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-arc-400" />
        </div>
      ) : (
        <>
          {titles.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-base font-semibold text-ink-primary">Titles</h2>
              <div className="flex flex-wrap gap-2.5">
                {titles.map((title) => {
                  const isActive = user?.character.active_title_id === title.id;
                  return (
                    <button
                      key={title.id}
                      onClick={() => handleEquipTitle(title.id)}
                      title={title.description}
                      className={cn(
                        "rounded-full border px-4 py-2 font-body text-sm font-medium transition-all",
                        isActive
                          ? "border-arc-500 bg-arc-500/15 text-arc-300 shadow-glow-arc"
                          : "border-panel-border bg-panel/50 text-ink-secondary hover:border-arc-500/40"
                      )}
                    >
                      {title.display_text}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-3 font-display text-base font-semibold text-ink-primary">Milestones</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {achievements.map((achievement) => {
                const isUnlocked = !!achievement.unlocked_at;
                return (
                  <GlassCard
                    key={achievement.key}
                    padding="md"
                    glow={isUnlocked ? "amber" : "none"}
                    className={cn(!isUnlocked && "opacity-60")}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border",
                          isUnlocked
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                            : "border-panel-border bg-void/40 text-ink-faint"
                        )}
                      >
                        {isUnlocked ? <Trophy className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
                      </div>
                      <div>
                        <h3 className="font-body text-sm font-semibold text-ink-primary">
                          {achievement.name}
                        </h3>
                        <p className="mt-0.5 font-body text-xs text-ink-muted">{achievement.description}</p>
                        <p className="hud-label mt-1.5 text-amber-400">+{achievement.xp_reward} XP</p>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
