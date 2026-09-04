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

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/character", label: "Character Sheet", icon: Shield },
  { href: "/quests", label: "Daily Quests", icon: Swords },
  { href: "/social", label: "Hunter Network", icon: Users, badge: "NEW" },
  { href: "/bosses", label: "Bosses & Raids", icon: Skull },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/achievements", label: "Achievements", icon: Trophy },
  { href: "/leaderboard", label: "Leaderboards", icon: Medal },
  { href: "/statistics", label: "Statistics", icon: BarChart3 },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/settings", label: "Settings", icon: Settings },
];

/** Compact stat pill for the sidebar character panel */
function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between gap-1 rounded border border-arc-500/20 bg-void/80 px-1.5 py-0.5">
      <span className={cn("font-mono text-[7px] font-bold uppercase tracking-wider", color)}>{label}</span>
      <span className="font-mono text-[8px] font-bold text-white">{value}</span>
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
      <div className="h-1 w-full rounded-full bg-void-deep/90 overflow-hidden border border-arc-500/20">
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

  const currentTitle = character ? getHunterTitle(character.level) : "Elite Hunter";
  const currentRank = character ? getHunterRank(character.level) : "C";

  const strVal = character?.stats?.strength ?? 64;
  const agiVal = character?.stats?.agility ?? 45;
  const intVal = character?.stats?.knowledge ?? 4;

  return (
    <aside className="z-40 hidden h-full w-[240px] xl:w-[250px] flex-shrink-0 flex-col border-r border-arc-500/20 bg-[#05030D]/95 lg:flex overflow-hidden select-none">
      {/* ── ASCEND Logo ─────────────────────────────────────── */}
      <div className="relative flex h-12 flex-shrink-0 items-center gap-2.5 border-b border-arc-500/20 px-4">
        <div className="relative flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-arc-500 to-arc-800 shadow-glow-arc">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L22 12L12 22L2 12L12 2Z" stroke="white" strokeWidth="1.5" fill="rgba(255,255,255,0.15)" />
            <path d="M12 6L18 12L12 18L6 12L12 6Z" fill="white" opacity="0.9" />
          </svg>
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-display text-sm font-bold tracking-[0.2em] text-white text-glow-arc">
            ASCEND
          </span>
          <span className="font-mono text-[7px] tracking-[0.25em] text-arc-400/80 uppercase mt-0.5">
            SYSTEM V4.0.0
          </span>
        </div>
      </div>

      {/* ── Navigation Menu ──────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-h-0 px-2 py-1.5 scrollbar-thin">
        <p className="mb-1 px-2 font-mono text-[7px] tracking-widest text-arc-400/60 uppercase font-bold">
          MAIN PORTAL
        </p>
        <nav className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-2 rounded-lg py-1 px-2 text-[10px] transition-all",
                  isActive
                    ? "bg-gradient-to-r from-arc-600/35 via-arc-500/20 to-transparent border border-arc-400/50 text-white font-bold shadow-[0_0_10px_rgba(139,92,246,0.2)]"
                    : "text-ink-muted hover:text-white hover:bg-arc-500/10 border border-transparent"
                )}
              >
                <Icon
                  className={cn(
                    "h-3.5 w-3.5 flex-shrink-0 transition-colors",
                    isActive ? "text-arc-300" : "text-ink-faint group-hover:text-arc-400"
                  )}
                />
                <span className="flex-1 truncate">{item.label}</span>

                {item.badge && (
                  <span className="rounded bg-arc-500/30 border border-arc-400/50 px-1 py-0.2 font-mono text-[6px] text-arc-300 font-bold">
                    {item.badge}
                  </span>
                )}

                {isActive && !item.badge && (
                  <span className="flex h-1.5 w-1.5 flex-shrink-0">
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-arc-400 shadow-[0_0_6px_#A855F7]" />
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── Character Summary Panel (Pinned at bottom, ~35% height) ── */}
      {user && character && (
        <div className="flex-shrink-0 border-t border-arc-500/20 bg-[#0A051A]/90 p-2.5 space-y-1.5">
          {/* Avatar + User details */}
          <div className="flex items-center gap-2">
            <div className="relative flex-shrink-0">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-arc-500/50 overflow-hidden bg-void shadow-glow-arc-sm">
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
                <span className="flex items-center gap-0.5 font-mono text-[6px] text-emerald-400 font-semibold">
                  <span className="h-1 w-1 rounded-full bg-emerald-400" /> SYSTEM ONLINE
                </span>
              </div>
              <p className="font-mono text-[7px] text-cyan-300 font-medium truncate mt-0.5">
                {currentTitle}
              </p>
              <span className="inline-block font-mono text-[7px] text-arc-400/80">
                Rank {currentRank} Hunter
              </span>
            </div>
          </div>

          {/* Level badge + XP */}
          <div className="rounded border border-arc-500/20 bg-void/60 p-1">
            <div className="flex items-center justify-between mb-0.5">
              <span className="font-mono text-[7px] uppercase tracking-wider text-arc-400 font-bold">LEVEL</span>
              <span className="font-display text-sm font-bold text-white leading-none text-glow-arc">
                {character.level}
              </span>
            </div>
            <div className="mb-0.5 flex justify-between font-mono text-[6px] text-ink-faint">
              <span>{character.current_xp.toLocaleString()} / {character.xp_required_for_next_level.toLocaleString()} XP</span>
            </div>
            <div className="h-1 w-full rounded-full bg-void-deep overflow-hidden border border-arc-500/20">
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
                className="flex h-4 w-4 items-center justify-center rounded text-ink-faint hover:text-arc-400 hover:bg-arc-500/10 transition-colors"
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
