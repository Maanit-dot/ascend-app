"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import {
  LogOut,
  Loader2,
  Download,
  Monitor,
  Globe,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { firebaseAuth } from "@/lib/firebase";
import { authApi, userApi } from "@/lib/api/auth";
import { useUserStore } from "@/store/useUserStore";
import { useUIStore } from "@/store/useUIStore";
import type { UserSessionItem } from "@/types";

export default function SettingsPage() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);
  const reset = useUserStore((s) => s.reset);
  const pushToast = useUIStore((s) => s.pushToast);

  const [displayName, setDisplayName] = useState(user?.display_name ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [sessions, setSessions] = useState<UserSessionItem[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    try {
      setLoadingSessions(true);
      const list = await authApi.getSessions();
      setSessions(list);
    } catch {
      // Non-critical if sessions couldn't be loaded
    } finally {
      setLoadingSessions(false);
    }
  }

  async function handleRevoke(sessionId: string) {
    try {
      await authApi.revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      pushToast({ variant: "success", title: "Session Revoked" });
    } catch {
      pushToast({ variant: "danger", title: "Could not revoke session" });
    }
  }

  if (!user) return null;

  async function handleSave() {
    setIsSaving(true);
    try {
      const updated = await userApi.updateProfile({ display_name: displayName.trim() });
      setUser(updated);
      pushToast({ variant: "success", title: "Profile updated" });
    } catch {
      pushToast({ variant: "danger", title: "Could not update profile" });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSignOut() {
    try {
      await authApi.logout();
      await signOut(firebaseAuth);
    } catch {}
    reset();
    router.push("/sign-in");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-primary">Settings</h1>
        <p className="mt-1 font-body text-xs text-ink-muted">
          Manage your personal ASCEND profile, active devices, and download desktop software.
        </p>
      </div>

      {/* Profile Section */}
      <GlassCard padding="lg">
        <h2 className="mb-4 font-display text-base font-semibold text-ink-primary">User Identity</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="settings-name" className="hud-label mb-1.5 block">
              Display Name
            </label>
            <input
              id="settings-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={64}
              className="w-full rounded-lg border border-panel-border bg-void/60 px-3.5 py-2 font-body text-sm text-ink-primary focus:border-arc-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="hud-label mb-1.5 block">ASCEND Username</label>
            <input
              value={user.username ? `@${user.username}` : "Unset"}
              disabled
              className="w-full rounded-lg border border-panel-border bg-void/30 px-3.5 py-2 font-body text-sm text-ink-faint font-mono"
            />
          </div>

          <div>
            <label className="hud-label mb-1.5 block">Email Address</label>
            <input
              value={user.email}
              disabled
              className="w-full rounded-lg border border-panel-border bg-void/30 px-3.5 py-2 font-body text-sm text-ink-faint"
            />
          </div>

          <div>
            <label className="hud-label mb-1.5 block">Account Role</label>
            <input
              value={user.role || (user.is_owner ? "SUPER_ADMIN" : "USER")}
              disabled
              className="w-full rounded-lg border border-panel-border bg-void/30 px-3.5 py-2 font-body text-sm text-arc-400 font-mono font-bold"
            />
          </div>
        </div>

        <button onClick={handleSave} disabled={isSaving} className="btn-primary text-xs py-2 px-4">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Profile"}
        </button>
      </GlassCard>

      {/* Windows Desktop Application Download Section */}
      <GlassCard padding="lg" glow="arc">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-base font-semibold text-ink-primary">
                ASCEND Desktop Application (Windows)
              </h2>
              <span className="rounded-full border border-arc-500/40 bg-arc-500/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-arc-300">
                v1.0.0
              </span>
            </div>
            <p className="mt-1 font-body text-xs text-ink-muted">
              Official Windows installer (.exe). Install to unlock local JARVIS execution, hardware telemetry, and app integrations.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <div className="flex items-center gap-2 rounded-lg border border-panel-border bg-void/40 p-2.5 text-xs font-body text-ink-secondary">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <span>Real-time Voice & Vision Execution</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-panel-border bg-void/40 p-2.5 text-xs font-body text-ink-secondary">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <span>Live Hardware Telemetry (CPU / RAM / Disk)</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-panel-border bg-void/40 p-2.5 text-xs font-body text-ink-secondary">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <span>System Tray & Native Taskbar Minimization</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-panel-border bg-void/40 p-2.5 text-xs font-body text-ink-secondary">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <span>Universal Account Synchronization</span>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <a
            href="/api/v1/desktop/download"
            className="btn-primary flex items-center gap-2 px-5 py-2.5 text-xs font-semibold shadow-glow-arc"
          >
            <Download className="h-4 w-4" />
            Download for Windows (ASCENDSetup.exe)
          </a>
          <a
            href="https://github.com/Maanit-dot/ascend-app/releases/latest"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-xs py-2.5 px-4"
          >
            View GitHub Release
          </a>
          <span className="font-mono text-[11px] text-ink-faint">
            Supports Windows 10 & 11 (64-bit)
          </span>
        </div>
      </GlassCard>

      {/* Active Sessions & Device Management */}
      <GlassCard padding="lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-base font-semibold text-ink-primary">Active Sessions & Devices</h2>
            <p className="font-body text-xs text-ink-muted">
              Manage devices and browser sessions currently authenticated with your ASCEND account.
            </p>
          </div>
          <button
            onClick={loadSessions}
            className="text-xs text-arc-400 hover:text-white font-mono flex items-center gap-1"
          >
            Refresh
          </button>
        </div>

        <div className="space-y-2">
          {sessions.map((sess) => (
            <div
              key={sess.id}
              className="flex items-center justify-between rounded-lg border border-panel-border/60 bg-void/40 p-3 text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-arc-500/10 text-arc-400 border border-arc-500/20">
                  {sess.client_type === "desktop" ? <Monitor className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{sess.device_name}</span>
                    <span className="rounded bg-white/10 px-1.5 py-0.2 font-mono text-[9px] uppercase text-ink-secondary">
                      {sess.client_type}
                    </span>
                    {sess.is_current && (
                      <span className="rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9px] px-1.5 py-0.2 font-bold">
                        Current Session
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-[10px] text-ink-faint mt-0.5">
                    IP: {sess.ip_address || "Private"} • Active: {new Date(sess.last_active_at).toLocaleString()}
                  </div>
                </div>
              </div>

              {!sess.is_current && (
                <button
                  onClick={() => handleRevoke(sess.id)}
                  className="rounded p-1.5 text-ink-faint hover:text-crimson-400 hover:bg-crimson-500/10 transition-colors"
                  title="Revoke session"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}

          {sessions.length === 0 && !loadingSessions && (
            <p className="text-xs text-ink-faint py-2">No active sessions tracked.</p>
          )}
        </div>
      </GlassCard>

      {/* Account Termination / Sign Out */}
      <GlassCard padding="lg">
        <h2 className="mb-1 font-display text-base font-semibold text-ink-primary">Session Security</h2>
        <p className="mb-4 font-body text-xs text-ink-muted">Signed in as {user.email}</p>
        <button onClick={handleSignOut} className="btn-secondary text-crimson-400 text-xs py-2 px-4">
          <LogOut className="h-4 w-4" />
          Sign Out of ASCEND
        </button>
      </GlassCard>
    </div>
  );
}
