import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-void px-4 text-center">
      <div className="grid-backdrop absolute inset-0 bg-arc-glow" />
      <div className="relative z-10 flex flex-col items-center">
        <Compass className="mb-4 h-10 w-10 text-arc-400" />
        <p className="hud-label">Error 404</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-ink-primary">
          This quest doesn&apos;t exist
        </h1>
        <p className="mt-2 max-w-sm font-body text-sm text-ink-muted">
          The path you followed leads nowhere on the map. Head back to your dashboard.
        </p>
        <Link href="/dashboard" className="btn-primary mt-6">
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
