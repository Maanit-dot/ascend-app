"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Shield,
  Swords,
  Skull,
  Package,
  Trophy,
  BookOpen,
  BarChart3,
  Settings,
  Heart,
  Zap,
  Share2,
  Globe,
  Bell,
  Users,
} from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import { getHunterTitle, getHunterRank } from "@/lib/format";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard",    label: "Dashboard",       icon: LayoutDashboard },
  { href: "/character",    label: "Character Sheet", icon: Shield },
  { href: "/quests",       label: "Daily Quests",    icon: Swords },
  { href: "/social",       label: "Hunter Network",  icon: Users },
  { href: "/bosses",       label: "Bosses & Raids",  icon: Skull },
  { href: "/inventory",   label: "Inventory",       icon: Package },
  { href: "/achievements", label: "Achievements",    icon: Trophy },
  { href: "/story",        label: "Story Mode",      icon: BookOpen },
  { href: "/statistics",  label: "Statistics",      icon: BarChart3 },
  { href: "/settings",    label: "Settings",        icon: Settings },
];

/** Compact stat pill for the sidebar character panel */
function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between gap-1 rounded-md border border-arc-500/15 bg-void/60 px-2 py-1">
      <span className={cn("font-mono text-[9px] uppercase tracking-wider", color)}>{label}</span>
      <span className="font-mono text-[11px] font-bold text-ink-secondary">{value}</span>
    </div>
  );
}

/** Narrow HP/MP progress bar */
function VitalBar({
  label,
  color,
  icon: Icon,
  current,
  max,
}: {
  label: string;
  color: string;
  icon: React.ElementType;
  current: number;
  max: number;
}) {
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 100;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <Icon className={cn("h-2.5 w-2.5", color)} />
          <span className={cn("font-mono text-[8px] uppercase tracking-wider", color)}>{label}</span>
        </div>
        <span className="font-mono text-[8px] text-ink-faint">
          {current} / {max}
        </span>
      </div>
      <div className="h-1 w-full rounded-full bg-void-deep/80 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", color.replace("text-", "bg-"))}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const user = useUserStore((s) => s.user);

  const stats = user?.character?.stats;
  const character = user?.character;

  const currentTitle = character ? getHunterTitle(character.level) : "Hunter";
  const currentRank = character ? getHunterRank(character.level) : "E";

  return (
    <aside className="z-40 hidden h-full w-64 flex-shrink-0 flex-col border-r border-arc-500/20 bg-void md:flex overflow-hidden">
      {/* Left-edge glow line */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-arc-500/50 to-transparent" />
      {/* Right-edge subtle glow */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-arc-500/0 via-arc-500/15 to-arc-500/0" />

      {/* ── ASCEND Logo ─────────────────────────────────────── */}
      <div className="relative flex h-16 flex-shrink-0 items-center gap-3 border-b border-arc-500/20 px-5">
        {/* Corner accent */}
        <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-arc-400/50" />
        <span className="absolute top-0 right-0 w-3 h-3 border-t border-r border-arc-400/20" />

        <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-arc-500 to-arc-800 shadow-glow-arc animate-orb-pulse">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L22 12L12 22L2 12L12 2Z" stroke="white" strokeWidth="1.5" fill="rgba(255,255,255,0.1)" />
            <path d="M12 6L18 12L12 18L6 12L12 6Z" fill="white" opacity="0.85" />
          </svg>
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-display text-lg font-bold tracking-[0.2em] text-white text-glow-arc">
            ASCEND
          </span>
          <span className="font-mono text-[8px] tracking-[0.25em] text-arc-400/70 uppercase">
            System v2.4.0
          </span>
        </div>
      </div>

      {/* ── Navigation (Scrollable area so character card is never clipped) ── */}
      <div className="flex-1 overflow-y-auto min-h-0 px-3 py-4 scrollbar-thin scrollbar-thumb-arc-900/40">
        <p className="mb-2 px-2 system-label">Portals</p>
        <nav className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group nav-item",
                  isActive ? "nav-item-active" : "nav-item-inactive"
                )}
              >
                {/* Active glow overlay */}
                {isActive && (
                  <span className="absolute inset-0 rounded-lg bg-arc-500/5 pointer-events-none" />
                )}

                <Icon
                  className={cn(
                    "h-[16px] w-[16px] flex-shrink-0 transition-colors",
                    isActive ? "text-arc-400" : "text-ink-faint group-hover:text-arc-500/60"
                  )}
                />
                <span className={cn("flex-1 text-sm", isActive && "font-semibold")}>{item.label}</span>

                {/* Active dot */}
                {isActive && (
                  <span className="flex h-1.5 w-1.5 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-1.5 w-1.5 rounded-full bg-arc-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-arc-400" />
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── Character Summary Panel (Pinned at bottom, flex-shrink-0) ── */}
      {user && character && (
        <div className="flex-shrink-0 border-t border-arc-500/20 bg-arc-950/30 p-3.5 space-y-2.5">
          {/* Avatar + User details */}
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              {/* Outer glow ring */}
              <div className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-arc-500 to-arc-800 opacity-70 blur-sm animate-pulse-slow" />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-arc-600 to-arc-900 border border-arc-500/40 overflow-hidden shadow-glow-arc-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={user.avatar_url || "/hunter_avatar.jpg"}
                  alt={user.display_name}
                  className="h-full w-full object-cover"
                />
              </div>
              {/* Online badge */}
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-void" />
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm font-bold text-white leading-none">
                {user.display_name}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="font-mono text-[9px] text-emerald-400 font-medium">ONLINE</span>
              </div>
              <p className="font-mono text-[10px] font-semibold text-arc-300 truncate mt-0.5">
                The {currentTitle}
              </p>
              <span className="inline-block mt-0.5 rounded border border-arc-500/30 bg-arc-500/10 px-1.5 py-0.5 font-mono text-[8px] font-medium text-arc-300">
                Rank: {currentRank} Hunter
              </span>
            </div>
          </div>

          {/* Level badge + XP */}
          <div className="rounded-lg border border-arc-500/25 bg-void/50 p-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="system-label">LEVEL</span>
              <span className="font-display text-xl font-bold text-arc-400 leading-none text-glow-arc">
                {character.level}
              </span>
            </div>
            {/* XP bar */}
            <div className="mb-1 flex justify-between font-mono text-[8px] text-ink-faint">
              <span>{character.current_xp.toLocaleString()} XP</span>
              <span>{character.xp_required_for_next_level.toLocaleString()} XP</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-void-deep overflow-hidden">
              <div
                className="h-full rounded-full bg-stat-bar-arc shadow-glow-arc-sm transition-all duration-700"
                style={{ width: `${character.xp_progress_percent}%` }}
              />
            </div>
          </div>

          {/* HP / MP vitals */}
          <div className="grid grid-cols-2 gap-2">
            <VitalBar
              label="HP"
              icon={Heart}
              color="text-crimson-400"
              current={character.level * 100}
              max={character.level * 100}
            />
            <VitalBar
              label="MP"
              icon={Zap}
              color="text-cyan-400"
              current={character.level * 50}
              max={character.level * 50}
            />
          </div>

          {/* Core stats */}
          {stats && (
            <div className="grid grid-cols-3 gap-1.5">
              <StatPill label="STR" value={stats.strength}  color="text-crimson-400" />
              <StatPill label="AGI" value={stats.agility}   color="text-cyan-400" />
              <StatPill label="INT" value={stats.knowledge} color="text-arc-400" />
            </div>
          )}

          {/* Bottom icon row */}
          <div className="flex items-center justify-around pt-1 border-t border-arc-500/15">
            {[Share2, Globe, Bell, Settings].map((Icon, i) => (
              <button
                key={i}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-faint hover:text-arc-400 hover:bg-arc-500/10 transition-colors"
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
