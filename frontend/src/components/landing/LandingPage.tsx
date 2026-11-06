"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Download,
  Shield,
  Sparkles,
  Layers,
  Cpu,
  Swords,
  ChevronRight,
  ExternalLink,
  BookOpen,
  HelpCircle,
  CheckCircle2,
  Play,
  Monitor,
  Flame,
  Music,
  Calendar,
  FileText,
  Tv,
  Code,
} from "lucide-react";
import { useUserStore } from "@/store/useUserStore";

export function LandingPage() {
  const user = useUserStore((s) => s.user);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const [showDocsModal, setShowDocsModal] = useState(false);

  return (
    <div className="min-h-screen bg-[#03020A] text-white selection:bg-arc-500 selection:text-white relative overflow-hidden">
      {/* Background Glows & Cyber Grid */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 cyber-grid opacity-20" />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-arc-600/30 via-arc-900/10 to-transparent rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-cyan-600/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 -right-40 w-[500px] h-[500px] bg-arc-500/15 rounded-full blur-[130px]" />
      </div>

      {/* Top Navigation Bar */}
      <header className="relative z-30 border-b border-white/5 bg-void/70 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-arc-500 to-arc-800 shadow-glow-arc">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L22 12L12 22L2 12L12 2Z" stroke="white" strokeWidth="1.5" fill="rgba(255,255,255,0.15)" />
                <path d="M12 6L18 12L12 18L6 12L12 6Z" fill="white" opacity="0.9" />
              </svg>
            </div>
            <div>
              <span className="font-display text-base font-bold tracking-[0.2em] text-white text-glow-arc">
                ASCEND
              </span>
              <span className="ml-2 font-mono text-[9px] uppercase tracking-widest text-arc-400">
                AI OS V4.0
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-ink-muted">
            <a href="#features" className="hover:text-white transition-colors">Systems</a>
            <a href="#ecosystem" className="hover:text-white transition-colors">Expandable Hub</a>
            <a href="#desktop" className="hover:text-white transition-colors">Desktop App</a>
            <button onClick={() => setShowDocsModal(true)} className="hover:text-white transition-colors flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-arc-400" />
              Documentation
            </button>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="btn-primary flex items-center gap-2 px-5 py-2 text-xs font-semibold"
              >
                Enter System
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="rounded-lg border border-white/10 px-4 py-2 font-body text-xs font-semibold text-ink-secondary hover:border-arc-500/50 hover:text-white transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-in"
                  className="btn-primary px-4 py-2 text-xs font-semibold"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-20 pb-28 text-center lg:pt-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl space-y-6"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-arc-500/30 bg-arc-500/10 px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-arc-300">
            <Sparkles className="h-3.5 w-3.5 text-arc-400" />
            Unified Operating System for Peak Human Performance
          </div>

          <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            Turn Training & Discipline Into an <span className="bg-gradient-to-r from-arc-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">Expandable AI Ecosystem</span>
          </h1>

          <p className="font-body text-base sm:text-lg text-ink-muted leading-relaxed">
            ASCEND bridges your real-world progression with external tools. Experience AI-generated daily quests,
            12-stat RPG character progression, and seamless modular integration with Spotify, Google Calendar, Notion, and YouTube.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href={isAuthenticated ? "/dashboard" : "/sign-in"}
              className="btn-primary flex items-center gap-2.5 px-7 py-3 text-sm font-semibold shadow-glow-arc"
            >
              <span>{isAuthenticated ? "Launch ASCEND OS" : "Enter ASCEND Free"}</span>
              <ChevronRight className="h-4 w-4" />
            </Link>

            <a
              href="#desktop"
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-void-deep/80 px-6 py-3 font-body text-sm font-semibold text-ink-primary hover:border-cyan-500/50 hover:bg-white/5 transition-all"
            >
              <Download className="h-4 w-4 text-cyan-400" />
              <span>Download Desktop (.exe)</span>
            </a>
          </div>

          <div className="pt-8 flex items-center justify-center gap-6 text-xs text-ink-faint font-mono">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Windows 10 & 11 Certified
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Shared Cloud & Local Account
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Zero Telemetry Leaks
            </span>
          </div>
        </motion.div>
      </section>

      {/* Pillars Section */}
      <section id="features" className="relative z-10 border-t border-white/5 bg-[#050412]/60 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <p className="font-mono text-xs uppercase tracking-widest text-arc-400">Pillars of the Operating System</p>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl text-white">
              Three Unified Environments. One Central Core.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Pillar 1 */}
            <div className="rounded-2xl border border-white/10 bg-void/50 p-7 hover:border-arc-500/40 transition-all group">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-arc-500/10 text-arc-400 border border-arc-500/30 group-hover:scale-110 transition-transform">
                <Swords className="h-6 w-6" />
              </div>
              <h3 className="font-display text-xl font-bold text-white mb-2">RPG Discipline Engine</h3>
              <p className="font-body text-sm text-ink-muted leading-relaxed">
                12-stat character sheet tracking Knowledge, Strength, Stamina, Recovery, Focus, and Discipline.
                AI-adaptive daily quests that evolve with your burnout risk and historical consistency.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="rounded-2xl border border-white/10 bg-void/50 p-7 hover:border-cyan-500/40 transition-all group">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 group-hover:scale-110 transition-transform">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="font-display text-xl font-bold text-white mb-2">Expandable App Hub</h3>
              <p className="font-body text-sm text-ink-muted leading-relaxed">
                Connect Spotify music, Google Calendar agendas, Notion notes, and YouTube focus streams directly inside ASCEND.
                Never juggle disconnected browser tabs or separate software programs again.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="rounded-2xl border border-white/10 bg-void/50 p-7 hover:border-arc-500/40 transition-all group">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 group-hover:scale-110 transition-transform">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="font-display text-xl font-bold text-white mb-2">ARC / JARVIS Companion</h3>
              <p className="font-body text-sm text-ink-muted leading-relaxed">
                Natural-language autonomous assistant capable of cross-application coordination, desktop telemetry analysis,
                live speech synthesis, and guarded action execution with safety confirmations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Modular Integrations Showcase */}
      <section id="ecosystem" className="relative z-10 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 font-mono text-[10px] uppercase tracking-wider text-cyan-300">
              MODULAR INTEGRATION ARCHITECTURE
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">
              Real Functional Integrations. Not Merely Shortcuts.
            </h2>
            <p className="mt-2 text-ink-muted text-sm max-w-xl mx-auto">
              Every connected application runs through ASCEND&apos;s modular engine, providing live widgets, actions, and AI automation.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <div className="rounded-xl border border-white/10 bg-void/60 p-5 text-center flex flex-col items-center">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-3 border border-emerald-500/30">
                <Music className="h-5 w-5" />
              </div>
              <h4 className="font-display text-sm font-bold text-white">Spotify</h4>
              <p className="font-body text-[11px] text-ink-faint mt-1">Player controls, focus playlists, track search</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-void/60 p-5 text-center flex flex-col items-center">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 mb-3 border border-blue-500/30">
                <Calendar className="h-5 w-5" />
              </div>
              <h4 className="font-display text-sm font-bold text-white">Google Calendar</h4>
              <p className="font-body text-[11px] text-ink-faint mt-1">Agenda sync, quest deadlines, event scheduler</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-void/60 p-5 text-center flex flex-col items-center">
              <div className="h-10 w-10 rounded-lg bg-neutral-500/10 flex items-center justify-center text-neutral-300 mb-3 border border-neutral-500/30">
                <FileText className="h-5 w-5" />
              </div>
              <h4 className="font-display text-sm font-bold text-white">Notion</h4>
              <p className="font-body text-[11px] text-ink-faint mt-1">Study blueprint notes, instant thought capture</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-void/60 p-5 text-center flex flex-col items-center">
              <div className="h-10 w-10 rounded-lg bg-crimson-500/10 flex items-center justify-center text-crimson-400 mb-3 border border-crimson-500/30">
                <Tv className="h-5 w-5" />
              </div>
              <h4 className="font-display text-sm font-bold text-white">YouTube Focus</h4>
              <p className="font-body text-[11px] text-ink-faint mt-1">24/7 uninterrupted lo-fi & ambient streams</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-void/60 p-5 text-center flex flex-col items-center">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 mb-3 border border-purple-500/30">
                <Code className="h-5 w-5" />
              </div>
              <h4 className="font-display text-sm font-bold text-white">GitHub Dev</h4>
              <p className="font-body text-[11px] text-ink-faint mt-1">Repositories, commit telemetry, issue tracker</p>
            </div>
          </div>
        </div>
      </section>

      {/* Windows Desktop App Section */}
      <section id="desktop" className="relative z-10 border-t border-white/5 bg-[#070618] px-6 py-24">
        <div className="mx-auto max-w-5xl rounded-3xl border border-arc-500/30 bg-gradient-to-b from-void-deep to-[#0c0822] p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-arc-500/10 rounded-full blur-[90px] pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-arc-400/40 bg-arc-500/15 px-3.5 py-1 font-mono text-[10px] uppercase tracking-wider text-arc-300">
                <Monitor className="h-3 w-3" />
                ASCEND DESKTOP APPLICATION
              </div>

              <h2 className="font-display text-3xl font-extrabold text-white sm:text-4xl">
                Uncompromising Windows Native Performance
              </h2>

              <p className="font-body text-sm text-ink-muted leading-relaxed">
                Download the standalone Windows application to unlock hardware telemetry, zero-latency local speech and audio,
                system tray minimization, and seamless background synchronizations.
              </p>

              <div className="space-y-2 text-xs font-body text-ink-secondary">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <span>Electron runtime with full context isolation and sandboxed IPC</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <span>Hardware fingerprinting and secure device authorization</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <span>Automated background updates and release channel syncing</span>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <a
                  href="/api/v1/desktop/download"
                  className="btn-primary flex items-center gap-2.5 px-6 py-3 text-sm font-semibold shadow-glow-arc"
                >
                  <Download className="h-4 w-4" />
                  <span>Download ASCENDSetup.exe</span>
                </a>
                <span className="font-mono text-xs text-ink-faint">
                  Version 1.0.0 (x64) • Win 10/11
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-void/80 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="font-mono text-xs uppercase text-arc-400 font-bold">Release Notes (v1.0.0)</span>
                <span className="font-mono text-[10px] text-ink-faint">October 2026</span>
              </div>

              <ul className="space-y-2.5 font-body text-xs text-ink-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-arc-400 font-bold">›</span>
                  <span><strong>Owner Control Centre:</strong> Complete administrative metrics, user search, suspension, and device blocking.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-arc-400 font-bold">›</span>
                  <span><strong>Expandable App Hub:</strong> Live modules for Spotify, Google Calendar, Notion, and YouTube.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-arc-400 font-bold">›</span>
                  <span><strong>Triple-Auth Engine:</strong> Google OAuth, verified Email, and ASCEND native Username/Password.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-arc-400 font-bold">›</span>
                  <span><strong>Holographic JARVIS AI:</strong> System telemetry, voice reasoning, and safety confirmations.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-void px-6 py-10 text-center text-xs text-ink-faint">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-display font-bold text-white">
            <span className="h-2 w-2 rounded-full bg-arc-400 animate-pulse" />
            ASCEND PRODUCT ECOSYSTEM
          </div>

          <div className="flex items-center gap-6 font-mono text-[11px]">
            <button onClick={() => setShowDocsModal(true)} className="hover:text-arc-400 transition-colors">
              Documentation
            </button>
            <a href="mailto:support@ascend.io" className="hover:text-arc-400 transition-colors">
              Support
            </a>
            <span className="text-white/20">|</span>
            <span>Owner: <strong className="text-arc-300">guptattt3@gmail.com</strong></span>
          </div>

          <p className="font-mono text-[10px] text-ink-faint">
            © 2026 ASCEND Systems. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Documentation Modal */}
      {showDocsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-2xl border border-arc-500/40 bg-[#0B091E] p-6 shadow-2xl text-left max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-arc-400" />
                <h3 className="font-display text-lg font-bold text-white">ASCEND System Documentation</h3>
              </div>
              <button
                onClick={() => setShowDocsModal(false)}
                className="text-ink-muted hover:text-white text-lg font-bold px-2"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 font-body text-xs text-ink-secondary leading-relaxed">
              <div>
                <h4 className="font-display text-sm font-semibold text-white mb-1">1. Authentication & Accounts</h4>
                <p>
                  ASCEND supports 3 authentication methods: Google Sign-In, Email & Password, and ASCEND Username & Password.
                  All three methods synchronize across the Website and the Desktop Application automatically.
                </p>
              </div>

              <div>
                <h4 className="font-display text-sm font-semibold text-white mb-1">2. Owner Control Centre</h4>
                <p>
                  Owner administration is guarded on the backend. Only the verified owner address (<code className="text-arc-300">guptattt3@gmail.com</code>)
                  holds SUPER_ADMIN rights. The dashboard provides active web/desktop user telemetry, user suspension and bans, session revocation, and device blocking.
                </p>
              </div>

              <div>
                <h4 className="font-display text-sm font-semibold text-white mb-1">3. Modular Application Integrations</h4>
                <p>
                  The App Hub contains independent modules for Spotify, Google Calendar, Notion, and YouTube. Each module can be
                  toggled, configured, and controlled through ARC AI natural language commands.
                </p>
              </div>

              <div>
                <h4 className="font-display text-sm font-semibold text-white mb-1">4. Windows Desktop Application</h4>
                <p>
                  Built with Electron and native Windows integrations. Install via <code className="text-arc-300">ASCENDSetup.exe</code>.
                  Features background tray minimization, device hardware telemetry, and offline-first token caching.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDocsModal(false)}
                className="btn-primary px-5 py-2 text-xs"
              >
                Close Documentation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
