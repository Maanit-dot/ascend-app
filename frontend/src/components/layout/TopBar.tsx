"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, Flame, BarChart2, Settings, Bell } from "lucide-react";
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
  const [dateStr, setDateStr] = useState("04 Sep 2026");
  const [dayStr, setDayStr] = useState("Thursday");
  const [timeStr, setTimeStr] = useState("11:08 PM");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function tick() {
      const now = new Date();
      setDateStr(now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }));
      setDayStr(now.toLocaleDateString("en-US", { weekday: "long" }));
      setTimeStr(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }));
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
  const pageInfo = (matchedKey ? PAGE_LABELS[matchedKey] : null) ?? { title: "DASHBOARD", subtitle: "YOUR JOURNEY. YOUR LEGACY. YOUR ASCENT." };
  const subtitle = pageInfo.subtitle.replace("%NAME%", user.display_name);

  return (
    <header className="sticky top-0 z-30 flex h-12 flex-shrink-0 items-center justify-between border-b border-arc-500/20 bg-[#05030D]/95 px-4 backdrop-blur-xl select-none">
      {/* ── Page Title Block ── */}
      <div className="flex flex-col min-w-0">
        <h1 className="font-display text-sm font-bold tracking-[0.25em] text-white leading-none truncate text-glow-arc">
          {pageInfo.title}
        </h1>
        <p className="mt-0.5 font-mono text-[8px] tracking-wider text-arc-400/80 uppercase truncate">
          {subtitle}
        </p>
      </div>

      {/* ── Center: Live Search Field with CTRL K ── */}
      <div ref={searchRef} className="relative hidden md:block">
        <div className={cn(
          "flex items-center gap-2 rounded-lg border border-arc-500/30 bg-void/80 px-2.5 py-1 transition-all",
          isSearchOpen ? "border-arc-400/60 bg-void w-56" : "w-48"
        )}>
          <Search className="h-3 w-3 flex-shrink-0 text-arc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setIsSearchOpen(true); }}
            onFocus={() => setIsSearchOpen(true)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search anything..."
            className="w-full bg-transparent font-mono text-[9px] text-white placeholder:text-ink-faint focus:outline-none"
          />
          <span className="rounded bg-arc-500/20 border border-arc-500/30 px-1 py-0.2 font-mono text-[7px] text-arc-300 font-bold flex-shrink-0">
            CTRL K
          </span>
        </div>

        {/* Dropdown Suggestions */}
        {isSearchOpen && (
          <div className="absolute top-full mt-1.5 left-0 w-64 rounded-xl border border-arc-500/30 bg-[#0A051A]/95 p-1 shadow-2xl backdrop-blur-2xl z-50 animate-fade-in">
            {filteredPages.map((page) => (
              <button
                key={page.href}
                onClick={() => handleSelectPage(page.href)}
                className="flex w-full items-center justify-between rounded-lg p-1.5 text-left hover:bg-arc-500/20 transition-colors"
              >
                <div>
                  <p className="font-display text-[10px] font-bold text-white">{page.label}</p>
                  <p className="font-mono text-[8px] text-ink-faint">{page.description}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Right Cluster: Date/Time + Streak + Utility Icons + Profile ── */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Date / Day pill */}
        <div className="hidden xl:flex flex-col text-right font-mono text-[7px] text-ink-secondary leading-tight pr-1 border-r border-arc-500/20">
          <span className="text-white font-bold">{dateStr}</span>
          <span className="text-arc-400">{dayStr}</span>
        </div>

        {/* Time pill with orange dot */}
        <div className="hidden sm:flex items-center gap-1 rounded border border-arc-500/30 bg-void/80 px-2 py-0.5 font-mono text-[8px] text-white font-bold">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span>{timeStr}</span>
        </div>

        {/* Dynamic Streak Pill */}
        <div className="flex items-center gap-1 rounded border border-orange-500/40 bg-orange-950/30 px-2 py-0.5 font-mono text-[8px] text-orange-300 font-bold">
          <Flame className="h-2.5 w-2.5 text-orange-400" />
          <span>{character.current_streak_days}D STREAK</span>
        </div>

        {/* Utility icons */}
        <button
          onClick={() => router.push("/statistics")}
          className="flex h-6 w-6 items-center justify-center rounded border border-arc-500/20 bg-void/60 text-arc-300 hover:bg-arc-500/20 transition-colors"
          title="Statistics"
        >
          <BarChart2 className="h-3 w-3" />
        </button>

        <NotificationBell />

        <button
          onClick={() => router.push("/settings")}
          className="flex h-6 w-6 items-center justify-center rounded border border-arc-500/20 bg-void/60 text-arc-300 hover:bg-arc-500/20 transition-colors"
          title="Settings"
        >
          <Settings className="h-3 w-3" />
        </button>

        {/* Far-right Avatar */}
        <div
          onClick={() => router.push("/character")}
          className="relative flex h-7 w-7 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg border border-arc-400/50 overflow-hidden bg-void shadow-glow-arc-sm hover:scale-105 transition-transform"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={user.avatar_url || "/hunter_avatar.jpg"}
            alt={user.display_name}
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </header>
  );
}
