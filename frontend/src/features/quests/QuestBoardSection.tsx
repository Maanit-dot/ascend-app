"use client";

import { AnimatePresence } from "framer-motion";
import { QuestCard } from "@/features/quests/QuestCard";
import type { QuestInstance } from "@/types";

interface QuestBoardSectionProps {
  title: string;
  subtitle?: string;
  quests: QuestInstance[];
  onLog: (questId: string, delta: number) => Promise<void>;
  emptyLabel?: string;
}

export function QuestBoardSection({
  title,
  subtitle,
  quests,
  onLog,
  emptyLabel,
}: QuestBoardSectionProps) {
  if (quests.length === 0 && !emptyLabel) return null;

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-display text-base font-semibold text-ink-primary">{title}</h2>
        {subtitle && <span className="hud-label">{subtitle}</span>}
      </div>

      {quests.length === 0 ? (
        <div className="glass-panel flex items-center justify-center py-8 text-center">
          <p className="font-body text-sm text-ink-muted">{emptyLabel}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {quests.map((quest) => (
              <QuestCard key={quest.id} quest={quest} onLog={(delta) => onLog(quest.id, delta)} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
