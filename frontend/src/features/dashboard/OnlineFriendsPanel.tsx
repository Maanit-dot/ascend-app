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
  status: "Online" | "In Quest" | "Offline";
}

const DEFAULT_FRIENDS: FriendEntry[] = [
  { id: "1", display_name: "Aryan", level: 142, status: "Online" },
  { id: "2", display_name: "Rohan", level: 115, status: "In Quest" },
  { id: "3", display_name: "Priyanshu", level: 98, status: "Online" },
];

export function OnlineFriendsPanel() {
  const [friends, setFriends] = useState<FriendEntry[]>(DEFAULT_FRIENDS);

  useEffect(() => {
    api
      .get<{ friends: any[] }>("/social/friends")
      .then((data) => {
        if (data.friends && data.friends.length > 0) {
          setFriends(
            data.friends.map((f) => ({
              id: f.id,
              display_name: f.display_name,
              avatar_url: f.avatar_url,
              level: f.level,
              status: f.is_online ? "Online" : "Offline",
            }))
          );
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
            ONLINE FRIENDS
          </h3>
          <span className="font-mono text-[9px] text-arc-400">({friends.length})</span>
        </div>
        <Link href="/social" className="font-mono text-[8px] text-arc-400 hover:text-arc-300">
          VIEW ALL
        </Link>
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 space-y-1 overflow-y-auto pr-1 my-1 scrollbar-thin">
        {friends.slice(0, 3).map((f) => {
          const isOnline = f.status === "Online";
          const isInQuest = f.status === "In Quest";
          const statusColor = isOnline
            ? "text-emerald-400 font-semibold"
            : isInQuest
            ? "text-amber-400 font-semibold"
            : "text-ink-faint";

          return (
            <div
              key={f.id}
              className="flex items-center justify-between rounded border border-arc-500/10 bg-arc-950/20 px-2 py-1"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-arc-800 border border-arc-500/30 overflow-hidden font-display text-[9px] font-bold text-white">
                  {f.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.avatar_url} alt={f.display_name} className="h-full w-full object-cover" />
                  ) : (
                    f.display_name.charAt(0)
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-display text-[10px] font-semibold text-white truncate leading-none">
                    {f.display_name}
                  </p>
                  <p className="font-mono text-[8px] text-ink-faint mt-0.5">Lv. {f.level}</p>
                </div>
              </div>
              <span className={cn("font-mono text-[8px]", statusColor)}>{f.status}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
