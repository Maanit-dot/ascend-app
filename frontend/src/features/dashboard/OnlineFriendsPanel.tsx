"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface FriendEntry {
  id: string;
  display_name: string;
  avatar_url?: string | null;
  level: number;
  rank: string;
  title: string;
  is_online: boolean;
}

function StatusDot({ online }: { online: boolean }) {
  return (
    <span className={cn("inline-flex h-1.5 w-1.5 rounded-full", online ? "bg-emerald-400" : "bg-ink-faint")} />
  );
}

export function OnlineFriendsPanel() {
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ friends: FriendEntry[] }>("/social/friends")
      .then((data) => setFriends(data.friends ?? []))
      .catch(() => setFriends([]))
      .finally(() => setLoading(false));
  }, []);

  const online = friends.filter((f) => f.is_online);
  const offline = friends.filter((f) => !f.is_online).slice(0, 4 - online.length);
  const displayList = [...online, ...offline].slice(0, 4);

  return (
    <div className="hud-panel p-3 space-y-2 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-xs font-bold tracking-wider text-ink-primary">
            ONLINE FRIENDS
          </h3>
          {online.length > 0 && (
            <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 font-mono text-[8px] text-emerald-400">
              {online.length}
            </span>
          )}
        </div>
        <Link
          href="/social"
          className="font-mono text-[9px] text-arc-400 hover:text-arc-300 transition-colors"
        >
          VIEW ALL →
        </Link>
      </div>

      {/* Friend list */}
      <div className="flex-1 space-y-1.5 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-arc-500/30 border-t-arc-400" />
          </div>
        ) : displayList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-4 gap-1.5">
            <svg className="h-6 w-6 text-arc-500/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <p className="font-mono text-[9px] text-ink-faint">No connections yet.</p>
            <Link href="/social" className="font-mono text-[9px] text-arc-400 hover:underline">
              Find Hunters →
            </Link>
          </div>
        ) : (
          displayList.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-2 rounded-lg border border-arc-500/10 bg-arc-500/5 px-2 py-1.5 hover:border-arc-500/25 transition-colors"
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-arc-600 to-arc-900 border border-arc-500/30 overflow-hidden">
                  {f.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.avatar_url} alt={f.display_name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-display text-xs font-bold text-white">
                      {f.display_name[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2 rounded-full border border-void">
                  <span className={cn("h-full w-full rounded-full", f.is_online ? "bg-emerald-400" : "bg-ink-faint/50")} />
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-display text-[11px] font-semibold text-ink-primary truncate leading-none">
                  {f.display_name}
                </p>
                <p className="font-mono text-[9px] text-ink-faint">Lv. {f.level}</p>
              </div>

              {/* Online status */}
              <span className={cn(
                "flex-shrink-0 font-mono text-[8px] font-semibold",
                f.is_online ? "text-emerald-400" : "text-ink-faint"
              )}>
                {f.is_online ? "Online" : "Offline"}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
