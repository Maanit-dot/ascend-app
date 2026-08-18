"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("ASCEND runtime error:", error);
  }, [error]);

  return (
    <html>
      <body className="flex min-h-screen items-center justify-center bg-void px-4">
        <GlassCard padding="lg" glow="crimson" className="max-w-md text-center">
          <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-crimson-400" />
          <h1 className="font-display text-lg font-bold text-ink-primary">
            Something disrupted the signal
          </h1>
          <p className="mt-2 font-body text-sm text-ink-muted">
            ASCEND hit an unexpected error. Your progress is saved server-side — this is just a
            rendering hiccup.
          </p>
          <button onClick={reset} className="btn-primary mt-5">
            Try Again
          </button>
        </GlassCard>
      </body>
    </html>
  );
}
