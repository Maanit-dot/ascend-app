"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { BossCard } from "@/features/bosses/BossCard";
import { bossApi } from "@/lib/api";
import { useUIStore } from "@/store/useUIStore";
import type { Boss, BossParticipation } from "@/types";

export default function BossesPage() {
  const [bosses, setBosses] = useState<Boss[]>([]);
  const [participations, setParticipations] = useState<BossParticipation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const pushToast = useUIStore((s) => s.pushToast);

  const load = useCallback(async () => {
    setIsLoading(true);
    const [activeBosses, myParticipations] = await Promise.all([
      bossApi.getActive(),
      bossApi.getMyParticipations(),
    ]);
    setBosses(activeBosses);
    setParticipations(myParticipations);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleClaim(bossId: string) {
    try {
      const result = await bossApi.claimReward(bossId);
      pushToast({
        variant: "levelup",
        title: `+${result.xp_awarded} XP claimed`,
        description: result.leveled_up ? `Leveled up to ${result.new_level}!` : undefined,
      });
      await load();
    } catch {
      pushToast({ variant: "danger", title: "Could not claim reward" });
    }
  }

  const defeatedUnclaimed = participations.filter(
    (p) => p.boss.is_defeated && !p.reward_claimed
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-primary">Bosses & Raids</h1>
        <p className="mt-1 font-body text-sm text-ink-muted">
          Obstacles given form. Deplete their HP by completing quests during the active cycle.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-arc-400" />
        </div>
      ) : (
        <>
          {defeatedUnclaimed.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-base font-semibold text-amber-400">
                Rewards Ready to Claim
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {defeatedUnclaimed.map((p) => (
                  <BossCard key={p.boss.id} boss={p.boss} onClaim={() => handleClaim(p.boss.id)} />
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-3 font-display text-base font-semibold text-ink-primary">Active Cycle</h2>
            {bosses.length === 0 ? (
              <div className="glass-panel flex items-center justify-center py-12">
                <p className="font-body text-sm text-ink-muted">
                  No active bosses right now. New cycles begin every Monday and on the 1st of each month.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {bosses.map((boss) => (
                  <BossCard key={boss.id} boss={boss} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
