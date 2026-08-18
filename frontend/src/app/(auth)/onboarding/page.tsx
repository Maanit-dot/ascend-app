"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, Dumbbell, Target, Layers, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { userApi } from "@/lib/api/auth";
import { useUserStore } from "@/store/useUserStore";
import { cn } from "@/lib/utils";
import type { PrimaryTrack } from "@/types";

const TRACKS: { key: PrimaryTrack; label: string; description: string; icon: typeof BookOpen }[] = [
  {
    key: "exam",
    label: "Exam Prep",
    description: "JEE-focused. Study quests weighted heavier than physical training.",
    icon: BookOpen,
  },
  {
    key: "fitness",
    label: "Fitness",
    description: "Training-focused. Strength, cardio, and mobility take priority.",
    icon: Dumbbell,
  },
  {
    key: "discipline",
    label: "Discipline",
    description: "Balanced load focused on consistency and streak-building.",
    icon: Target,
  },
  {
    key: "hybrid",
    label: "Hybrid",
    description: "Equal weighting across study and physical quests.",
    icon: Layers,
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const setUser = useUserStore((s) => s.setUser);
  const [displayName, setDisplayName] = useState("");
  const [track, setTrack] = useState<PrimaryTrack>("hybrid");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!displayName.trim()) return;
    setIsSubmitting(true);
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const updated = await userApi.onboard({
        display_name: displayName.trim(),
        timezone,
        primary_track: track,
      });
      setUser(updated);
      router.push("/dashboard");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-void px-4 py-12">
      <div className="grid-backdrop absolute inset-0 bg-arc-glow" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className="mb-7 text-center">
          <h1 className="font-display text-2xl font-bold text-ink-primary">Calibrate Your Character</h1>
          <p className="mt-1.5 font-body text-sm text-ink-muted">
            This sets your starting quest weighting — ARC adjusts it further as you play.
          </p>
        </div>

        <GlassCard padding="lg" glow="arc">
          <label htmlFor="name" className="hud-label mb-1.5 block">
            What should we call you?
          </label>
          <input
            id="name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={64}
            placeholder="Your name or callsign"
            className="mb-6 w-full rounded-lg border border-panel-border bg-void/60 px-3.5 py-2.5 font-body text-sm text-ink-primary placeholder:text-ink-faint focus:border-arc-500 focus:outline-none"
          />

          <span className="hud-label mb-2.5 block">Primary Track</span>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {TRACKS.map((t) => {
              const Icon = t.icon;
              const isSelected = track === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTrack(t.key)}
                  className={cn(
                    "rounded-lg border p-3.5 text-left transition-all",
                    isSelected
                      ? "border-arc-500 bg-arc-500/10 shadow-glow-arc"
                      : "border-panel-border bg-void/40 hover:border-arc-500/40"
                  )}
                >
                  <Icon className={cn("mb-2 h-5 w-5", isSelected ? "text-arc-400" : "text-ink-muted")} />
                  <p className="font-body text-sm font-semibold text-ink-primary">{t.label}</p>
                  <p className="mt-0.5 font-body text-xs text-ink-muted">{t.description}</p>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!displayName.trim() || isSubmitting}
            className="btn-primary mt-7 w-full"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enter ASCEND"}
          </button>
        </GlassCard>
      </motion.div>
    </div>
  );
}
