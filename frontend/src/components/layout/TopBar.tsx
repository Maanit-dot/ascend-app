"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Search, Flame, Menu, BarChart2, Settings } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import { NotificationBell } from "@/features/companion/NotificationBell";

const PAGE_LABELS: Record<string, { title: string; subtitle: string }> = {
  "/dashboard":    { title: "DASHBOARD",       subtitle: "YOUR JOURNEY. YOUR LEGACY. YOUR ASCENT." },
  "/character":    { title: "CHARACTER SHEET", subtitle: "Full 12-attribute stats, vitals, and rank breakdown." },
  "/quests":       { title: "DAILY QUESTS",    subtitle: "Complete your quests and level up, %NAME%." },
  "/bosses":       { title: "BOSSES & RAIDS",   subtitle: "Active threat matrix overview." },
  "/inventory":    { title: "INVENTORY",       subtitle: "Your equipped items and consumables." },
  "/achievements": { title: "ACHIEVEMENTS",    subtitle: "Milestones earned through discipline." },
  "/story":        { title: "STORY MODE",      subtitle: "The ASCEND narrative unfolds." },
  "/statistics":   { title: "STATISTICS",      subtitle: "Character analysis and progression." },
  "/settings":     { title: "SETTINGS",        subtitle: "System configuration and profile." },
  "/leaderboard":  { title: "LEADERBOARDS",    subtitle: "Global Hunter rankings sorted by XP earned." },
  "/calendar":     { title: "CALENDAR",        subtitle: "Your quest history and discipline log, %NAME%." },
  "/social":       { title: "HUNTER NETWORK",  subtitle: "Connect, inspect, and coordinate with fellow Hunters." },
};

export function TopBar() {
  const user = useUserStore((s) => s.user);
  const pathname = usePathname();
  const [timeStr, setTimeStr] = useState("");

  useEffect(() => {
    function tick() {
      const now = new Date();
      const datePart = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
      const dayPart = now.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
      const timePart = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
      setTimeStr(`${datePart} ${dayPart}, ${timePart}`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!user) return null;
  const { character } = user;

  const matchedKey = Object.keys(PAGE_LABELS).find((k) => pathname.startsWith(k));
  const pageInfo = (matchedKey ? PAGE_LABELS[matchedKey] : null) ?? { title: "ASCEND", subtitle: "System active." };
  const subtitle = pageInfo.subtitle.replace("%NAME%", user.display_name);

  return (
    <header className="sticky top-0 z-30 flex h-13 flex-shrink-0 items-center gap-3 border-b border-arc-500/20 bg-void/90 px-3 sm:px-4 backdrop-blur-xl">
      {/* Corner accents */}
      <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-arc-400/40 pointer-events-none" />
      <span className="absolute top-0 right-0 w-3 h-3 border-t border-r border-arc-400/30 pointer-events-none" />

      {/* Mobile hamburger */}
      <button
        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-ink-faint hover:text-arc-400 hover:bg-arc-500/10 transition-colors md:hidden"
        aria-label="Toggle menu"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Page title block */}
      <div className="flex-none max-w-[160px] xl:max-w-[220px] min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-xs font-bold tracking-[0.25em] text-white leading-none sm:text-sm truncate">
            {pageInfo.title}
          </h1>
          <span className="h-1 w-1 flex-shrink-0 rounded-full bg-arc-400" />
        </div>
        <p className="mt-0.5 font-mono text-[8px] tracking-wider text-arc-400/70 truncate uppercase">
          {subtitle}
        </p>
      </div>

      {/* Right control cluster */}
      <div className="ml-auto flex items-center gap-2">
        {/* Search Input Bar */}
        <div className="hidden items-center gap-2 rounded-lg border border-arc-500/20 bg-panel/60 px-2.5 py-1 text-xs md:flex">
          <Search className="h-3 w-3 text-arc-400/70" />
          <input
            type="text"
            placeholder="Search anything..."
            className="w-28 xl:w-36 bg-transparent font-mono text-[10px] text-ink-primary placeholder:text-ink-faint focus:outline-none"
          />
          <kbd className="rounded border border-arc-500/30 bg-void px-1 font-mono text-[8px] text-arc-400">
            CTRL K
          </kbd>
        </div>

        {/* Date & Time pill */}
        <div className="hidden items-center gap-1.5 rounded-lg border border-arc-500/20 bg-panel/50 px-2.5 py-1 text-[9px] font-mono text-ink-muted xl:flex">
          <span>{timeStr || "22 Aug 2026, 10:49 PM"}</span>
        </div>

        {/* Streak Pill */}
        <div className="flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-950/20 px-2 py-1">
          <Flame className="h-3 w-3 text-amber-400" />
          <span className="font-mono text-[10px] font-bold text-amber-300">
            {character.current_streak_days}D
          </span>
          <span className="hidden font-mono text-[8px] text-amber-400/70 uppercase sm:inline">STREAK</span>
        </div>

        {/* Icon Action Buttons */}
        <div className="hidden items-center gap-1 sm:flex">
          <button className="flex h-7 w-7 items-center justify-center rounded-lg border border-arc-500/20 bg-panel/50 text-ink-muted hover:border-arc-400 hover:text-arc-300 transition-colors">
            <BarChart2 className="h-3.5 w-3.5" />
          </button>
          <NotificationBell />
          <button className="flex h-7 w-7 items-center justify-center rounded-lg border border-arc-500/20 bg-panel/50 text-ink-muted hover:border-arc-400 hover:text-arc-300 transition-colors">
            <Settings className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* User Profile Badge */}
        <div className="flex items-center gap-2 rounded-lg border border-arc-500/25 bg-arc-950/40 p-1 pl-1.5 pr-2.5">
          <div className="relative flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-arc-600 to-arc-900 overflow-hidden shadow-glow-arc-sm border border-arc-500/40">
            {user.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar_url} alt={user.display_name} className="h-full w-full object-cover" />
            ) : (
              <span className="font-display text-xs font-bold text-white">
                {user.display_name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="hidden flex-col leading-tight sm:flex">
            <span className="font-body text-xs font-semibold text-white">{user.display_name}</span>
            <span className="font-mono text-[8px] text-arc-400 font-semibold">Level {character.level}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
