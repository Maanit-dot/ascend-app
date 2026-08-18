"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { JarvisWidget } from "@/features/companion/JarvisWidget";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const isLoading = useUserStore((s) => s.isLoading);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/sign-in");
      return;
    }
    if (user && !user.is_onboarded) {
      router.replace("/onboarding");
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || !user || !user.is_onboarded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-void">
        {/* ASCEND system boot screen */}
        <div className="flex flex-col items-center gap-5">
          <div className="relative flex h-20 w-20 items-center justify-center">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border border-arc-500/30 animate-spin-slow" />
            <div className="absolute inset-1 rounded-full border border-arc-400/15 animate-spin-reverse" />
            {/* Core */}
            <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-arc-700/40 to-arc-950/60 border border-arc-500/30 shadow-glow-arc animate-orb-pulse">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L22 12L12 22L2 12L12 2Z" stroke="rgba(139,92,246,0.5)" strokeWidth="1" fill="none" />
                <path d="M12 6L18 12L12 18L6 12L12 6Z" fill="rgba(139,92,246,0.4)" />
              </svg>
              <Loader2 className="absolute h-5 w-5 animate-spin text-arc-400" />
            </div>
          </div>
          <div className="text-center">
            <p className="font-display text-sm font-bold tracking-[0.3em] text-arc-400 text-glow-arc">ASCEND</p>
            <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-arc-500/50 mt-1">
              System Initializing...
            </p>
          </div>
          {/* Loading bar */}
          <div className="w-40 h-0.5 rounded-full bg-void-deep overflow-hidden">
            <div className="h-full w-1/2 rounded-full bg-arc-500/60 animate-shimmer bg-gradient-to-r from-transparent via-arc-400 to-transparent bg-[length:200%_100%]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 h-screen w-screen bg-void overflow-hidden flex z-0">
      {/* Ambient background — subtle purple radial at top-left */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-arc-500/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-cyan-500/5 rounded-full blur-[80px]" />
      </div>

      {/* ── Left Sidebar (fixed width, full height) ── */}
      <Sidebar />

      {/* ── Central content column (flex 1, full height) ── */}
      <div className="relative flex h-full flex-1 flex-col overflow-hidden z-10 min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 scrollbar-thin scrollbar-thumb-arc-900/40">
          {children}
        </main>
      </div>

      {/* ── Right JARVIS Panel (fixed width, full height) ── */}
      <JarvisWidget />
    </div>
  );
}
