"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  Users,
  Monitor,
  Activity,
  Sliders,
  Bell,
  History,
  Search,
  UserX,
  UserCheck,
  Ban,
  RefreshCw,
  Cpu,
  HardDrive,
  Database,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { ownerApi, SystemHealthData } from "@/lib/api/owner";
import { useUserStore } from "@/store/useUserStore";
import { useUIStore } from "@/store/useUIStore";
import type {
  OwnerMetrics,
  OwnerUserItem,
  OwnerInstallation,
  AuditLogEntry,
  SystemAnnouncement,
} from "@/types";

type OwnerTab = "metrics" | "users" | "installations" | "features" | "maintenance" | "audit";

export default function OwnerControlCentrePage() {
  const router = useRouter();
  const currentUser = useUserStore((s) => s.user);
  const pushToast = useUIStore((s) => s.pushToast);

  const [activeTab, setActiveTab] = useState<OwnerTab>("metrics");
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Data states
  const [metrics, setMetrics] = useState<OwnerMetrics | null>(null);
  const [health, setHealth] = useState<SystemHealthData | null>(null);
  const [usersList, setUsersList] = useState<OwnerUserItem[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("all");
  const [usersPage, setUsersPage] = useState(1);
  const [totalUsersCount, setTotalUsersCount] = useState(0);

  const [installations, setInstallations] = useState<OwnerInstallation[]>([]);
  const [features, setFeatures] = useState<Record<string, { value: string; active: boolean; desc: string }>>({});
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // Action states
  const [actionReason, setActionReason] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);

  // Announcement states
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementMsg, setAnnouncementMsg] = useState("");
  const [announcementVariant, setAnnouncementVariant] = useState<"info" | "warning" | "alert">("info");
  const [isMaintenanceActive, setIsMaintenanceActive] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState("");

  // 1. Initial Permission Check & Load
  useEffect(() => {
    async function initCheck() {
      const isOwnerAccount =
        currentUser?.role === "SUPER_ADMIN" ||
        currentUser?.is_owner === true ||
        currentUser?.email?.toLowerCase().trim() === "guptattt3@gmail.com";

      if (isOwnerAccount) {
        setIsAuthorized(true);
      }

      try {
        setLoading(true);
        const metricsRes = await ownerApi.getMetrics();
        setMetrics(metricsRes);
        setIsAuthorized(true);

        // Load supplementary data in background
        loadHealthData();
        loadUsersData();
        loadInstallationsData();
        loadFeaturesData();
        loadAuditLogsData();
        loadAnnouncementsData();
      } catch (err: any) {
        // If the user is the owner but backend is currently offline/unreachable on localhost,
        // still grant UI access so owner is never locked out of the dashboard
        if (isOwnerAccount) {
          setIsAuthorized(true);
          pushToast({
            variant: "warning",
            title: "Backend Sync Incomplete",
            description: "Owner identity verified. Connect local backend (127.0.0.1:8000) for live telemetry.",
          });
        } else {
          setIsAuthorized(false);
          pushToast({
            variant: "danger",
            title: "Access Restricted",
            description: "Owner Control Centre is exclusively reserved for the verified system owner.",
          });
        }
      } finally {
        setLoading(false);
      }
    }

    if (currentUser) {
      initCheck();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  async function loadHealthData() {
    try {
      const h = await ownerApi.getSystemHealth();
      setHealth(h);
    } catch {}
  }

  async function loadUsersData(page = usersPage, search = userSearch, filter = userStatusFilter) {
    try {
      const res = await ownerApi.getUsers({
        page,
        query: search || undefined,
        status_filter: filter !== "all" ? filter : undefined,
        limit: 15,
      });
      setUsersList(res.items);
      setTotalUsersCount(res.total);
    } catch {}
  }

  async function loadInstallationsData() {
    try {
      const insts = await ownerApi.getInstallations();
      setInstallations(insts);
    } catch {}
  }

  async function loadFeaturesData() {
    try {
      const f = await ownerApi.getFeatures();
      setFeatures(f);
    } catch {}
  }

  async function loadAuditLogsData() {
    try {
      const logs = await ownerApi.getAuditLogs();
      setAuditLogs(logs.items);
    } catch {}
  }

  async function loadAnnouncementsData() {
    try {
      const data = await ownerApi.getAnnouncements();
      setIsMaintenanceActive(data.maintenance.active);
      setMaintenanceMsg(data.maintenance.message);
      if (data.announcement) {
        setAnnouncementTitle(data.announcement.title);
        setAnnouncementMsg(data.announcement.message);
        setAnnouncementVariant(data.announcement.variant);
      }
    } catch {}
  }

  // --- Actions ---

  async function handleSuspend() {
    if (!selectedUserId || !actionReason.trim()) return;
    try {
      await ownerApi.suspendUser(selectedUserId, actionReason.trim());
      pushToast({ variant: "warning", title: "User Suspended", description: "All active sessions revoked." });
      setShowSuspendModal(false);
      setActionReason("");
      loadUsersData();
    } catch (err: any) {
      pushToast({ variant: "danger", title: "Failed to suspend user", description: err.message });
    }
  }

  async function handleBan() {
    if (!selectedUserId || !actionReason.trim()) return;
    try {
      await ownerApi.banUser(selectedUserId, actionReason.trim());
      pushToast({ variant: "danger", title: "User Permanently Banned" });
      setShowBanModal(false);
      setActionReason("");
      loadUsersData();
    } catch (err: any) {
      pushToast({ variant: "danger", title: "Failed to ban user", description: err.message });
    }
  }

  async function handleRestore(userId: string) {
    try {
      await ownerApi.restoreUser(userId);
      pushToast({ variant: "success", title: "Account Restored" });
      loadUsersData();
    } catch (err: any) {
      pushToast({ variant: "danger", title: "Could not restore user", description: err.message });
    }
  }

  async function handleRevokeSessions(userId: string) {
    try {
      const res = await ownerApi.revokeUserSessions(userId);
      pushToast({ variant: "success", title: `Revoked ${res.revoked_count} active sessions` });
    } catch (err: any) {
      pushToast({ variant: "danger", title: "Could not revoke sessions", description: err.message });
    }
  }

  async function handleBlockDevice(deviceId: string) {
    const reason = prompt("Enter reason for blocking this desktop machine:") || "Owner administrative block";
    try {
      await ownerApi.blockInstallation(deviceId, reason);
      pushToast({ variant: "warning", title: "Machine Blocked", description: `Device ${deviceId} rejected.` });
      loadInstallationsData();
    } catch (err: any) {
      pushToast({ variant: "danger", title: "Could not block machine", description: err.message });
    }
  }

  async function handleUnblockDevice(deviceId: string) {
    try {
      await ownerApi.unblockInstallation(deviceId);
      pushToast({ variant: "success", title: "Machine Unblocked" });
      loadInstallationsData();
    } catch (err: any) {
      pushToast({ variant: "danger", title: "Could not unblock machine", description: err.message });
    }
  }

  async function handleToggleFeature(key: string, currentActive: boolean) {
    try {
      await ownerApi.updateFeature(key, currentActive ? "false" : "true", !currentActive);
      pushToast({ variant: "success", title: `Feature ${key} updated` });
      loadFeaturesData();
    } catch (err: any) {
      pushToast({ variant: "danger", title: "Failed to update feature", description: err.message });
    }
  }

  async function handleSaveAnnouncement() {
    try {
      await ownerApi.setAnnouncement(announcementTitle, announcementMsg, announcementVariant, true);
      pushToast({ variant: "success", title: "Announcement Broadcasted" });
    } catch (err: any) {
      pushToast({ variant: "danger", title: "Could not set announcement", description: err.message });
    }
  }

  async function handleToggleMaintenance() {
    const nextState = !isMaintenanceActive;
    try {
      await ownerApi.toggleMaintenance(nextState, maintenanceMsg || "Maintenance in progress.");
      setIsMaintenanceActive(nextState);
      pushToast({
        variant: nextState ? "warning" : "success",
        title: nextState ? "Maintenance Mode Activated" : "Maintenance Mode Disabled",
      });
    } catch (err: any) {
      pushToast({ variant: "danger", title: "Failed to toggle maintenance", description: err.message });
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-arc-500 border-t-transparent" />
          <p className="font-mono text-xs text-arc-400">Verifying Owner Credentials...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <GlassCard padding="lg" glow="crimson" className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-crimson-500/10 text-crimson-400 border border-crimson-500/30">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="font-display text-xl font-bold text-white mb-2">403 — Unauthorized Access</h2>
          <p className="font-body text-xs text-ink-muted mb-5 leading-relaxed">
            The Owner Control Centre is restricted exclusively to the verified system owner (<strong className="text-arc-300">guptattt3@gmail.com</strong>).
            Access attempts are logged to the administrative security audit log.
          </p>
          <button onClick={() => router.push("/dashboard")} className="btn-secondary w-full text-xs">
            Return to Dashboard
          </button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-arc-500/20 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold text-white tracking-wide">
              Owner Control Centre
            </h1>
            <span className="rounded-full border border-arc-500/50 bg-arc-500/20 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-arc-300">
              SUPER_ADMIN
            </span>
          </div>
          <p className="mt-1 font-body text-xs text-ink-muted">
            Global ecosystem telemetry, multi-user management, desktop installations, and platform security.
          </p>
        </div>

        <button
          onClick={() => {
            loadHealthData();
            loadUsersData();
            loadInstallationsData();
            loadFeaturesData();
            loadAuditLogsData();
            pushToast({ variant: "success", title: "Telemetry Refreshed" });
          }}
          className="btn-secondary flex items-center gap-2 self-start sm:self-auto text-xs py-2 px-3"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-white/5 pb-2">
        {[
          { id: "metrics", label: "Metrics & Telemetry", icon: Activity },
          { id: "users", label: `Users (${totalUsersCount})`, icon: Users },
          { id: "installations", label: `Desktop Installs (${installations.length})`, icon: Monitor },
          { id: "features", label: "Modules & Flags", icon: Sliders },
          { id: "maintenance", label: "Broadcast & Maintenance", icon: Bell },
          { id: "audit", label: "Audit Log", icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as OwnerTab)}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 font-body text-xs font-medium transition-all ${
                isActive
                  ? "bg-arc-500/20 text-white border border-arc-500/40 shadow-glow-arc-sm font-semibold"
                  : "text-ink-muted hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: METRICS & TELEMETRY */}
      {activeTab === "metrics" && metrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
            <GlassCard padding="md">
              <span className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">Total Users</span>
              <p className="mt-1 font-display text-2xl font-bold text-white">{metrics.total_registered_users}</p>
              <span className="font-mono text-[9px] text-emerald-400">Registered</span>
            </GlassCard>

            <GlassCard padding="md">
              <span className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">Active Web (15m)</span>
              <p className="mt-1 font-display text-2xl font-bold text-cyan-400">{metrics.active_website_users}</p>
              <span className="font-mono text-[9px] text-cyan-300">Web Sessions</span>
            </GlassCard>

            <GlassCard padding="md">
              <span className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">Active Desktop (15m)</span>
              <p className="mt-1 font-display text-2xl font-bold text-arc-400">{metrics.active_desktop_users}</p>
              <span className="font-mono text-[9px] text-arc-300">Windows Apps</span>
            </GlassCard>

            <GlassCard padding="md">
              <span className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">Desktop Installs</span>
              <p className="mt-1 font-display text-2xl font-bold text-white">{metrics.total_desktop_installations}</p>
              <span className="font-mono text-[9px] text-ink-faint">Machines</span>
            </GlassCard>

            <GlassCard padding="md">
              <span className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">Blocked Machines</span>
              <p className="mt-1 font-display text-2xl font-bold text-crimson-400">{metrics.blocked_installations}</p>
              <span className="font-mono text-[9px] text-crimson-400">Firewalled</span>
            </GlassCard>

            <GlassCard padding="md">
              <span className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">Suspended Users</span>
              <p className="mt-1 font-display text-2xl font-bold text-amber-400">{metrics.suspended_or_banned_users}</p>
              <span className="font-mono text-[9px] text-amber-400">Restricted</span>
            </GlassCard>
          </div>

          {/* System Hardware Health */}
          {health && (
            <GlassCard padding="lg">
              <h3 className="font-display text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Cpu className="h-4 w-4 text-arc-400" />
                Backend Hardware & System Health
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="rounded-lg bg-void/50 p-3.5 border border-white/5 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-ink-muted">CPU Usage</span>
                    <span className="font-mono font-bold text-white">{health.cpu_usage_percent}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-void-deep overflow-hidden">
                    <div
                      className="h-full bg-arc-500 rounded-full"
                      style={{ width: `${Math.min(100, health.cpu_usage_percent)}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-lg bg-void/50 p-3.5 border border-white/5 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-ink-muted">RAM Usage</span>
                    <span className="font-mono font-bold text-white">{health.memory_used_gb} / {health.memory_total_gb} GB</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-void-deep overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 rounded-full"
                      style={{ width: `${health.memory_percent}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-lg bg-void/50 p-3.5 border border-white/5 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-ink-muted">Disk Free</span>
                    <span className="font-mono font-bold text-white">{health.disk_free_gb} GB</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-void-deep overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full"
                      style={{ width: `${100 - health.disk_percent}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-lg bg-void/50 p-3.5 border border-white/5 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-ink-muted">Database Size</span>
                    <span className="font-mono font-bold text-white">{health.database_size_mb} MB</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-ink-faint">
                    <span>SQLite Storage</span>
                    <span>Uptime: {Math.floor(health.uptime_seconds / 60)} min</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          )}
        </div>
      )}

      {/* TAB 2: USERS MANAGEMENT */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2.5 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-faint" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  loadUsersData(1, e.target.value, userStatusFilter);
                }}
                placeholder="Search by email, username, or name..."
                className="w-full rounded-lg border border-panel-border bg-void/60 pl-9 pr-3 py-2 text-xs font-body text-ink-primary focus:border-arc-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={userStatusFilter}
                onChange={(e) => {
                  setUserStatusFilter(e.target.value);
                  loadUsersData(1, userSearch, e.target.value);
                }}
                className="rounded-lg border border-panel-border bg-void/60 px-3 py-2 text-xs font-body text-ink-secondary focus:border-arc-500 focus:outline-none"
              >
                <option value="all">All Accounts</option>
                <option value="active">Active Only</option>
                <option value="suspended">Suspended Only</option>
                <option value="banned">Banned Only</option>
              </select>
            </div>
          </div>

          <GlassCard padding="none">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-white/5 bg-void/80 text-[10px] uppercase font-mono text-ink-faint">
                  <tr>
                    <th className="px-4 py-3">User & Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Level / XP</th>
                    <th className="px-4 py-3">Last Active</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{u.display_name}</div>
                        <div className="font-mono text-[11px] text-ink-muted">{u.email}</div>
                        {u.username && <div className="font-mono text-[10px] text-arc-400">@{u.username}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          u.role === "SUPER_ADMIN" ? "bg-arc-500/20 text-arc-300 border border-arc-500/40" : "text-ink-secondary"
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono">
                        <span className="text-cyan-400 font-bold">Lvl {u.level}</span>
                        <span className="text-ink-faint ml-1">({u.total_xp.toLocaleString()} XP)</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-ink-secondary">
                        {u.last_login_at ? new Date(u.last_login_at).toLocaleString() : "Never"}
                        {u.last_platform && <span className="ml-1 text-[9px] text-arc-400">[{u.last_platform}]</span>}
                      </td>
                      <td className="px-4 py-3">
                        {u.is_banned ? (
                          <span className="inline-flex items-center gap-1 text-crimson-400 text-[11px] font-semibold">
                            <Ban className="h-3 w-3" /> Banned
                          </span>
                        ) : u.is_suspended ? (
                          <span className="inline-flex items-center gap-1 text-amber-400 text-[11px] font-semibold">
                            <UserX className="h-3 w-3" /> Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-semibold">
                            <CheckCircle className="h-3 w-3" /> Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {u.is_banned || u.is_suspended ? (
                            <button
                              onClick={() => handleRestore(u.id)}
                              className="rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 text-[10px] font-semibold text-emerald-300 hover:bg-emerald-500/20"
                            >
                              Restore
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => { setSelectedUserId(u.id); setShowSuspendModal(true); }}
                                className="rounded bg-amber-500/10 border border-amber-500/30 px-2 py-1 text-[10px] font-semibold text-amber-300 hover:bg-amber-500/20"
                              >
                                Suspend
                              </button>
                              <button
                                onClick={() => { setSelectedUserId(u.id); setShowBanModal(true); }}
                                className="rounded bg-crimson-500/10 border border-crimson-500/30 px-2 py-1 text-[10px] font-semibold text-crimson-300 hover:bg-crimson-500/20"
                              >
                                Ban
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleRevokeSessions(u.id)}
                            className="rounded bg-white/5 px-2 py-1 text-[10px] text-ink-muted hover:text-white"
                            title="Revoke active sessions"
                          >
                            Revoke
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}

      {/* TAB 3: DESKTOP INSTALLATIONS */}
      {activeTab === "installations" && (
        <div className="space-y-4">
          <p className="font-body text-xs text-ink-muted">
            Inspect physical Windows installations of ASCEND, hardware fingerprints, and manage remote blocklist rules.
          </p>

          <GlassCard padding="none">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-white/5 bg-void/80 text-[10px] uppercase font-mono text-ink-faint">
                  <tr>
                    <th className="px-4 py-3">Device ID / HWID</th>
                    <th className="px-4 py-3">Hostname</th>
                    <th className="px-4 py-3">OS / App Version</th>
                    <th className="px-4 py-3">Associated User</th>
                    <th className="px-4 py-3">Last Seen</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {installations.map((inst) => (
                    <tr key={inst.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3 font-mono text-[11px] text-white">
                        {inst.device_id}
                      </td>
                      <td className="px-4 py-3 font-semibold text-ink-primary">
                        {inst.hostname}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-ink-secondary">
                        {inst.os_version} (v{inst.app_version})
                      </td>
                      <td className="px-4 py-3 text-ink-muted">
                        {inst.user_email || "Anonymous / Unlinked"}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-ink-secondary">
                        {new Date(inst.last_seen_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        {inst.is_blocked ? (
                          <span className="inline-flex items-center gap-1 text-crimson-400 text-[11px] font-semibold">
                            <Lock className="h-3 w-3" /> Blocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-semibold">
                            <Unlock className="h-3 w-3" /> Authorized
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {inst.is_blocked ? (
                          <button
                            onClick={() => handleUnblockDevice(inst.device_id)}
                            className="rounded bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-[10px] font-semibold text-emerald-300 hover:bg-emerald-500/20"
                          >
                            Unblock
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBlockDevice(inst.device_id)}
                            className="rounded bg-crimson-500/10 border border-crimson-500/30 px-2.5 py-1 text-[10px] font-semibold text-crimson-300 hover:bg-crimson-500/20"
                          >
                            Block Device
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {installations.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-ink-faint">
                        No desktop installations registered yet. Once ASCENDSetup.exe is launched, hardware will appear here.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}

      {/* TAB 4: MODULES & FEATURE FLAGS */}
      {activeTab === "features" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(features).map(([key, item]) => (
            <GlassCard key={key} padding="md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-mono text-xs font-bold text-white">{key}</h4>
                  <p className="mt-1 font-body text-[11px] text-ink-muted">{item.desc}</p>
                </div>
                <button
                  onClick={() => handleToggleFeature(key, item.active)}
                  className={`rounded-full px-3 py-1 font-mono text-[10px] font-bold uppercase transition-all ${
                    item.active
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-white/5 text-ink-faint border border-white/10"
                  }`}
                >
                  {item.active ? "Enabled" : "Disabled"}
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* TAB 5: BROADCAST & MAINTENANCE */}
      {activeTab === "maintenance" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassCard padding="lg">
            <h3 className="font-display text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Bell className="h-4 w-4 text-arc-400" />
              System-wide Announcement Banner
            </h3>
            <p className="font-body text-xs text-ink-muted mb-4">
              Broadcast high-priority messages to all active website and desktop users.
            </p>

            <div className="space-y-3">
              <div>
                <label className="hud-label mb-1 block">Title</label>
                <input
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  placeholder="e.g. Scheduled System Upgrade"
                  className="w-full rounded-lg border border-panel-border bg-void/60 px-3 py-2 text-xs font-body text-ink-primary focus:border-arc-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="hud-label mb-1 block">Message</label>
                <textarea
                  value={announcementMsg}
                  onChange={(e) => setAnnouncementMsg(e.target.value)}
                  rows={3}
                  placeholder="Details regarding updates, quest seasons, or new integrations..."
                  className="w-full rounded-lg border border-panel-border bg-void/60 px-3 py-2 text-xs font-body text-ink-primary focus:border-arc-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="hud-label mb-1 block">Alert Style</label>
                <select
                  value={announcementVariant}
                  onChange={(e) => setAnnouncementVariant(e.target.value as any)}
                  className="rounded-lg border border-panel-border bg-void/60 px-3 py-1.5 text-xs font-body text-ink-secondary"
                >
                  <option value="info">Info (Cyan)</option>
                  <option value="warning">Warning (Amber)</option>
                  <option value="alert">Critical Alert (Crimson)</option>
                </select>
              </div>

              <button onClick={handleSaveAnnouncement} className="btn-primary text-xs w-full mt-2">
                Broadcast Announcement
              </button>
            </div>
          </GlassCard>

          <GlassCard padding="lg">
            <h3 className="font-display text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              Platform Maintenance Mode
            </h3>
            <p className="font-body text-xs text-ink-muted mb-4">
              When active, blocks standard user logins and pauses quest generation while preserving owner access.
            </p>

            <div className="space-y-4">
              <div>
                <label className="hud-label mb-1 block">Maintenance Notice Message</label>
                <textarea
                  value={maintenanceMsg}
                  onChange={(e) => setMaintenanceMsg(e.target.value)}
                  rows={2}
                  placeholder="ASCEND is undergoing routine architecture maintenance..."
                  className="w-full rounded-lg border border-panel-border bg-void/60 px-3 py-2 text-xs font-body text-ink-primary focus:border-arc-500 focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-lg border border-white/5 bg-void/50 flex items-center justify-between">
                <div>
                  <span className="font-body text-xs font-semibold text-white block">Maintenance Status</span>
                  <span className={`font-mono text-[11px] ${isMaintenanceActive ? "text-amber-400 font-bold" : "text-emerald-400"}`}>
                    {isMaintenanceActive ? "ACTIVE — Platform in Maintenance" : "INACTIVE — Platform Fully Operational"}
                  </span>
                </div>
                <button
                  onClick={handleToggleMaintenance}
                  className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                    isMaintenanceActive
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
                  }`}
                >
                  {isMaintenanceActive ? "Disable Maintenance" : "Activate Maintenance"}
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* TAB 6: AUDIT LOG */}
      {activeTab === "audit" && (
        <GlassCard padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/5 bg-void/80 text-[10px] uppercase font-mono text-ink-faint">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Admin Email</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-ink-faint">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-bold text-arc-400">
                      {log.action}
                    </td>
                    <td className="px-4 py-3 text-white">
                      {log.actor_email}
                    </td>
                    <td className="px-4 py-3 text-cyan-300">
                      {log.target_type ? `[${log.target_type}] ` : ""}{log.target_id || "-"}
                    </td>
                    <td className="px-4 py-3 text-ink-secondary font-body">
                      {log.details || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* Suspend User Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <GlassCard padding="lg" className="w-full max-w-md">
            <h3 className="font-display text-base font-bold text-amber-400 mb-2">Suspend User Account</h3>
            <p className="font-body text-xs text-ink-muted mb-4">
              Suspends login access and terminates active sessions.
            </p>
            <textarea
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="State the reason for suspension..."
              rows={3}
              className="w-full rounded-lg border border-panel-border bg-void/60 p-3 text-xs font-body text-ink-primary mb-4 focus:border-amber-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowSuspendModal(false)} className="btn-secondary text-xs px-3 py-1.5">
                Cancel
              </button>
              <button onClick={handleSuspend} className="rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-bold text-black hover:bg-amber-400">
                Confirm Suspension
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Ban User Modal */}
      {showBanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <GlassCard padding="lg" className="w-full max-w-md border-crimson-500/40">
            <h3 className="font-display text-base font-bold text-crimson-400 mb-2">Permanently Ban User</h3>
            <p className="font-body text-xs text-ink-muted mb-4">
              Revokes all access, invalidates credentials, and terminates every session.
            </p>
            <textarea
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="State the official ban reason..."
              rows={3}
              className="w-full rounded-lg border border-panel-border bg-void/60 p-3 text-xs font-body text-ink-primary mb-4 focus:border-crimson-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowBanModal(false)} className="btn-secondary text-xs px-3 py-1.5">
                Cancel
              </button>
              <button onClick={handleBan} className="rounded-lg bg-crimson-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-crimson-500">
                Execute Permanent Ban
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
