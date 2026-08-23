"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string;
  level: number;
  total_xp: number;
  is_current_user: boolean;
}

const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, user_id: "1", display_name: "Aryan", level: 142, total_xp: 98450, is_current_user: false },
  { rank: 2, user_id: "2", display_name: "Maanit", level: 24, total_xp: 78430, is_current_user: true },
  { rank: 3, user_id: "3", display_name: "Rohan", level: 115, total_xp: 61200, is_current_user: false },
  { rank: 4, user_id: "4", display_name: "Priyanshu", level: 98, total_xp: 42880, is_current_user: false },
];

export function LeaderboardMiniPanel() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(DEFAULT_LEADERBOARD);

  useEffect(() => {
    api
      .get<LeaderboardEntry[]>("/users/leaderboard?limit=4")
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setEntries(data);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="hud-panel p-2.5 h-full flex flex-col justify-between overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <h3 className="font-display text-[11px] font-bold tracking-wider text-white">
            LEADERBOARD
          </h3>
          <span className="rounded bg-arc-500/10 border border-arc-500/20 px-1 font-mono text-[7px] text-arc-400">
            THIS WEEK
          </span>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 space-y-0.5 overflow-y-auto pr-1 my-1 scrollbar-thin">
        {entries.slice(0, 4).map((entry) => {
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
                "flex items-center gap-1.5 rounded border px-1.5 py-0.5 transition-colors",
                entry.is_current_user
                  ? "border-arc-500/40 bg-arc-500/15 shadow-glow-arc-sm"
                  : "border-arc-500/10 bg-arc-500/5"
              )}
            >
              <div
                className={cn(
                  "flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border font-mono text-[8px] font-bold",
                  rankColor
                )}
              >
                {entry.rank}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-display text-[10px] font-semibold text-white truncate leading-tight">
                  {entry.display_name} {entry.is_current_user && <span className="text-arc-400 text-[8px] font-normal">(You)</span>}
                </p>
              </div>

              <div className="flex-shrink-0 font-mono text-[8px] font-semibold text-amber-400">
                {entry.total_xp.toLocaleString()} XP
              </div>
            </div>
          );
        })}
      </div>

      <Link
        href="/social"
        className="block text-center font-mono text-[8px] text-arc-400 hover:text-arc-300 pt-1 border-t border-arc-500/10 flex-shrink-0"
      >
        VIEW FULL LEADERBOARD →
      </Link>
    </div>
  );
}
