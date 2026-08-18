"use client";

import { useEffect, useState } from "react";
import { Gauge, Loader2 } from "lucide-react";
import { QuestBoardSection } from "@/features/quests/QuestBoardSection";
import { QuestHistoryChart } from "@/features/quests/QuestHistoryChart";
import { useQuestBoardStore } from "@/store/useQuestBoardStore";
import { questApi } from "@/lib/api/quests";
import type { QuestHistoryEntry } from "@/types";

export default function QuestsPage() {
  const { board, isLoading, fetchToday, logProgress } = useQuestBoardStore();
  const [history, setHistory] = useState<QuestHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    fetchToday();
    questApi
      .getHistory(30)
      .then(setHistory)
      .finally(() => setHistoryLoading(false));
  }, [fetchToday]);

  async function handleLog(questId: string, delta: number) {
    await logProgress(questId, delta);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-primary">Daily Quests</h1>
        <p className="mt-1 font-body text-sm text-ink-muted">
          Today&apos;s board, scaled to your current difficulty tier.
        </p>
      </div>

      {isLoading && !board ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-arc-400" />
        </div>
      ) : board ? (
        <div className="space-y-8">
          <div className="flex items-center gap-1.5 text-ink-muted">
            <Gauge className="h-3.5 w-3.5 text-arc-400" />
            <span className="hud-label">Difficulty ×{board.difficulty_multiplier.toFixed(2)}</span>
          </div>

          {board.categories.map((section) => (
            <QuestBoardSection
              key={section.label}
              title={section.label}
              quests={section.quests}
              onLog={handleLog}
            />
          ))}

          <QuestBoardSection
            title="Optional Bonus"
            quests={board.optional}
            onLog={handleLog}
            emptyLabel="No optional quests today."
          />
          {board.hidden.length > 0 && (
            <QuestBoardSection
              title="Hidden Quests"
              subtitle="Surfaced by ARC"
              quests={board.hidden}
              onLog={handleLog}
            />
          )}
        </div>
      ) : null}

      <div>
        <h2 className="mb-3 font-display text-base font-semibold text-ink-primary">
          30-Day Completion History
        </h2>
        {historyLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-arc-400" />
          </div>
        ) : (
          <QuestHistoryChart data={history} />
        )}
      </div>
    </div>
  );
}
