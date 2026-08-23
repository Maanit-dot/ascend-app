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
  BarChart3,
  Settings,
  Heart,
  Zap,
  Share2,
  Globe,
  Bell,
  Users,
  Calendar,
  Medal,
} from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import { getHunterTitle, getHunterRank } from "@/lib/format";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/character", label: "Character Sheet", icon: Shield },
  { href: "/quests", label: "Daily Quests", icon: Swords },
  { href: "/social", label: "Hunter Network", icon: Users, badge: "NEW" },
  { href: "/bosses", label: "Bosses & Raids", icon: Skull },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/achievements", label: "Achievements", icon: Trophy },
  { href: "/social", label: "Leaderboards", icon: Medal },
  { href: "/statistics", label: "Statistics", icon: BarChart3 },
  { href: "/quests", label: "Calendar", icon: Calendar },
  { href: "/settings", label: "Settings", icon: Settings },
];

/** Compact stat pill for the sidebar character panel */
function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between gap-1 rounded border border-arc-500/20 bg-void/70 px-1.5 py-0.5">
      <span className={cn("font-mono text-[7px] font-bold uppercase tracking-wider", color)}>{label}</span>
      <span className="font-mono text-[9px] font-bold text-white">{value}</span>
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
      <div className="flex items-center justify-between mb-0.5">
        <div className="flex items-center gap-1">
          <Icon className={cn("h-2.5 w-2.5", color)} />
          <span className={cn("font-mono text-[7px] uppercase tracking-wider font-bold", color)}>{label}</span>
        </div>
        <span className="font-mono text-[7px] text-ink-faint">
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

  const character = user?.character;

  const currentTitle = character ? getHunterTitle(character.level) : "Hunter";
  const currentRank = character ? getHunterRank(character.level) : "E";

  const strVal = character?.stats?.strength ?? 60;
  const agiVal = character?.stats?.agility ?? 45;
  const intVal = character?.stats?.knowledge ?? 4;

  return (
    <aside className="z-40 hidden h-full w-[240px] xl:w-[255px] 2xl:w-[265px] flex-shrink-0 flex-col border-r border-arc-500/20 bg-void/95 lg:flex overflow-hidden select-none">
      {/* Glow lines */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-arc-500/50 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-arc-500/0 via-arc-500/15 to-arc-500/0" />

      {/* ── ASCEND Logo ─────────────────────────────────────── */}
      <div className="relative flex h-13 flex-shrink-0 items-center gap-3 border-b border-arc-500/20 px-4">
        <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-arc-400/50" />
        <span className="absolute top-0 right-0 w-3 h-3 border-t border-r border-arc-400/20" />

        <div className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-arc-500 to-arc-800 shadow-glow-arc animate-orb-pulse">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L22 12L12 22L2 12L12 2Z" stroke="white" strokeWidth="1.5" fill="rgba(255,255,255,0.1)" />
            <path d="M12 6L18 12L12 18L6 12L12 6Z" fill="white" opacity="0.85" />
          </svg>
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-display text-base font-bold tracking-[0.2em] text-white text-glow-arc">
            ASCEND
          </span>
          <span className="font-mono text-[7px] tracking-[0.25em] text-arc-400/70 uppercase">
            SYSTEM V3.0.0
          </span>
        </div>
      </div>

      {/* ── Navigation Menu ──────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-h-0 px-2 py-2 scrollbar-thin scrollbar-thumb-arc-900/40">
        <p className="mb-1.5 px-2 system-label text-[8px]">MAIN PORTAL</p>
        <nav className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "group nav-item py-1.5 px-2.5",
                  isActive ? "nav-item-active" : "nav-item-inactive"
                )}
              >
                {isActive && (
                  <span className="absolute inset-0 rounded-lg bg-arc-500/10 pointer-events-none" />
                )}

                <Icon
                  className={cn(
                    "h-3.5 w-3.5 flex-shrink-0 transition-colors",
                    isActive ? "text-arc-300" : "text-ink-faint group-hover:text-arc-400"
                  )}
                />
                <span className={cn("flex-1 text-[11px]", isActive && "font-semibold text-white")}>{item.label}</span>

                {item.badge && (
                  <span className="rounded bg-arc-500/25 border border-arc-500/50 px-1 py-0.2 font-mono text-[7px] text-arc-300 font-bold">
                    {item.badge}
                  </span>
                )}

                {isActive && !item.badge && (
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

      {/* ── Character Summary Panel (Pinned at bottom) ── */}
      {user && character && (
        <div className="flex-shrink-0 border-t border-arc-500/20 bg-arc-950/50 p-2.5 space-y-1.5">
          {/* Avatar + User details */}
          <div className="flex items-center gap-2">
            <div className="relative flex-shrink-0">
              <div className="absolute -inset-0.5 rounded bg-gradient-to-br from-arc-500 to-arc-800 opacity-80 blur-sm animate-pulse-slow" />
              <div className="relative flex h-10 w-10 items-center justify-center rounded border border-arc-500/50 overflow-hidden bg-void shadow-glow-arc-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={user.avatar_url || "/hunter_avatar.jpg"}
                  alt={user.display_name}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="truncate font-display text-xs font-bold text-white leading-none">
                  {user.display_name}
                </p>
                <span className="flex items-center gap-0.5 font-mono text-[7px] text-emerald-400 font-semibold">
                  <span className="h-1 w-1 rounded-full bg-emerald-400" /> ONLINE
                </span>
              </div>
              <p className="font-mono text-[8px] font-medium text-arc-300 truncate mt-0.5">
                {currentTitle}
              </p>
              <span className="inline-block font-mono text-[7px] text-ink-faint">
                Rank {currentRank} Hunter
              </span>
            </div>
          </div>

          {/* Level badge + XP */}
          <div className="rounded border border-arc-500/20 bg-void/60 p-1">
            <div className="flex items-center justify-between mb-0.5">
              <span className="system-label text-[7px]">LEVEL</span>
              <span className="font-display text-sm font-bold text-arc-400 leading-none text-glow-arc">
                {character.level}
              </span>
            </div>
            <div className="mb-0.5 flex justify-between font-mono text-[7px] text-ink-faint">
              <span>{character.current_xp.toLocaleString()} / {character.xp_required_for_next_level.toLocaleString()} XP</span>
            </div>
            <div className="h-1 w-full rounded-full bg-void-deep overflow-hidden">
              <div
                className="h-full rounded-full bg-stat-bar-arc shadow-glow-arc-sm transition-all duration-700"
                style={{ width: `${character.xp_progress_percent}%` }}
              />
            </div>
          </div>

          {/* HP / MP vitals */}
          <div className="grid grid-cols-2 gap-1">
            <VitalBar
              label="HP"
              icon={Heart}
              color="text-crimson-400"
              current={2400}
              max={2400}
            />
            <VitalBar
              label="MP"
              icon={Zap}
              color="text-cyan-400"
              current={1200}
              max={1200}
            />
          </div>

          {/* Core stats */}
          <div className="grid grid-cols-3 gap-1">
            <StatPill label="STR" value={strVal} color="text-crimson-400" />
            <StatPill label="AGI" value={agiVal} color="text-cyan-400" />
            <StatPill label="INT" value={intVal} color="text-arc-400" />
          </div>

          {/* Bottom icon row */}
          <div className="flex items-center justify-around pt-1 border-t border-arc-500/15">
            {[Share2, Globe, Bell, Settings].map((Icon, i) => (
              <button
                key={i}
                className="flex h-5 w-5 items-center justify-center rounded text-ink-faint hover:text-arc-400 hover:bg-arc-500/10 transition-colors"
              >
                <Icon className="h-2.5 w-2.5" />
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
