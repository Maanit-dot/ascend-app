"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, AlertTriangle, XCircle, Sparkles, X } from "lucide-react";
import { useUIStore, type ToastMessage } from "@/store/useUIStore";
import { cn } from "@/lib/utils";

const VARIANT_CONFIG: Record<
  ToastMessage["variant"],
  { icon: typeof Info; accent: string; glow: string }
> = {
  success: { icon: CheckCircle2, accent: "text-cyan-500", glow: "shadow-glow-cyan" },
  info: { icon: Info, accent: "text-arc-400", glow: "shadow-glow-arc" },
  warning: { icon: AlertTriangle, accent: "text-amber-400", glow: "shadow-glow-amber" },
  danger: { icon: XCircle, accent: "text-crimson-400", glow: "shadow-glow-crimson" },
  levelup: { icon: Sparkles, accent: "text-amber-400", glow: "shadow-glow-amber" },
};

export function ToastHost() {
  const toasts = useUIStore((s) => s.toasts);
  const dismissToast = useUIStore((s) => s.dismissToast);

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-3 sm:bottom-6 sm:right-6"
      role="region"
      aria-live="polite"
      aria-label="Notifications"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const config = VARIANT_CONFIG[toast.variant];
          const Icon = config.icon;
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={cn(
                "glass-panel-raised pointer-events-auto flex items-start gap-3 p-4",
                config.glow
              )}
            >
              <Icon className={cn("mt-0.5 h-5 w-5 flex-shrink-0", config.accent)} aria-hidden />
              <div className="flex-1">
                <p className="font-body text-sm font-semibold text-ink-primary">{toast.title}</p>
                {toast.description && (
                  <p className="mt-0.5 font-body text-xs text-ink-muted">{toast.description}</p>
                )}
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="text-ink-faint transition-colors hover:text-ink-primary"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
