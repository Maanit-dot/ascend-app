"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Loader2, Lock } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { storyApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { StoryChapter } from "@/types";

export default function StoryModePage() {
  const [chapters, setChapters] = useState<StoryChapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<StoryChapter | null>(null);

  useEffect(() => {
    storyApi.listChapters().then((c) => {
      setChapters(c);
      setIsLoading(false);
    });
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-primary">Story Mode</h1>
        <p className="mt-1 font-body text-sm text-ink-muted">
          An original narrative that unfolds as your discipline compounds.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-arc-400" />
        </div>
      ) : (
        <div className="relative space-y-3 pl-6">
          <div className="absolute bottom-0 left-[9px] top-2 w-px bg-panel-border" aria-hidden />
          {chapters.map((chapter, i) => (
            <motion.button
              key={chapter.key}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => chapter.is_unlocked && setSelected(chapter)}
              disabled={!chapter.is_unlocked}
              className="relative block w-full text-left"
            >
              <span
                className={cn(
                  "absolute -left-6 top-4 h-2.5 w-2.5 rounded-full border-2",
                  chapter.is_unlocked
                    ? "border-arc-400 bg-arc-500 shadow-glow-arc"
                    : "border-panel-border bg-void"
                )}
              />
              <GlassCard
                padding="md"
                className={cn(
                  "transition-all",
                  chapter.is_unlocked ? "hover:border-arc-500/40" : "opacity-50"
                )}
              >
                <div className="flex items-center gap-3">
                  {chapter.is_unlocked ? (
                    <BookOpen className="h-5 w-5 flex-shrink-0 text-arc-400" />
                  ) : (
                    <Lock className="h-5 w-5 flex-shrink-0 text-ink-faint" />
                  )}
                  <div>
                    <h3 className="font-display text-sm font-semibold text-ink-primary">
                      {chapter.title}
                    </h3>
                    <p className="hud-label mt-0.5">
                      {chapter.is_unlocked ? "Unlocked" : "Locked"}
                    </p>
                  </div>
                </div>
              </GlassCard>
            </motion.button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-void/85 p-4 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg"
            >
              <GlassCard padding="lg" glow="arc">
                <p className="hud-label text-arc-400">Story Mode</p>
                <h2 className="mt-1 font-display text-xl font-bold text-ink-primary">{selected.title}</h2>
                <p className="mt-4 whitespace-pre-line font-body text-sm leading-relaxed text-ink-secondary">
                  {selected.body_text}
                </p>
                <button onClick={() => setSelected(null)} className="btn-secondary mt-6 w-full">
                  Close
                </button>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
