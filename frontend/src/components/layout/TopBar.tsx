"use client";

import { usePathname } from "next/navigation";
import { Bell, Calendar, Search, ChevronDown, Flame, User, Menu } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import { NotificationBell } from "@/features/companion/NotificationBell";
import { cn } from "@/lib/utils";

const PAGE_LABELS: Record<string, { title: string; subtitle: string }> = {
  "/dashboard":    { title: "DASHBOARD",       subtitle: "Welcome back, %NAME%. Your progress defines your future." },
  "/character":    { title: "CHARACTER SHEET", subtitle: "Full 12-attribute stats, vitals, and rank breakdown." },
  "/quests":       { title: "DAILY QUESTS",    subtitle: "Complete your quests and level up, %NAME%." },
  "/bosses":       { title: "BOSSES & RAIDS",   subtitle: "Active threat matrix overview." },
  "/inventory":    { title: "INVENTORY",       subtitle: "Your equipped items and consumables." },
  "/achievements": { title: "ACHIEVEMENTS",    subtitle: "Milestones earned through discipline." },
  "/story":        { title: "STORY MODE",      subtitle: "The ASCEND narrative unfolds." },
  "/statistics":   { title: "STATISTICS",      subtitle: "Character analysis and progression." },
  "/settings":     { title: "SETTINGS",        subtitle: "System configuration and profile." },
};

/** Small icon button used in the header controls row */
function HeaderIconBtn({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <button
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-arc-500/20 bg-panel/50 text-ink-muted transition-all duration-200 hover:border-arc-500/50 hover:bg-arc-500/10 hover:text-arc-400"
      aria-label={label}
    >
      {children}
    </button>
  );
}

export function TopBar() {
  const user = useUserStore((s) => s.user);
  const pathname = usePathname();

  if (!user) return null;
  const { character } = user;

  const matchedKey = Object.keys(PAGE_LABELS).find((k) => pathname.startsWith(k));
  const pageInfo = (matchedKey ? PAGE_LABELS[matchedKey] : null) ?? { title: "ASCEND", subtitle: "System active." };

  const subtitle = pageInfo.subtitle.replace("%NAME%", user.display_name);

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-arc-500/20 bg-void/85 px-4 backdrop-blur-xl sm:px-5">
      {/* Corner accents */}
      <span className="absolute top-0 left-0 w-4 h-4 border-t border-l border-arc-400/30 pointer-events-none" />
      <span className="absolute top-0 right-0 w-4 h-4 border-t border-r border-arc-400/20 pointer-events-none" />

      {/* Hamburger (mobile + desktop visual) */}
      <button
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-ink-faint hover:text-arc-400 hover:bg-arc-500/10 transition-colors md:hidden"
        aria-label="Toggle menu"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Page title block */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <h1 className="font-display text-sm font-bold tracking-[0.25em] text-ink-primary leading-none sm:text-base">
            {pageInfo.title}
          </h1>
          <span className="hidden h-1 w-1 rounded-full bg-arc-500/50 sm:inline-block" />
        </div>
        <p className="mt-0.5 font-mono text-[9px] text-arc-400/70 truncate">{subtitle}</p>
      </div>

      {/* Right control cluster */}
      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        {/* Search */}
        <HeaderIconBtn label="Search">
          <Search className="h-3.5 w-3.5" />
        </HeaderIconBtn>

        {/* Notifications */}
        <NotificationBell />

        {/* Date */}
        <div className="hidden items-center gap-1.5 rounded-lg border border-arc-500/20 bg-panel/50 px-2.5 py-1.5 sm:flex">
          <Calendar className="h-3 w-3 text-arc-400/70" />
          <span className="font-mono text-[9px] text-ink-muted">{dateStr}</span>
        </div>

        {/* Streak */}
        <div className="hidden items-center gap-1.5 rounded-lg border border-arc-500/20 bg-panel/50 px-2.5 py-1.5 sm:flex">
          <Flame className="h-3.5 w-3.5 text-amber-400" />
          <span className="font-mono text-[10px] font-semibold text-ink-secondary">
            {character.current_streak_days}d
          </span>
        </div>

        {/* User avatar + name + level */}
        <div className="flex items-center gap-2 rounded-lg border border-arc-500/20 bg-panel/60 py-1 pl-1 pr-3 cursor-pointer hover:border-arc-500/45 transition-colors">
          {/* Avatar */}
          <div className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-arc-500 to-arc-800 overflow-hidden shadow-glow-arc-sm">
            {user.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar_url} alt={user.display_name} className="h-full w-full object-cover" />
            ) : (
              <span className="font-display text-xs font-bold text-white">
                {user.display_name.charAt(0).toUpperCase()}
              </span>
            )}
            {/* Online indicator */}
            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 border border-void" />
          </div>

          <div className="hidden flex-col sm:flex leading-none">
            <span className="font-body text-xs font-semibold text-ink-primary">{user.display_name}</span>
            <span className="font-mono text-[9px] text-arc-400">Level {character.level}</span>
          </div>
          <ChevronDown className="hidden h-3 w-3 text-ink-faint sm:block" />
        </div>
      </div>
    </header>
  );
}
