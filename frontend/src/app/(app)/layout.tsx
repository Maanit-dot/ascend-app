"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { JarvisWidget } from "@/features/companion/JarvisWidget";
import { cn } from "@/lib/utils";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useUserStore((s) => s.user);
  const isLoading = useUserStore((s) => s.isLoading);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);

  const isDashboard = pathname === "/dashboard" || pathname === "/";

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
        <div className="flex flex-col items-center gap-5">
          <div className="relative flex h-20 w-20 items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-arc-500/30 animate-spin-slow" />
            <div className="absolute inset-1 rounded-full border border-arc-400/15 animate-spin-reverse" />
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
          <div className="w-40 h-0.5 rounded-full bg-void-deep overflow-hidden">
            <div className="h-full w-1/2 rounded-full bg-arc-500/60 animate-shimmer bg-gradient-to-r from-transparent via-arc-400 to-transparent bg-[length:200%_100%]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 h-[100dvh] max-h-[100dvh] w-screen max-w-screen bg-[#03020A] overflow-hidden flex z-0 select-none">
      {/* ── Background Cosmic Space, Nebula & Cyber Grid Layers ── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        {/* Cyber grid */}
        <div className="absolute inset-0 cyber-grid opacity-20" />

        {/* Deep purple nebula top-center */}
        <div className="absolute -top-20 left-1/3 w-[650px] h-[450px] bg-gradient-to-b from-arc-600/25 via-arc-900/10 to-transparent rounded-full blur-[130px]" />

        {/* Violet glow behind sidebar/hunter card */}
        <div className="absolute bottom-0 left-0 w-80 h-96 bg-arc-500/15 rounded-full blur-[100px]" />

        {/* Electric blue / cyan accent behind core */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-cyan-500/8 rounded-full blur-[120px]" />

        {/* Violet glow behind JARVIS AI */}
        <div className="absolute top-10 right-0 w-72 h-80 bg-arc-500/12 rounded-full blur-[90px]" />

        {/* Subtle scanline overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,38,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none opacity-40" />
      </div>

      {/* ── Left Sidebar (15% width) ── */}
      <Sidebar />

      {/* ── Central content column (66% width) ── */}
      <div className="relative flex h-full flex-1 min-w-0 flex-col overflow-hidden z-10">
        <TopBar />
        <main
          className={cn(
            "flex-1 min-h-0 p-2 sm:p-2.5 overflow-hidden flex flex-col"
          )}
        >
          {children}
        </main>
      </div>

      {/* ── Right JARVIS Panel (19% width) ── */}
      <JarvisWidget />
    </div>
  );
}
