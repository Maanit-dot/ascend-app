"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  level: number;
  total_xp: number;
  title: string;
  is_current_user: boolean;
}

export function LeaderboardMiniPanel() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<LeaderboardEntry[]>("/users/leaderboard?limit=4")
      .then((data) => {
        if (Array.isArray(data)) {
          setEntries(data);
        }
      })
      .catch(() => {
        setEntries([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="hud-panel p-3 space-y-2 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-xs font-bold tracking-wider text-ink-primary">
            LEADERBOARD
          </h3>
          <span className="rounded bg-arc-500/10 border border-arc-500/20 px-1.5 py-0.5 font-mono text-[8px] text-arc-400">
            THIS WEEK
          </span>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 space-y-1.5 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-arc-500/30 border-t-arc-400" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-4 gap-1">
            <p className="font-mono text-[9px] text-ink-faint">No rankings recorded yet.</p>
          </div>
        ) : (
          entries.slice(0, 4).map((entry) => {
            const rankColor =
              entry.rank === 1
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : entry.rank === 2
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                : entry.rank === 3
                ? "bg-orange-500/20 text-orange-300 border-orange-500/40"
                : "bg-void border-arc-500/15 text-ink-muted";

            return (
              <div
                key={entry.user_id}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-2 py-1.5 transition-colors",
                  entry.is_current_user
                    ? "border-arc-500/40 bg-arc-500/15 shadow-glow-arc-sm"
                    : "border-arc-500/10 bg-arc-500/5 hover:border-arc-500/20"
                )}
              >
                {/* Rank number badge */}
                <div
                  className={cn(
                    "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border font-mono text-[10px] font-bold",
                    rankColor
                  )}
                >
                  {entry.rank}
                </div>

                {/* Hunter Name */}
                <div className="flex-1 min-w-0">
                  <p className="font-display text-[11px] font-semibold text-ink-primary truncate leading-tight">
                    {entry.display_name} {entry.is_current_user && <span className="text-arc-400 text-[9px] font-normal">(You)</span>}
                  </p>
                </div>

                {/* Total XP */}
                <div className="flex-shrink-0 font-mono text-[9px] font-semibold text-amber-400">
                  {entry.total_xp.toLocaleString()} XP
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer link */}
      <Link
        href="/social"
        className="block text-center font-mono text-[9px] text-arc-400 hover:text-arc-300 transition-colors pt-1 border-t border-arc-500/10"
      >
        VIEW FULL LEADERBOARD →
      </Link>
    </div>
  );
}
