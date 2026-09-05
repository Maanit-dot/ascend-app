"use client";

/* TEMPORARY visual-verification harness — seeds the Zustand stores with mock
   data so the dashboard renders without Firebase/backend, then mounts the exact
   same composition as the real (app) layout. Delete this route after use. */

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { JarvisWidget } from "@/features/companion/JarvisWidget";
import DashboardPage from "@/app/(app)/dashboard/page";
import { useUserStore } from "@/store/useUserStore";
import { useQuestBoardStore } from "@/store/useQuestBoardStore";
import type { AscendUser, DailyQuestBoard, QuestInstance } from "@/types";

const MOCK_USER: AscendUser = {
  id: "mock-maanit",
  email: "maanit@ascend.io",
  display_name: "Maanit",
  avatar_url: null,
  is_onboarded: true,
  timezone: "UTC",
  primary_track: "hybrid",
  created_at: "2026-01-01T00:00:00Z",
  character: {
    id: "char-1",
    level: 25,
    current_xp: 1115,
    total_xp_earned: 52340,
    xp_required_for_next_level: 1517,
    xp_progress_percent: 73.5,
    stats: {
      knowledge: 4,
      strength: 64,
      stamina: 50,
      recovery: 40,
      focus: 55,
      discipline: 60,
      consistency: 45,
      agility: 45,
      speed: 40,
      potential: 70,
      luck: 30,
      mental_fortitude: 50,
    },
    current_streak_days: 3,
    longest_streak_days: 12,
    last_quest_completed_date: null,
    active_title_id: null,
    difficulty_multiplier: 2.1,
    burnout_risk_score: 0.2,
  },
};

function quest(
  id: string,
  name: string,
  iconKey: string,
  category: QuestInstance["template"]["category"],
  unit: QuestInstance["template"]["unit"],
  current: number,
  target: number,
  xp: number
): QuestInstance {
  return {
    id,
    assigned_date: "2026-09-04",
    quest_type: "mandatory",
    target_value: target,
    current_value: current,
    xp_reward: xp,
    is_completed: current >= target,
    completed_at: null,
    ai_rationale: null,
    difficulty_snapshot: 2.1,
    template: {
      id: `${id}-t`,
      key: id,
      name,
      description: "",
      category,
      unit,
      icon_key: iconKey,
    },
  };
}

const MOCK_BOARD: DailyQuestBoard = {
  date: "2026-09-04",
  categories: [
    {
      label: "Study",
      quests: [
        quest("jee", "Solve 200 JEE Questions", "jee_questions", "study", "questions", 0, 200, 500),
        quest("study-time", "Study Time", "sleep", "study", "hours", 0, 5, 200),
      ],
    },
    {
      label: "Core",
      quests: [quest("situps", "Workout: Sit-ups", "pushups", "core", "reps", 50, 100, 100)],
    },
    {
      label: "Recovery",
      quests: [quest("read", "Read Book", "default_chapter", "recovery", "minutes", 20, 30, 80)],
    },
  ],
  optional: [],
  hidden: [],
  companion_message: "You don't need to feel ready. You need to log the first rep.",
  difficulty_multiplier: 2.1,
  completion_percent: 22,
};

export default function PreviewHarness() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    function seed() {
      useUserStore.setState({ user: MOCK_USER, isAuthenticated: true, isLoading: false });
      useQuestBoardStore.setState({ board: MOCK_BOARD, isLoading: false, error: null });
    }
    seed();
    setReady(true);
    // The root auth listener fires onAuthStateChanged(null) shortly after mount
    // and wipes the store; keep re-seeding briefly so the render stays populated.
    const id = setInterval(seed, 150);
    const stop = setTimeout(() => clearInterval(id), 4000);
    return () => {
      clearInterval(id);
      clearTimeout(stop);
    };
  }, []);

  if (!ready) return null;

  return (
    <div className="fixed inset-0 h-[100dvh] max-h-[100dvh] w-screen max-w-screen bg-[#03020A] overflow-hidden flex z-0 select-none">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 cyber-grid opacity-20" />
        <div className="absolute -top-20 left-1/3 w-[650px] h-[450px] bg-gradient-to-b from-arc-600/25 via-arc-900/10 to-transparent rounded-full blur-[130px]" />
        <div className="absolute bottom-0 left-0 w-80 h-96 bg-arc-500/15 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-cyan-500/8 rounded-full blur-[120px]" />
        <div className="absolute top-10 right-0 w-72 h-80 bg-arc-500/12 rounded-full blur-[90px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,38,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none opacity-40" />
      </div>

      <Sidebar />

      <div className="relative flex h-full flex-1 min-w-0 flex-col overflow-hidden z-10">
        <TopBar />
        <main className="flex-1 min-h-0 p-2 sm:p-2.5 overflow-hidden flex flex-col">
          <DashboardPage />
        </main>
      </div>

      <JarvisWidget />
    </div>
  );
}
