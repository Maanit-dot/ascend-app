"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { LogOut, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { firebaseAuth } from "@/lib/firebase";
import { userApi } from "@/lib/api/auth";
import { useUserStore } from "@/store/useUserStore";
import { useUIStore } from "@/store/useUIStore";

export default function SettingsPage() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);
  const reset = useUserStore((s) => s.reset);
  const pushToast = useUIStore((s) => s.pushToast);

  const [displayName, setDisplayName] = useState(user?.display_name ?? "");
  const [isSaving, setIsSaving] = useState(false);

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
    await signOut(firebaseAuth);
    reset();
    router.push("/sign-in");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-primary">Settings</h1>
        <p className="mt-1 font-body text-sm text-ink-muted">Manage your ASCEND profile.</p>
      </div>

      <GlassCard padding="lg">
        <h2 className="mb-4 font-display text-base font-semibold text-ink-primary">Profile</h2>

        <label htmlFor="settings-name" className="hud-label mb-1.5 block">
          Display Name
        </label>
        <input
          id="settings-name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={64}
          className="mb-4 w-full rounded-lg border border-panel-border bg-void/60 px-3.5 py-2.5 font-body text-sm text-ink-primary focus:border-arc-500 focus:outline-none"
        />

        <label className="hud-label mb-1.5 block">Email</label>
        <input
          value={user.email}
          disabled
          className="mb-4 w-full rounded-lg border border-panel-border bg-void/30 px-3.5 py-2.5 font-body text-sm text-ink-faint"
        />

        <label className="hud-label mb-1.5 block">Timezone</label>
        <input
          value={user.timezone}
          disabled
          className="mb-6 w-full rounded-lg border border-panel-border bg-void/30 px-3.5 py-2.5 font-body text-sm text-ink-faint"
        />

        <button onClick={handleSave} disabled={isSaving} className="btn-primary">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
        </button>
      </GlassCard>

      <GlassCard padding="lg">
        <h2 className="mb-1 font-display text-base font-semibold text-ink-primary">Session</h2>
        <p className="mb-4 font-body text-sm text-ink-muted">Signed in as {user.email}</p>
        <button onClick={handleSignOut} className="btn-secondary text-crimson-400">
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </GlassCard>
    </div>
  );
}
