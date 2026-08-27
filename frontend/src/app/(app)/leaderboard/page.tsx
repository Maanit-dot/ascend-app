"use client";

import { useEffect, useState } from "react";
import { Medal, Trophy, Flame, Zap, Crown, Loader2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { useUserStore } from "@/store/useUserStore";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  id: string;
  display_name: string;
  avatar_url: string | null;
  level: number;
  total_xp_earned: number;
  current_streak_days: number;
  rank: string;
  title: string;
  is_online: boolean;
}

const RANK_COLORS: Record<number, string> = {
  1: "text-amber-400",
  2: "text-slate-300",
  3: "text-orange-400",
};

const RANK_BG: Record<number, string> = {
  1: "from-amber-500/20 to-amber-900/5 border-amber-500/30",
  2: "from-slate-400/15 to-slate-900/5 border-slate-400/25",
  3: "from-orange-400/15 to-orange-900/5 border-orange-400/25",
};

function RankIcon({ position }: { position: number }) {
  if (position === 1) return <Crown className="h-4 w-4 text-amber-400" />;
  if (position === 2) return <Trophy className="h-4 w-4 text-slate-300" />;
  if (position === 3) return <Medal className="h-4 w-4 text-orange-400" />;
  return (
    <span className="font-mono text-xs font-bold text-ink-muted w-4 text-center">
      {position}
    </span>
  );
}

export default function LeaderboardPage() {
  const user = useUserStore((s) => s.user);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<"global" | "friends">("global");

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        // Fetch from dedicated leaderboard endpoint with filter
        const res = await api.get<{ entries: LeaderboardEntry[] }>(`/social/leaderboard?filter=${tab}`);
        setEntries(res.entries);
      } catch {
        // Fallback: use friends list + inject self, sort by total lifetime XP
        try {
          const friendsRes = await api.get<{ friends: LeaderboardEntry[] }>("/social/friends");
          const all: LeaderboardEntry[] = [...friendsRes.friends];
          if (user) {
            all.push({
              id: user.id,
              display_name: user.display_name,
              avatar_url: user.avatar_url ?? null,
              level: user.character.level,
              total_xp_earned: user.character.total_xp_earned,
              current_streak_days: user.character.current_streak_days,
              rank: "C",
              title: "Elite Hunter",
              is_online: true,
            });
          }
          all.sort((a, b) => b.total_xp_earned - a.total_xp_earned);
          setEntries(all);
        } catch {
          setEntries([]);
        }
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [user, tab]);

  return (
    <div className="mx-auto max-w-4xl space-y-4 h-full overflow-y-auto pr-1 scrollbar-thin">
      {/* Header Banner */}
      <div className="hud-panel-elite p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-400" />
            <h1 className="font-display text-lg font-bold tracking-[0.2em] text-white">
              LEADERBOARD
            </h1>
            <span className="rounded border border-amber-500/30 bg-amber-950/20 px-2 py-0.5 font-mono text-[9px] text-amber-400">
              ● LIFETIME XP
            </span>
          </div>
          <p className="font-mono text-[10px] text-arc-400/70 mt-1">
            Hunter rankings ranked strictly by lifetime total XP earned all-time.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center rounded-lg border border-arc-500/20 bg-void/80 p-0.5">
          {(["global", "friends"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-3 py-1 font-mono text-[10px] uppercase font-bold rounded-md transition-all",
                tab === t
                  ? "bg-arc-500/25 text-arc-300 border border-arc-500/40"
                  : "text-ink-faint hover:text-arc-400"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Podium */}
      {!isLoading && entries.length >= 3 && (
        <div className="grid grid-cols-3 gap-3">
          {[entries[1], entries[0], entries[2]].map((entry, podiumIdx) => {
            const realPos = podiumIdx === 0 ? 2 : podiumIdx === 1 ? 1 : 3;
            const isMe = entry?.id === user?.id;
            return (
              <div
                key={entry?.id ?? podiumIdx}
                className={cn(
                  "hud-panel p-4 flex flex-col items-center gap-2 bg-gradient-to-b border text-center",
                  RANK_BG[realPos] ?? "border-arc-500/15",
                  realPos === 1 && "ring-1 ring-amber-400/30 shadow-glow-amber",
                  podiumIdx === 1 && "order-first sm:order-none"
                )}
              >
                <div className="relative">
                  <div
                    className={cn(
                      "flex h-14 w-14 items-center justify-center rounded-full border-2 bg-void overflow-hidden",
                      realPos === 1 ? "border-amber-400/60" : realPos === 2 ? "border-slate-300/40" : "border-orange-400/40"
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={entry?.avatar_url || "/hunter_avatar.jpg"}
                      alt={entry?.display_name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className={cn(
                    "absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full font-mono text-[9px] font-bold border",
                    realPos === 1 ? "bg-amber-500 border-amber-400 text-black" :
                    realPos === 2 ? "bg-slate-400 border-slate-300 text-black" :
                    "bg-orange-500 border-orange-400 text-black"
                  )}>
                    {realPos}
                  </span>
                </div>
                <div>
                  <p className={cn("font-display text-xs font-bold", isMe ? "text-arc-300" : "text-white")}>
                    {entry?.display_name}{isMe ? " (You)" : ""}
                  </p>
                  <p className="font-mono text-[8px] text-arc-400">Lv. {entry?.level}</p>
                </div>
                <div className={cn("font-mono text-sm font-bold", RANK_COLORS[realPos] ?? "text-white")}>
                  {entry?.total_xp_earned.toLocaleString()}
                  <span className="text-[8px] ml-0.5 text-ink-faint">XP</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Rankings Table */}
      <div className="hud-panel overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-2 border-b border-arc-500/20 px-4 py-2">
          <span className="col-span-1 font-mono text-[8px] uppercase text-arc-400/60">#</span>
          <span className="col-span-5 font-mono text-[8px] uppercase text-arc-400/60">Hunter</span>
          <span className="col-span-2 font-mono text-[8px] uppercase text-arc-400/60 text-center">Level</span>
          <span className="col-span-2 font-mono text-[8px] uppercase text-arc-400/60 text-right">Lifetime XP</span>
          <span className="col-span-2 font-mono text-[8px] uppercase text-arc-400/60 text-right">Streak</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-arc-400" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <Trophy className="h-10 w-10 text-arc-500/30" />
            <p className="font-display text-sm font-bold text-white">No Rankings Yet</p>
            <p className="font-mono text-xs text-ink-muted">
              Add friends in Hunter Network to compare rankings.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-arc-500/10 max-h-[50vh] overflow-y-auto scrollbar-thin">
            {entries.map((entry, idx) => {
              const position = idx + 1;
              const isMe = entry.id === user?.id;
              return (
                <div
                  key={entry.id}
                  className={cn(
                    "grid grid-cols-12 gap-2 items-center px-4 py-2.5 transition-colors",
                    isMe
                      ? "bg-arc-500/10 border-l-2 border-arc-400"
                      : "hover:bg-arc-500/5",
                    position <= 3 && "bg-gradient-to-r " + (RANK_BG[position] ?? "")
                  )}
                >
                  {/* Rank */}
                  <div className="col-span-1 flex items-center justify-start">
                    <RankIcon position={position} />
                  </div>

                  {/* Hunter Info */}
                  <div className="col-span-5 flex items-center gap-2 min-w-0">
                    <div className="relative flex-shrink-0">
                      <div className="h-8 w-8 rounded-full border border-arc-500/30 bg-void overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={entry.avatar_url || "/hunter_avatar.jpg"}
                          alt={entry.display_name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <span
                        className={cn(
                          "absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-void",
                          entry.is_online ? "bg-emerald-400" : "bg-ink-faint"
                        )}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className={cn(
                        "font-display text-xs font-bold truncate",
                        isMe ? "text-arc-300" : "text-white"
                      )}>
                        {entry.display_name}{isMe ? " (You)" : ""}
                      </p>
                      <p className="font-mono text-[8px] text-arc-400/70 truncate">{entry.title}</p>
                    </div>
                  </div>

                  {/* Level */}
                  <div className="col-span-2 text-center">
                    <span className="font-display text-sm font-bold text-arc-400">{entry.level}</span>
                  </div>

                  {/* XP */}
                  <div className="col-span-2 text-right">
                    <span className={cn("font-mono text-xs font-bold", position <= 3 ? RANK_COLORS[position] : "text-white")}>
                      {entry.total_xp_earned.toLocaleString()}
                    </span>
                    <span className="font-mono text-[8px] text-ink-faint ml-0.5">XP</span>
                  </div>

                  {/* Streak */}
                  <div className="col-span-2 flex items-center justify-end gap-1">
                    <Flame className="h-3 w-3 text-amber-400 flex-shrink-0" />
                    <span className="font-mono text-xs font-bold text-amber-300">
                      {entry.current_streak_days}d
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* My Rank Summary */}
      {user && !isLoading && entries.length > 0 && (
        <div className="hud-panel p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-arc-400" />
            <span className="font-mono text-xs text-ink-secondary">Your Position</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-xs">
            <span className="text-arc-300 font-bold">
              #{(entries.findIndex((e) => e.id === user.id) + 1) || "—"}
            </span>
            <span className="text-ink-faint">out of {entries.length} Hunters</span>
          </div>
        </div>
      )}
    </div>
  );
}
