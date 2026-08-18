"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

interface LevelUpModalProps {
  isOpen: boolean;
  newLevel: number;
  unlocks: string[];
  onClose: () => void;
}

export function LevelUpModal({ isOpen, newLevel, unlocks, onClose }: LevelUpModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-void/80 backdrop-blur-sm"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Level up"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm px-4"
          >
            <GlassCard padding="lg" glow="amber" className="relative overflow-hidden text-center">
              <button
                onClick={onClose}
                className="absolute right-4 top-4 text-ink-faint hover:text-ink-primary"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-400/15 shadow-glow-amber"
              >
                <Sparkles className="h-8 w-8 text-amber-400" />
              </motion.div>

              <p className="hud-label text-amber-400">Level Up</p>
              <p className="font-display text-5xl font-bold text-ink-primary">{newLevel}</p>

              {unlocks.length > 0 && (
                <div className="mt-5 space-y-1.5 border-t border-panel-border pt-4">
                  {unlocks.map((unlock, i) => (
                    <p key={i} className="font-body text-sm text-ink-secondary">
                      {unlock}
                    </p>
                  ))}
                </div>
              )}

              <button onClick={onClose} className="btn-primary mt-6 w-full">
                Continue
              </button>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
