"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, Flame, Menu, BarChart2, Settings, X } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import { NotificationBell } from "@/features/companion/NotificationBell";
import { cn } from "@/lib/utils";

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

const SEARCH_PAGES = [
  { href: "/dashboard",    label: "Dashboard",      description: "Your main command center" },
  { href: "/character",    label: "Character Sheet", description: "Stats, vitals, rank breakdown" },
  { href: "/quests",       label: "Daily Quests",    description: "Complete quests and level up" },
  { href: "/social",       label: "Hunter Network",  description: "Connect with fellow Hunters" },
  { href: "/bosses",       label: "Bosses & Raids",  description: "Active threat matrix" },
  { href: "/inventory",    label: "Inventory",       description: "Equipped items and consumables" },
  { href: "/achievements", label: "Achievements",    description: "Milestones earned through discipline" },
  { href: "/leaderboard",  label: "Leaderboards",    description: "Global XP rankings" },
  { href: "/statistics",   label: "Statistics",      description: "Character analysis and progression" },
  { href: "/calendar",     label: "Calendar",        description: "Quest history and discipline log" },
  { href: "/story",        label: "Story Mode",      description: "The ASCEND narrative" },
  { href: "/settings",     label: "Settings",        description: "System configuration and profile" },
];

export function TopBar() {
  const user = useUserStore((s) => s.user);
  const pathname = usePathname();
  const router = useRouter();
  const [timeStr, setTimeStr] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

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

  // Click-outside dismiss for search
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredPages = searchQuery.trim()
    ? SEARCH_PAGES.filter(
        (p) =>
          p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : SEARCH_PAGES;

  function handleSelectPage(href: string) {
    router.push(href);
    setSearchQuery("");
    setIsSearchOpen(false);
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && filteredPages.length > 0) {
      handleSelectPage(filteredPages[0]!.href);
    }
    if (e.key === "Escape") {
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  }

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
        {/* ── Live Search Bar ── */}
        <div ref={searchRef} className="relative hidden md:block">
          <div className={cn(
            "flex items-center gap-2 rounded-lg border bg-panel/60 px-2.5 py-1 transition-all",
            isSearchOpen ? "border-arc-400/50 bg-panel/90 w-52 xl:w-64" : "border-arc-500/20 w-36 xl:w-44"
          )}>
            <Search className="h-3 w-3 flex-shrink-0 text-arc-400/70" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setIsSearchOpen(true); }}
              onFocus={() => setIsSearchOpen(true)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search pages..."
              className="flex-1 min-w-0 bg-transparent font-mono text-[10px] text-ink-primary placeholder:text-ink-faint focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(""); setIsSearchOpen(false); }}>
                <X className="h-3 w-3 text-ink-faint hover:text-arc-300" />
              </button>
            )}
          </div>

          {/* Dropdown results */}
          {isSearchOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-arc-500/30 bg-void/95 backdrop-blur-xl shadow-xl overflow-hidden z-50">
              {filteredPages.length === 0 ? (
                <div className="px-3 py-3 text-center font-mono text-[9px] text-ink-faint">
                  No pages found
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto scrollbar-thin">
                  {filteredPages.map((page) => {
                    const isActive = pathname === page.href;
                    return (
                      <button
                        key={page.href}
                        onClick={() => handleSelectPage(page.href)}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-arc-500/10",
                          isActive && "bg-arc-500/15 border-l-2 border-arc-400"
                        )}
                      >
                        <Search className="h-3 w-3 flex-shrink-0 text-arc-400/50" />
                        <div className="min-w-0">
                          <p className={cn(
                            "font-display text-[10px] font-bold leading-none",
                            isActive ? "text-arc-300" : "text-white"
                          )}>
                            {page.label}
                          </p>
                          <p className="font-mono text-[8px] text-ink-faint mt-0.5 truncate">
                            {page.description}
                          </p>
                        </div>
                        {isActive && (
                          <span className="ml-auto font-mono text-[7px] text-arc-400 flex-shrink-0">CURRENT</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="border-t border-arc-500/15 px-3 py-1.5 flex items-center gap-2">
                <kbd className="rounded border border-arc-500/30 bg-void/80 px-1 font-mono text-[7px] text-arc-500">↵</kbd>
                <span className="font-mono text-[7px] text-ink-faint">to navigate</span>
                <kbd className="ml-auto rounded border border-arc-500/30 bg-void/80 px-1 font-mono text-[7px] text-arc-500">ESC</kbd>
                <span className="font-mono text-[7px] text-ink-faint">to close</span>
              </div>
            </div>
          )}
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
