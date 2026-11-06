"use client";

import { useEffect, useState, useRef, type FormEvent } from "react";
import {
  Activity,
  AlertTriangle,
  Bot,
  Brain,
  Camera,
  CheckCircle2,
  ChevronRight,
  Cpu,
  FileCode,
  FileText,
  FolderOpen,
  HardDrive,
  Layers,
  LayoutGrid,
  Loader2,
  Maximize2,
  Mic,
  MicOff,
  Minimize2,
  Monitor,
  Play,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  Shield,
  Sparkles,
  Terminal,
  Trash2,
  Globe,
  Sliders,
  Upload,
  Volume2,
  VolumeX,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import { jarvisApi, type Routine, type Fact, type ActionEntry, type ProcessInfo } from "@/lib/api/jarvis";
import { useJarvisStore, type CommandCenterTab, type AIState } from "@/store/useJarvisStore";
import { useUserStore } from "@/store/useUserStore";
import { useQuestBoardStore } from "@/store/useQuestBoardStore";
import { ConfirmDialog } from "@/features/companion/ConfirmDialog";
import { cn } from "@/lib/utils";

/* ── Holographic Dais & Floating Quantum Arc Core ───────────────── */
function HolographicDaisCore({ state }: { state: AIState }) {
  return (
    <div className="relative w-full flex flex-col items-center justify-center my-auto py-2 select-none">
      {/* Upper Floating Arc Reactor Sphere with A Glyph */}
      <div className="relative flex items-center justify-center h-48 w-48 sm:h-56 sm:w-56 md:h-60 md:w-60">
        {/* Ambient Volumetric Plasma Glow */}
        <div
          className={cn(
            "absolute inset-0 rounded-full blur-[45px] transition-all duration-700 pointer-events-none",
            state === "listening" && "bg-cyan-400/45 scale-115",
            state === "thinking" && "bg-blue-600/40 scale-105 animate-pulse",
            state === "speaking" && "bg-[#00E5FF]/50 scale-125",
            state === "error" && "bg-rose-500/35",
            state === "idle" && "bg-[#0055FF]/35"
          )}
        />

        {/* 3D Gyroscopic Orbital Rings */}
        <div
          className="absolute h-40 w-40 sm:h-48 sm:w-48 rounded-full border border-dashed border-[#00E5FF]/60 animate-spin pointer-events-none"
          style={{ animationDuration: "14s" }}
        />
        <div
          className="absolute h-36 w-36 sm:h-44 sm:w-44 rounded-full border border-dotted border-[#00B4D8]/70 animate-spin pointer-events-none"
          style={{ animationDuration: "9s", animationDirection: "reverse" }}
        />
        <div
          className="absolute h-48 w-48 sm:h-56 sm:w-56 rounded-full border border-[#0052FF]/30 animate-pulse pointer-events-none"
        />

        {/* Central Quantum Orb with ASCEND "A" Glyph */}
        <div
          className={cn(
            "relative h-24 w-24 sm:h-28 sm:w-28 rounded-full flex flex-col items-center justify-center border-2 transition-all duration-300",
            "bg-gradient-to-br from-[#00E5FF]/30 via-[#0A1A3D] to-[#040817]",
            "border-[#00E5FF] shadow-[0_0_35px_rgba(0,229,255,0.7),inset_0_0_20px_rgba(0,229,255,0.4)]"
          )}
        >
          <span className="font-display font-black text-3xl sm:text-4xl text-[#00E5FF] drop-shadow-[0_0_15px_#00E5FF] tracking-tighter">
            A
          </span>
          {state === "thinking" && (
            <Sparkles className="absolute -top-1 right-2 h-4 w-4 text-[#00E5FF] animate-spin" />
          )}
        </div>
      </div>

      {/* Floor Optical Projection Dais (Concentric Ellipses in Perspective) */}
      <div className="relative w-64 sm:w-76 h-12 -mt-6 flex items-center justify-center pointer-events-none">
        {/* Outer dais ellipse */}
        <div className="absolute w-full h-11 rounded-[50%] border border-[#00E5FF]/40 shadow-[0_0_20px_rgba(0,229,255,0.35)] bg-gradient-to-t from-[#00E5FF]/10 to-transparent" />
        {/* Mid dais ring */}
        <div className="absolute w-44 sm:w-56 h-7 rounded-[50%] border border-dashed border-[#00E5FF]/70 shadow-[0_0_15px_#00E5FF]" />
        {/* Inner core emitter */}
        <div className="absolute w-24 sm:w-32 h-4 rounded-[50%] bg-[#00E5FF]/40 border border-[#00E5FF] blur-[1px]" />
      </div>

      {/* Sub-identity Typography */}
      <div className="text-center mt-2 z-10">
        <h2 className="font-display text-2xl sm:text-3xl font-black tracking-[0.28em] text-white drop-shadow-[0_0_15px_rgba(0,229,255,0.7)]">
          JARVIS
        </h2>
        <div className="font-mono text-[10px] sm:text-xs font-bold tracking-[0.35em] text-[#00E5FF] uppercase opacity-90 mt-0.5">
          AI ASSISTANT
        </div>
      </div>
    </div>
  );
}

/* ── Dual Telemetry Sweep Gauge (CPU / RAM) ─────────────────────── */
function DualTelemetryArcGauge({ cpu = 32, ram = 82 }: { cpu?: number; ram?: number }) {
  const cpuVal = Math.round(cpu);
  const ramVal = Math.round(ram);
  return (
    <div className="flex items-center gap-2.5 bg-[#070B1A]/90 border border-[#00B4D8]/30 rounded-xl px-3 py-2 shadow-[0_0_15px_rgba(0,180,216,0.15)] flex-shrink-0">
      <div className="relative h-10 w-10 sm:h-11 sm:w-11 flex items-center justify-center">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="14" fill="none" stroke="#062238" strokeWidth="2.5" />
          <circle
            cx="18"
            cy="18"
            r="14"
            fill="none"
            stroke="#00E5FF"
            strokeWidth="2.5"
            strokeDasharray="88"
            strokeDashoffset={88 - (88 * Math.min(cpuVal, 100)) / 100}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>
        <span className="absolute font-mono text-[8px] sm:text-[9px] font-bold text-white">{cpuVal}%</span>
      </div>
      <div className="flex flex-col gap-0.5 font-mono text-[9px]">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#00E5FF]" />
          <span className="text-white/70">CPU</span>
          <span className="font-bold text-[#00E5FF]">{cpuVal}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />
          <span className="text-white/70">RAM</span>
          <span className="font-bold text-purple-300">{ramVal}%</span>
        </div>
      </div>
    </div>
  );
}

/* ── Audio Waveform Equalizer ─────────────────────────────────── */
function AudioWaveformEqualizer({ active }: { active: boolean }) {
  const heights = [6, 12, 18, 24, 14, 20, 26, 18, 22, 16, 10, 6];
  return (
    <div className="flex items-center gap-1 h-6 px-1 flex-shrink-0">
      {heights.map((h, i) => (
        <span
          key={i}
          className={cn(
            "w-0.5 sm:w-1 rounded-full transition-all duration-300",
            active
              ? "bg-[#00E5FF] shadow-[0_0_8px_#00E5FF] animate-pulse"
              : "bg-[#00B4D8]/40"
          )}
          style={{
            height: active ? `${Math.max(4, h)}px` : `${Math.max(3, h * 0.35)}px`,
            animationDelay: `${i * 65}ms`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Holographic Arc Reactor Core Component (Fallback/Legacy) ──── */
function ArcReactorVisual({ state, audioLevel = 0 }: { state: AIState; audioLevel?: number }) {
  const scale = 1 + Math.min(0.4, audioLevel * 0.5);

  return (
    <div className="relative flex items-center justify-center h-36 w-36 select-none my-2">
      {/* Ambient Pulsing Glow */}
      <div
        className={cn(
          "absolute inset-0 rounded-full blur-[35px] transition-all duration-500",
          state === "listening" && "bg-cyan-400/35 scale-110",
          state === "thinking" && "bg-purple-500/35 scale-105 animate-pulse",
          state === "speaking" && "bg-[#00E5FF]/45 scale-120",
          state === "error" && "bg-red-500/35",
          state === "idle" && "bg-[#2614DF]/25"
        )}
      />

      {/* Outer Rotating Cyber-Rings */}
      <div
        className="absolute h-32 w-32 rounded-full border border-dashed border-[#01C0D7]/40 animate-spin"
        style={{ animationDuration: state === "speaking" ? "4s" : "12s" }}
      />
      <div
        className="absolute h-28 w-28 rounded-full border border-dotted border-[#4D30EC]/60 animate-spin"
        style={{ animationDuration: state === "thinking" ? "3s" : "18s", animationDirection: "reverse" }}
      />

      {/* Center Core Orb */}
      <div
        className={cn(
          "relative h-18 w-18 rounded-full flex items-center justify-center transition-all duration-200 border-2 shadow-[0_0_20px_rgba(0,229,255,0.4)]",
          state === "listening" && "bg-cyan-500/30 border-[#00E5FF] shadow-[0_0_25px_#00E5FF]",
          state === "thinking" && "bg-purple-600/30 border-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.6)]",
          state === "speaking" && "bg-[#2614DF]/40 border-[#01C0D7] shadow-[0_0_30px_#00E5FF]",
          state === "idle" && "bg-[#0C081D] border-[#2614DF]/60 shadow-[0_0_15px_rgba(38,20,223,0.4)]"
        )}
        style={{ transform: `scale(${scale})` }}
      >
        <Sparkles
          className={cn(
            "h-7 w-7 transition-all duration-300",
            state === "listening" ? "text-[#00E5FF] animate-pulse" : "text-[#C0BEEF]"
          )}
        />
      </div>

      {/* Equalizer frequency spikes around core when speaking */}
      {state === "speaking" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="h-32 w-32 rounded-full border border-[#00E5FF]/30 animate-ping" />
        </div>
      )}
    </div>
  );
}

/* ── Main Command Center Modal / Workspace ─────────────────────── */
export function JarvisCommandCenter({ onClose }: { onClose?: () => void }) {
  const {
    activeTab,
    setActiveTab,
    aiState,
    messages,
    addMessage,
    telemetry,
    fetchTelemetry,
    processes,
    fetchProcesses,
    routines,
    fetchRoutines,
    facts,
    fetchMemory,
    permissions,
    fetchPermissions,
    activityLog,
    fetchActivityLog,
    pendingConfirmation,
    setPendingConfirmation,
    isListening,
    isBackendOnline,
    checkBackendHealth,
    voiceEnabled,
    toggleVoice,
  } = useJarvisStore();

  const user = useUserStore((s) => s.user);
  const [inputText, setInputText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableApps, setAvailableApps] = useState<string[]>([]);
  const [appSearch, setAppSearch] = useState("");
  const [visionAngle, setVisionAngle] = useState<"screen" | "camera">("screen");
  const [visionPrompt, setVisionPrompt] = useState("Analyze what is currently visible.");
  const [visionResult, setVisionResult] = useState<string | null>(null);
  const [visionThumb, setVisionThumb] = useState<string | null>(null);
  const [isScanningVision, setIsScanningVision] = useState(false);

  // File processing state
  const [fileList, setFileList] = useState<any[]>([]);
  const [fileSearchQuery, setFileSearchQuery] = useState("");
  const [fileSearchResults, setFileSearchResults] = useState<any[]>([]);
  const [processedResult, setProcessedResult] = useState<any | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  // Dev Agent state
  const [devGoal, setDevGoal] = useState("");
  const [devResult, setDevResult] = useState<any | null>(null);
  const [isDevBuilding, setIsDevBuilding] = useState(false);

  // API Key Configuration State
  const [apiKeysStatus, setApiKeysStatus] = useState<any | null>(null);
  const [geminiKeyInput, setGeminiKeyInput] = useState("");
  const [openrouterKeyInput, setOpenrouterKeyInput] = useState("");
  const [apiKeySaveStatus, setApiKeySaveStatus] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Periodic hardware telemetry refresh
  useEffect(() => {
    fetchTelemetry();
    fetchPermissions();
    fetchMemory();
    fetchRoutines();
    fetchActivityLog();
    jarvisApi.getAvailableApps().then((res) => setAvailableApps(res.apps));
    jarvisApi.getApiKeysStatus().then((res) => setApiKeysStatus(res));

    const interval = setInterval(() => {
      if (activeTab === "system") {
        fetchTelemetry();
        fetchProcesses();
      }
    }, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Handle Command Submission
  async function handleSubmitCommand(e: FormEvent) {
    e.preventDefault();
    if (!inputText.trim() || isSubmitting) return;

    const cmd = inputText.trim();
    setInputText("");
    addMessage({ role: "user", text: cmd });
    setIsSubmitting(true);

    try {
      const res = await jarvisApi.sendCommand(cmd);
      addMessage({
        role: "jarvis",
        text: res.reply,
        action: res.action,
        audio_base64: res.audio_base64,
      });

      if (res.confirmation_required && res.confirmation) {
        setPendingConfirmation(res.confirmation);
      }
    } catch (err: any) {
      addMessage({ role: "jarvis", text: `Error processing command: ${err.message}` });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle Confirmation Answer
  async function handleConfirmAction(answer: "yes" | "no") {
    if (!pendingConfirmation) return;
    const conf = pendingConfirmation;
    setPendingConfirmation(null);

    addMessage({ role: "user", text: answer === "yes" ? "Confirmed (Yes)" : "Cancelled (No)" });
    setIsSubmitting(true);

    try {
      const res = await jarvisApi.sendCommand(
        answer === "yes" ? `Confirm ${conf.action_name} ${conf.target || ""}` : "Cancel",
        answer
      );
      addMessage({ role: "jarvis", text: res.reply, action: res.action });
    } catch (err: any) {
      addMessage({ role: "jarvis", text: `Action error: ${err.message}` });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Vision Scan Trigger
  async function handleVisionScan() {
    setIsScanningVision(true);
    setVisionResult(null);
    setVisionThumb(null);
    try {
      const res = await jarvisApi.scanVision(visionAngle, visionPrompt);
      if (res.status === "success") {
        setVisionResult(res.analysis);
        if (res.thumbnail_b64) setVisionThumb(res.thumbnail_b64);
        addMessage({
          role: "jarvis",
          text: `[Vision Analysis (${visionAngle})]:\n${res.analysis}`,
        });
      } else {
        setVisionResult("Vision scan failed.");
      }
    } catch (err: any) {
      setVisionResult(`Error: ${err.message}`);
    } finally {
      setIsScanningVision(false);
    }
  }

  // Dev Build Trigger
  async function handleDevBuild() {
    if (!devGoal.trim() || isDevBuilding) return;
    setIsDevBuilding(true);
    setDevResult(null);
    try {
      const res = await jarvisApi.buildCode(devGoal.trim(), "python");
      setDevResult(res);
      addMessage({
        role: "jarvis",
        text: `[Autonomous Dev Agent]:\n${res.message || "Code built."}\n\n\`\`\`python\n${res.code || ""}\n\`\`\``,
      });
    } catch (err: any) {
      setDevResult({ status: "error", message: err.message });
    } finally {
      setIsDevBuilding(false);
    }
  }

  const navItems: { id: CommandCenterTab; label: string; icon: any }[] = [
    { id: "home", label: "Overview", icon: Bot },
    { id: "conversations", label: "Dialogue", icon: Terminal },
    { id: "desktop", label: "Desktop Control", icon: Monitor },
    { id: "system", label: "System Monitor", icon: Cpu },
    { id: "automations", label: "Automations", icon: Zap },
    { id: "memory", label: "Memory Core", icon: Brain },
    { id: "files", label: "File Processor", icon: FolderOpen },
    { id: "activity", label: "Activity Log", icon: Activity },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="relative flex h-full w-full flex-col bg-[#080512] text-white overflow-hidden select-none font-body">
      {/* Confirmation Dialog Modal */}
      {pendingConfirmation && (
        <ConfirmDialog
          prompt={`Confirm system action: ${pendingConfirmation.action_name} ${pendingConfirmation.target || ""}?`}
          onConfirm={handleConfirmAction}
        />
      )}

      {/* Top Header Bar */}
      <header className="flex h-12 flex-shrink-0 items-center justify-between border-b border-[#2614DF]/30 bg-[#0C081D]/90 px-4 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 border border-[#01C0D7]/40 text-[#00E5FF] shadow-[0_0_10px_rgba(1,192,215,0.4)]">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h1 className="font-display text-xs 2xl:text-sm font-extrabold uppercase tracking-widest text-white flex items-center gap-2">
              JARVIS <span className="text-[#00E5FF]">COMMAND CENTER</span>
              <button
                type="button"
                onClick={() => {
                  checkBackendHealth();
                  fetchTelemetry();
                }}
                className={cn(
                  "rounded px-1.5 py-0.2 text-[8px] font-mono font-bold border transition-colors cursor-pointer flex items-center gap-1",
                  isBackendOnline
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                    : "bg-rose-500/20 border-rose-500/40 text-rose-400"
                )}
                title={isBackendOnline ? "Connected (Click to verify)" : "Offline (Click to reconnect)"}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    isBackendOnline ? "bg-emerald-400 animate-pulse" : "bg-rose-500"
                  )}
                />
                {isBackendOnline ? "CORE ONLINE" : "CORE OFFLINE"}
              </button>
            </h1>
          </div>
        </div>

        {/* Global Navigation Pill */}
        <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer border",
                  active
                    ? "bg-[#2614DF]/40 border-[#01C0D7]/60 text-[#00E5FF] shadow-[0_0_12px_rgba(1,192,215,0.3)] font-semibold"
                    : "border-transparent text-[#C0BEEF]/70 hover:bg-[#2614DF]/20 hover:text-white"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleVoice}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg border transition-all cursor-pointer",
              voiceEnabled
                ? "bg-cyan-500/20 border-[#01C0D7]/50 text-[#00E5FF]"
                : "bg-void border-void text-ink-faint"
            )}
            title={voiceEnabled ? "Voice Output Active" : "Voice Muted"}
          >
            {voiceEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#2614DF]/30 bg-[#0C081D] text-[#C0BEEF] hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-400 transition-all cursor-pointer"
              title="Close Command Center"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ── TAB 1: HOME / OVERVIEW (FUTURISTIC COMMAND COCKPIT) ──── */}
        {activeTab === "home" && (
          <div className="flex-1 flex flex-col p-3 sm:p-4 gap-3 overflow-y-auto min-h-0 bg-[#040612]/90 select-none">
            {/* Cockpit Sub-Header */}
            <div className="flex items-center justify-between border-b border-[#00B4D8]/20 pb-2 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#00E5FF]/20 border border-[#00E5FF]/40 text-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.4)]">
                  <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                </div>
                <div>
                  <h2 className="font-display text-sm sm:text-base font-extrabold tracking-[0.2em] text-white flex items-center gap-2">
                    JARVIS <span className="text-[#00E5FF]">COMMAND CENTER</span>
                  </h2>
                  <p className="font-mono text-[9px] tracking-[0.25em] text-[#00B4D8]/70 uppercase">
                    UNDERSTAND • REASON • ACT
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-emerald-400 font-mono text-[9px] font-bold shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10B981]" />
                  <span>SYSTEM ONLINE</span>
                </div>
              </div>
            </div>

            {/* Main 3-Column Cockpit Workspace */}
            <div className="grid grid-cols-12 gap-3 flex-1 min-h-[360px] items-stretch">
              {/* Left Column: QUICK COMMANDS */}
              <div className="col-span-12 lg:col-span-3 flex flex-col rounded-xl border border-[#00B4D8]/30 bg-[#070B1D]/80 backdrop-blur-md p-3 shadow-[0_0_20px_rgba(0,180,216,0.1),inset_0_0_15px_rgba(0,180,216,0.05)]">
                <div className="flex items-center justify-between border-b border-[#00B4D8]/20 pb-2 mb-2">
                  <span className="font-mono text-[10px] font-bold tracking-[0.15em] text-[#00E5FF] uppercase">
                    Quick Commands
                  </span>
                  <span className="font-mono text-[8px] text-[#00B4D8]/60">[ 09 ]</span>
                </div>

                <div className="flex flex-col gap-1.5 overflow-y-auto pr-0.5">
                  {[
                    { label: "Open Applications", icon: LayoutGrid, action: () => setActiveTab("desktop") },
                    { label: "Control System", icon: Sliders, action: () => setActiveTab("system") },
                    { label: "Manage Files", icon: FolderOpen, action: () => setActiveTab("files") },
                    { label: "Browse Internet", icon: Globe, action: () => { jarvisApi.launchApp("chrome"); addMessage({ role: "jarvis", text: "Launching Google Chrome browser session." }); } },
                    { label: "Voice & Audio", icon: Mic, action: toggleVoice },
                    { label: "Display & Windows", icon: Maximize2, action: () => setActiveTab("desktop") },
                    { label: "Automation", icon: Zap, action: () => setActiveTab("automations") },
                    { label: "My Routines", icon: Layers, action: () => setActiveTab("automations") },
                    { label: "Settings", icon: Settings, action: () => setActiveTab("settings") },
                  ].map((btn, idx) => {
                    const Icon = btn.icon;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={btn.action}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-[#00B4D8]/20 bg-[#0A1029]/60 hover:bg-[#00E5FF]/15 hover:border-[#00E5FF]/60 hover:shadow-[0_0_15px_rgba(0,229,255,0.25)] text-white/90 hover:text-white transition-all duration-200 cursor-pointer text-left group"
                      >
                        <div className="flex h-6 w-6 items-center justify-center rounded bg-[#00E5FF]/10 text-[#00E5FF] group-hover:scale-110 group-hover:text-white transition-all">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="font-display text-[11px] font-semibold tracking-wide">
                          {btn.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Center Stage: HOLOGRAPHIC QUANTUM CORE & DAIS */}
              <div className="col-span-12 lg:col-span-6 flex flex-col items-center justify-center relative rounded-xl border border-[#00B4D8]/20 bg-radial from-[#00E5FF]/5 via-[#070B1D]/40 to-[#040612]/90 p-4 overflow-hidden shadow-[0_0_30px_rgba(0,80,255,0.15)]">
                {/* Background Cybernetic Perspective Grid Lines */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#00e5ff08_1px,transparent_1px),linear-gradient(to_bottom,#00e5ff08_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-40" />

                <HolographicDaisCore state={aiState} />
              </div>

              {/* Right Column: CURRENT STATUS & RECENT ACTIVITY */}
              <div className="col-span-12 lg:col-span-3 flex flex-col gap-3">
                {/* Card 1: CURRENT STATUS */}
                <div className="flex flex-col rounded-xl border border-[#00B4D8]/30 bg-[#070B1D]/80 backdrop-blur-md p-3 shadow-[0_0_20px_rgba(0,180,216,0.1)]">
                  <div className="flex items-center justify-between border-b border-[#00B4D8]/20 pb-2 mb-2.5">
                    <span className="font-mono text-[10px] font-bold tracking-[0.15em] text-[#00E5FF] uppercase">
                      Current Status
                    </span>
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10B981]" />
                  </div>

                  <div className="flex flex-col gap-2 font-mono text-[10px]">
                    {[
                      { title: "Listening", sub: "Wake word: Hey JARVIS", icon: Mic, active: isListening },
                      { title: "AI Model", sub: "Local Neural Core", icon: Bot, active: true },
                      { title: "Memory", sub: "SQLite Connected", icon: Brain, active: true },
                      { title: "PC Control", sub: "OS Ready", icon: Monitor, active: true },
                      { title: "Chrome Integration", sub: "Connected", icon: Globe, active: true },
                    ].map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <div key={idx} className="flex items-center justify-between py-1 border-b border-white/5 last:border-none">
                          <div className="flex items-center gap-2">
                            <Icon className="h-3.5 w-3.5 text-[#00E5FF]/70" />
                            <div>
                              <div className="font-semibold text-white/90">{item.title}</div>
                              <div className="text-[8px] text-[#00B4D8]/60">{item.sub}</div>
                            </div>
                          </div>
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10B981]" />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Card 2: RECENT ACTIVITY */}
                <div className="flex-1 flex flex-col rounded-xl border border-[#00B4D8]/30 bg-[#070B1D]/80 backdrop-blur-md p-3 shadow-[0_0_20px_rgba(0,180,216,0.1)] min-h-[140px]">
                  <div className="flex items-center justify-between border-b border-[#00B4D8]/20 pb-2 mb-2">
                    <span className="font-mono text-[10px] font-bold tracking-[0.15em] text-[#00E5FF] uppercase">
                      Recent Activity
                    </span>
                    <Activity className="h-3.5 w-3.5 text-[#00E5FF]/70" />
                  </div>

                  <div className="flex flex-col gap-2 font-mono text-[9px] overflow-y-auto">
                    {[
                      { action: "Opened Chrome", time: "2m ago" },
                      { action: "Accessed project folder", time: "5m ago" },
                      { action: "System check complete", time: "12m ago" },
                      { action: "Listening for command...", time: "Now" },
                    ].map((log, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1 border-b border-white/5 last:border-none">
                        <div className="flex items-center gap-2 text-white/80 truncate">
                          <span className="h-1 w-1 rounded-full bg-[#00E5FF]" />
                          <span className="truncate">{log.action}</span>
                        </div>
                        <span className="text-[8px] text-[#00B4D8]/60 flex-shrink-0">{log.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Deck: Voice, Equalizer & Dual Telemetry Gauge */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-1 flex-shrink-0">
              {/* Left: Dual Telemetry Sweep Gauge */}
              <DualTelemetryArcGauge
                cpu={telemetry?.cpu_percent ?? 32}
                ram={telemetry?.ram_percent ?? 82}
              />

              {/* Center: Interactive Voice & Command Input Dock */}
              <form
                onSubmit={handleSubmitCommand}
                className="flex-1 w-full flex items-center justify-between bg-[#070B1D]/90 border border-[#00B4D8]/40 rounded-xl px-3 py-2 shadow-[0_0_20px_rgba(0,180,216,0.15),inset_0_0_15px_rgba(0,180,216,0.08)] group focus-within:border-[#00E5FF]"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0 mr-2">
                  <button
                    type="button"
                    onClick={toggleVoice}
                    className={cn(
                      "flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border transition-all duration-300 cursor-pointer flex-shrink-0",
                      isListening
                        ? "bg-[#00E5FF] border-white text-black shadow-[0_0_20px_#00E5FF] animate-pulse"
                        : "bg-[#00E5FF]/20 border-[#00E5FF]/50 text-[#00E5FF] hover:bg-[#00E5FF]/30"
                    )}
                    title={isListening ? "Listening... Click to stop" : "Click to speak to JARVIS"}
                  >
                    <Mic className="h-4 w-4" />
                  </button>

                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="How can I help you today? Say 'Hey JARVIS' to get started..."
                      className="bg-transparent text-xs sm:text-sm text-white placeholder:text-[#00B4D8]/60 focus:outline-none w-full font-body"
                    />
                    <span className="font-mono text-[8px] text-[#00B4D8]/50 hidden sm:inline">
                      Press Enter to execute system command
                    </span>
                  </div>
                </div>

                <AudioWaveformEqualizer active={isListening || aiState === "speaking"} />
              </form>

              {/* Right: Iris Status Dial */}
              <div className="hidden md:flex items-center gap-2.5 bg-[#070B1D]/90 border border-[#00B4D8]/30 rounded-xl px-3 py-2 shadow-[0_0_15px_rgba(0,180,216,0.15)] flex-shrink-0">
                <div className="relative h-8 w-8 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-dashed border-[#00E5FF]/50 animate-spin" style={{ animationDuration: "12s" }} />
                  <span className="font-display font-black text-xs text-[#00E5FF]">A</span>
                </div>
                <div className="font-mono text-[8px] text-[#00B4D8]/80 leading-tight">
                  <div>Your wish is</div>
                  <div className="font-bold text-white">my command. A</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: DIALOGUE & CONVERSATIONS ────────────────────── */}
        {activeTab === "conversations" && (
          <div className="flex-1 flex flex-col min-h-0 bg-[#080512]">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m) => {
                const isUser = m.role === "user";
                return (
                  <div key={m.id} className={cn("flex flex-col animate-fade-in", isUser ? "items-end" : "items-start")}>
                    <div className="mb-0.5 flex items-center gap-1.5">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-[#00E5FF] font-bold">
                        {isUser ? "Hunter" : "JARVIS"}
                      </span>
                      <span className="font-mono text-[8px] text-[#C0BEEF]/60">{m.timestamp}</span>
                    </div>

                    <div
                      className={cn(
                        "rounded-xl px-3.5 py-2.5 max-w-[85%] text-xs leading-relaxed font-body shadow-lg",
                        isUser
                          ? "bg-[#2614DF]/40 border border-[#01C0D7]/40 text-white ml-auto"
                          : "bg-[#0C081D]/90 border border-[#4D30EC]/50 text-white"
                      )}
                    >
                      <div className="whitespace-pre-line">{m.text}</div>

                      {/* Tool Result Badges */}
                      {m.action && (
                        <div className="mt-2 pt-2 border-t border-[#2614DF]/30 font-mono text-[9px]">
                          <span className="text-[#00E5FF] font-bold uppercase">
                            [Action: {m.action.action_name || m.action.type}]
                          </span>
                          {m.action.message && <p className="text-ink-faint mt-0.5">{m.action.message}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Input Composer */}
            <div className="p-3 border-t border-[#2614DF]/30 bg-[#0C081D]/95">
              <form onSubmit={handleSubmitCommand} className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Enter JARVIS instruction, query ASCEND quests, or request desktop control..."
                  className="flex-1 rounded-lg border border-[#2614DF]/40 bg-black/60 px-3 py-2 text-xs text-white placeholder-[#C0BEEF]/40 focus:border-[#01C0D7] focus:outline-none"
                  disabled={isSubmitting}
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !inputText.trim()}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2614DF] border border-[#01C0D7]/50 text-white hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── TAB 3: DESKTOP CONTROL ─────────────────────────────── */}
        {activeTab === "desktop" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* App Launcher Section */}
            <div className="rounded-xl border border-[#2614DF]/40 bg-[#0C081D]/80 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-[#00E5FF]" />
                  <h2 className="font-display text-xs font-bold text-white uppercase tracking-wide">
                    Installed Application Launcher
                  </h2>
                </div>
                <div className="relative w-48">
                  <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-[#C0BEEF]/50" />
                  <input
                    type="text"
                    value={appSearch}
                    onChange={(e) => setAppSearch(e.target.value)}
                    placeholder="Search apps..."
                    className="w-full rounded-md border border-[#2614DF]/40 bg-black/60 pl-7 pr-2 py-1 text-[11px] text-white focus:outline-none focus:border-[#01C0D7]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto scrollbar-thin p-1">
                {availableApps
                  .filter((a) => a.toLowerCase().includes(appSearch.toLowerCase()))
                  .slice(0, 24)
                  .map((app) => (
                    <button
                      key={app}
                      type="button"
                      onClick={async () => {
                        const res = await jarvisApi.launchApp(app);
                        addMessage({ role: "jarvis", text: res.message });
                      }}
                      className="flex items-center justify-between rounded-lg border border-[#2614DF]/30 bg-black/40 px-2.5 py-1.5 text-[11px] text-[#E8EEFF] hover:border-[#01C0D7]/60 hover:bg-[#2614DF]/30 transition-all text-left cursor-pointer truncate"
                    >
                      <span className="truncate">{app}</span>
                      <Play className="h-3 w-3 text-[#00E5FF] flex-shrink-0" />
                    </button>
                  ))}
              </div>
            </div>

            {/* Vision Scanner Section */}
            <div className="rounded-xl border border-[#2614DF]/40 bg-[#0C081D]/80 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Camera className="h-4 w-4 text-purple-400" />
                <h2 className="font-display text-xs font-bold text-white uppercase tracking-wide">
                  Screen & Camera Vision Scanner
                </h2>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setVisionAngle("screen")}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-bold border transition-all cursor-pointer",
                      visionAngle === "screen"
                        ? "bg-[#2614DF] border-[#01C0D7] text-white"
                        : "border-[#2614DF]/30 bg-black/40 text-ink-faint"
                    )}
                  >
                    Desktop Screen
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisionAngle("camera")}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-bold border transition-all cursor-pointer",
                      visionAngle === "camera"
                        ? "bg-[#2614DF] border-[#01C0D7] text-white"
                        : "border-[#2614DF]/30 bg-black/40 text-ink-faint"
                    )}
                  >
                    Webcam
                  </button>
                </div>

                <input
                  type="text"
                  value={visionPrompt}
                  onChange={(e) => setVisionPrompt(e.target.value)}
                  placeholder="Vision prompt / question..."
                  className="flex-1 rounded-lg border border-[#2614DF]/40 bg-black/60 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#01C0D7]"
                />

                <button
                  type="button"
                  onClick={handleVisionScan}
                  disabled={isScanningVision}
                  className="flex items-center gap-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 px-4 py-1.5 text-xs font-bold text-white transition-all cursor-pointer disabled:opacity-50"
                >
                  {isScanningVision ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                  <span>Scan Now</span>
                </button>
              </div>

              {visionResult && (
                <div className="mt-3 rounded-lg border border-purple-500/40 bg-black/50 p-3 text-xs leading-relaxed text-[#E8EEFF] flex gap-3 items-start">
                  {visionThumb && (
                    <img
                      src={`data:image/jpeg;base64,${visionThumb}`}
                      alt="Scan Preview"
                      className="w-28 rounded border border-purple-500/40 flex-shrink-0"
                    />
                  )}
                  <div className="whitespace-pre-line flex-1">{visionResult}</div>
                </div>
              )}
            </div>

            {/* Autonomous Dev Agent Section */}
            <div className="rounded-xl border border-[#2614DF]/40 bg-[#0C081D]/80 p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileCode className="h-4 w-4 text-emerald-400" />
                <h2 className="font-display text-xs font-bold text-white uppercase tracking-wide">
                  Autonomous Dev Agent (Code Helper & Project Builder)
                </h2>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={devGoal}
                  onChange={(e) => setDevGoal(e.target.value)}
                  placeholder="Describe code to build, test, and auto-fix with error loop..."
                  className="flex-1 rounded-lg border border-[#2614DF]/40 bg-black/60 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#01C0D7]"
                />
                <button
                  type="button"
                  onClick={handleDevBuild}
                  disabled={isDevBuilding || !devGoal.trim()}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-1.5 text-xs font-bold text-white transition-all cursor-pointer disabled:opacity-50"
                >
                  {isDevBuilding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileCode className="h-3.5 w-3.5" />}
                  <span>Build & Run</span>
                </button>
              </div>

              {devResult && (
                <div className="mt-3 rounded-lg border border-emerald-500/40 bg-black/60 p-3 text-xs">
                  <div className="font-mono text-emerald-400 font-bold mb-1">{devResult.message}</div>
                  {devResult.code && (
                    <pre className="mt-1 p-2 rounded bg-black/80 font-mono text-[10px] text-white overflow-x-auto">
                      {devResult.code}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 4: SYSTEM MONITOR ──────────────────────────────── */}
        {activeTab === "system" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Cpu className="h-4 w-4 text-[#00E5FF]" /> Live Hardware Telemetry
              </h2>
              <button
                type="button"
                onClick={() => {
                  fetchTelemetry();
                  fetchProcesses();
                }}
                className="flex items-center gap-1 text-xs font-mono text-[#00E5FF] hover:underline cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" /> Refresh
              </button>
            </div>

            {telemetry && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* CPU Gauge */}
                <div className="rounded-xl border border-[#2614DF]/40 bg-[#0C081D]/80 p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-mono text-xs font-bold text-[#00E5FF]">CPU Load</span>
                    <span className="font-mono text-xs text-white">{telemetry.cpu_percent}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-black/60 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-[#00E5FF] transition-all duration-500"
                      style={{ width: `${Math.min(100, telemetry.cpu_percent)}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between font-mono text-[10px] text-[#C0BEEF]/70">
                    <span>Temp: {telemetry.cpu_temp_c ? `${telemetry.cpu_temp_c}°C` : "N/A"}</span>
                    <span>Uptime: {Math.floor((telemetry.uptime_seconds || 0) / 3600)}h {Math.floor(((telemetry.uptime_seconds || 0) % 3600) / 60)}m</span>
                  </div>
                </div>

                {/* RAM Gauge */}
                <div className="rounded-xl border border-[#2614DF]/40 bg-[#0C081D]/80 p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-mono text-xs font-bold text-purple-400">RAM Memory</span>
                    <span className="font-mono text-xs text-white">{telemetry.ram_percent}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-black/60 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-500"
                      style={{ width: `${Math.min(100, telemetry.ram_percent)}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between font-mono text-[10px] text-[#C0BEEF]/70">
                    <span>Used: {telemetry.ram_used_gb} GB</span>
                    <span>Total: {telemetry.ram_total_gb} GB</span>
                  </div>
                </div>

                {/* Storage Gauge */}
                <div className="rounded-xl border border-[#2614DF]/40 bg-[#0C081D]/80 p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-mono text-xs font-bold text-emerald-400">Storage Usage</span>
                    <span className="font-mono text-xs text-white">{telemetry.storage_percent}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-black/60 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
                      style={{ width: `${Math.min(100, telemetry.storage_percent)}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between font-mono text-[10px] text-[#C0BEEF]/70">
                    <span>Used: {telemetry.storage_used_gb} GB</span>
                    <span>Total: {telemetry.storage_total_gb} GB</span>
                  </div>
                </div>
              </div>
            )}

            {/* Top Processes Table */}
            <div className="rounded-xl border border-[#2614DF]/40 bg-[#0C081D]/80 p-4">
              <h3 className="font-mono text-xs font-bold text-white uppercase tracking-wider mb-2">
                Top Active Processes
              </h3>
              <div className="max-h-60 overflow-y-auto scrollbar-thin">
                <table className="w-full text-left text-[11px] font-mono">
                  <thead>
                    <tr className="border-b border-[#2614DF]/30 text-[#00E5FF]">
                      <th className="py-1">PID</th>
                      <th className="py-1">Process Name</th>
                      <th className="py-1">CPU %</th>
                      <th className="py-1">RAM %</th>
                      <th className="py-1">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processes.map((p) => (
                      <tr key={p.pid} className="border-b border-[#2614DF]/10 hover:bg-[#2614DF]/20">
                        <td className="py-1 text-[#C0BEEF]/60">{p.pid}</td>
                        <td className="py-1 text-white font-semibold">{p.name}</td>
                        <td className="py-1 text-cyan-400">{p.cpu_percent}%</td>
                        <td className="py-1 text-purple-300">{p.memory_percent}%</td>
                        <td className="py-1 text-emerald-400">{p.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 5: AUTOMATIONS ─────────────────────────────────── */}
        {activeTab === "automations" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-sm font-bold text-white uppercase tracking-wide">
                  Automation Routines & Quest Synchronization
                </h2>
                <p className="text-xs text-[#C0BEEF]/70">
                  Routines automatically launch applications, adjust system settings, and contribute progress to ASCEND quests.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {routines.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-[#2614DF]/40 bg-[#0C081D]/80 p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-display text-sm font-bold text-white">{r.name}</span>
                      {r.linked_quest && (
                        <span className="rounded bg-cyan-500/20 border border-[#01C0D7]/40 px-2 py-0.5 font-mono text-[9px] text-[#00E5FF] font-bold">
                          Linked: {r.linked_quest}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#C0BEEF]/70 mb-3">{r.description || "No description provided."}</p>

                    <div className="space-y-1 mb-3">
                      {r.steps.map((s, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 font-mono text-[10px] text-[#E8EEFF]/80">
                          <span className="text-[#00E5FF]">#{idx + 1}</span>
                          <span className="capitalize text-white">{s.type.replace(/_/g, " ")}:</span>
                          <span className="text-purple-300">{s.target || "N/A"}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      setPendingConfirmation({
                        type: "AUTOMATION",
                        action_name: "RUN_ROUTINE",
                        target: r.id,
                      });
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#2614DF] to-[#4D30EC] hover:brightness-110 px-3 py-2 text-xs font-bold text-white transition-all cursor-pointer shadow-[0_0_12px_rgba(38,20,223,0.3)]"
                  >
                    <Play className="h-3.5 w-3.5 text-[#00E5FF]" />
                    <span>Run Routine (Request Confirmation)</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 6: MEMORY CORE ─────────────────────────────────── */}
        {activeTab === "memory" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <h2 className="font-display text-sm font-bold text-white uppercase tracking-wide">
                Persistent Memory & Taught Facts
              </h2>
              <p className="text-xs text-[#C0BEEF]/70">
                JARVIS remembers personal context, preferred editors/tools, active projects, and aliases.
              </p>
            </div>

            <div className="rounded-xl border border-[#2614DF]/40 bg-[#0C081D]/80 p-4">
              <h3 className="font-mono text-xs font-bold text-[#00E5FF] uppercase mb-3">
                Explicit Facts & Alias Substitutions
              </h3>
              <div className="space-y-2">
                {facts.length === 0 ? (
                  <p className="text-xs text-ink-faint">No specific facts taught yet. Tell JARVIS &quot;Remember I use VS Code&quot; or similar.</p>
                ) : (
                  facts.map((f) => (
                    <div
                      key={f.key}
                      className="flex items-center justify-between rounded-lg border border-[#2614DF]/20 bg-black/40 px-3 py-2 text-xs"
                    >
                      <div>
                        <span className="font-mono font-bold text-white">{f.key}</span>
                        <span className="text-ink-faint mx-2">→</span>
                        <span className="text-[#00E5FF]">{f.value}</span>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          await jarvisApi.deleteFact(f.key);
                          fetchMemory();
                        }}
                        className="text-red-400 hover:text-red-300 transition-colors p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 7: FILE PROCESSOR ──────────────────────────────── */}
        {activeTab === "files" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <h2 className="font-display text-sm font-bold text-white uppercase tracking-wide">
                Universal File Processor & Directory Organizer
              </h2>
              <p className="text-xs text-[#C0BEEF]/70">
                Inspect, OCR, summarize, convert, or organize any file type across Desktop, Documents, and Downloads.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={async () => {
                  setPendingConfirmation({
                    type: "FILE_CONTROL",
                    action_name: "ORGANIZE",
                    target: "desktop",
                  });
                }}
                className="flex items-center gap-1.5 rounded-lg bg-[#2614DF]/40 border border-[#01C0D7]/40 px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#2614DF] transition-all cursor-pointer"
              >
                <FolderOpen className="h-3.5 w-3.5 text-[#00E5FF]" />
                <span>Organize Desktop Files by Type</span>
              </button>
            </div>

            {/* File Search */}
            <div className="rounded-xl border border-[#2614DF]/40 bg-[#0C081D]/80 p-4">
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={fileSearchQuery}
                  onChange={(e) => setFileSearchQuery(e.target.value)}
                  placeholder="Search file name across PC folders..."
                  className="flex-1 rounded-lg border border-[#2614DF]/40 bg-black/60 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#01C0D7]"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!fileSearchQuery.trim()) return;
                    const res = await jarvisApi.searchFiles(fileSearchQuery.trim());
                    setFileSearchResults(res.results || []);
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-[#2614DF] hover:brightness-110 px-4 py-1.5 text-xs font-bold text-white transition-all cursor-pointer"
                >
                  <Search className="h-3.5 w-3.5" />
                  <span>Search</span>
                </button>
              </div>

              {fileSearchResults.length > 0 && (
                <div className="max-h-52 overflow-y-auto scrollbar-thin space-y-1.5">
                  {fileSearchResults.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border border-[#2614DF]/20 bg-black/40 px-3 py-1.5 text-xs"
                    >
                      <div className="truncate mr-2">
                        <div className="font-semibold text-white truncate">{f.name}</div>
                        <div className="font-mono text-[9px] text-[#C0BEEF]/50 truncate">{f.path}</div>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          setIsProcessingFile(true);
                          const res = await jarvisApi.processFile(f.path, "auto");
                          setProcessedResult(res);
                          setIsProcessingFile(false);
                        }}
                        className="flex items-center gap-1 text-[11px] text-[#00E5FF] hover:underline flex-shrink-0 cursor-pointer"
                      >
                        <Sparkles className="h-3 w-3" /> Analyze
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {processedResult && (
                <div className="mt-3 rounded-lg border border-[#01C0D7]/40 bg-black/60 p-3 text-xs leading-relaxed text-[#E8EEFF]">
                  <div className="font-mono text-[#00E5FF] font-bold mb-1">
                    Analysis for: {processedResult.file || "File"}
                  </div>
                  <div className="whitespace-pre-line">{processedResult.result || processedResult.message}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 8: ACTIVITY LOG ────────────────────────────────── */}
        {activeTab === "activity" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-bold text-white uppercase tracking-wide">
                Recorded System & Action Log
              </h2>
              <button
                type="button"
                onClick={fetchActivityLog}
                className="text-xs font-mono text-[#00E5FF] hover:underline cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" /> Refresh
              </button>
            </div>

            <div className="rounded-xl border border-[#2614DF]/40 bg-[#0C081D]/80 p-3">
              {activityLog.length === 0 ? (
                <p className="text-xs text-ink-faint p-2">No activity recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {activityLog.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-lg border border-[#2614DF]/20 bg-black/40 p-2.5 text-xs font-mono"
                    >
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="text-[#00E5FF] font-bold uppercase">{log.action}</span>
                        <span className="text-[#C0BEEF]/50">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="text-white font-medium">{log.detail}</div>
                      <div className="text-[#C0BEEF]/70 text-[10px] mt-0.5">{log.result}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 9: SETTINGS ────────────────────────────────────── */}
        {activeTab === "settings" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <h2 className="font-display text-sm font-bold text-white uppercase tracking-wide">
                Security Permissions & Configuration
              </h2>
              <p className="text-xs text-[#C0BEEF]/70">
                Configure authorized desktop control scopes and assistant preferences.
              </p>
            </div>

            {/* Permission Scopes */}
            <div className="rounded-xl border border-[#2614DF]/40 bg-[#0C081D]/80 p-4 space-y-3">
              <h3 className="font-mono text-xs font-bold text-[#00E5FF] uppercase">
                Authorized System Scopes
              </h3>
              {[
                { scope: "control.launch_app", label: "Control Applications", desc: "Allow launching and switching open desktop apps." },
                { scope: "fs.read", label: "Search & Read Files", desc: "Allow querying files across Personal folders." },
                { scope: "fs.write", label: "Manage & Organize Files", desc: "Allow creating folders and organizing desktop files." },
                { scope: "control.keyboard", label: "Keyboard & Typing Control", desc: "Allow typing and shortcut key emulation." },
              ].map((p) => {
                const granted = Boolean(permissions[p.scope]);
                return (
                  <div
                    key={p.scope}
                    className="flex items-center justify-between rounded-lg border border-[#2614DF]/20 bg-black/40 p-3"
                  >
                    <div>
                      <div className="font-semibold text-xs text-white">{p.label}</div>
                      <div className="text-[11px] text-[#C0BEEF]/60">{p.desc}</div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await jarvisApi.setPermission(p.scope, !granted);
                        fetchPermissions();
                      }}
                      className={cn(
                        "rounded-lg px-3 py-1 font-mono text-[11px] font-bold border transition-all cursor-pointer",
                        granted
                          ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                          : "bg-red-500/20 border-red-500/50 text-red-400"
                      )}
                    >
                      {granted ? "GRANTED" : "DENIED"}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* AI Reasoning & API Configuration */}
            <div className="rounded-xl border border-[#2614DF]/40 bg-[#0C081D]/80 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-xs font-bold text-[#00E5FF] uppercase">
                  AI Neural Engine Configuration
                </h3>
                {apiKeysStatus?.offline_fallback_active ? (
                  <span className="rounded bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 font-mono text-[10px] text-amber-300">
                    Offline Fallback Active
                  </span>
                ) : (
                  <span className="rounded bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 font-mono text-[10px] text-emerald-400">
                    Online LLM Connected
                  </span>
                )}
              </div>
              <p className="text-xs text-[#C0BEEF]/70">
                Configure your Gemini or OpenRouter API keys. Keys are stored locally on your machine and never hard-coded in the UI. When no keys are present, JARVIS uses deterministic offline pattern matching.
              </p>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block font-mono text-[10px] uppercase text-[#C0BEEF] mb-1">
                    Google Gemini API Key {apiKeysStatus?.gemini_configured && <span className="text-emerald-400 font-bold ml-1">({apiKeysStatus.gemini_masked})</span>}
                  </label>
                  <input
                    type="password"
                    placeholder={apiKeysStatus?.gemini_configured ? "Leave blank to keep existing key" : "AIzaSy..."}
                    value={geminiKeyInput}
                    onChange={(e) => setGeminiKeyInput(e.target.value)}
                    className="w-full rounded-lg border border-[#2614DF]/40 bg-black/60 px-3 py-2 text-xs text-white placeholder:text-[#C0BEEF]/30 focus:border-[#00E5FF] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase text-[#C0BEEF] mb-1">
                    OpenRouter API Key (Fallback) {apiKeysStatus?.openrouter_configured && <span className="text-emerald-400 font-bold ml-1">({apiKeysStatus.openrouter_masked})</span>}
                  </label>
                  <input
                    type="password"
                    placeholder={apiKeysStatus?.openrouter_configured ? "Leave blank to keep existing key" : "sk-or-v1-..."}
                    value={openrouterKeyInput}
                    onChange={(e) => setOpenrouterKeyInput(e.target.value)}
                    className="w-full rounded-lg border border-[#2614DF]/40 bg-black/60 px-3 py-2 text-xs text-white placeholder:text-[#C0BEEF]/30 focus:border-[#00E5FF] focus:outline-none font-mono"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  {apiKeySaveStatus && (
                    <span className="font-mono text-xs text-emerald-400">{apiKeySaveStatus}</span>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      if (!geminiKeyInput.trim() && !openrouterKeyInput.trim()) return;
                      await jarvisApi.saveApiKeys(
                        geminiKeyInput.trim() || undefined,
                        openrouterKeyInput.trim() || undefined
                      );
                      const updated = await jarvisApi.getApiKeysStatus();
                      setApiKeysStatus(updated);
                      setGeminiKeyInput("");
                      setOpenrouterKeyInput("");
                      setApiKeySaveStatus("API keys saved successfully.");
                      setTimeout(() => setApiKeySaveStatus(null), 4000);
                    }}
                    className="ml-auto rounded-lg bg-[#2614DF] border border-[#01C0D7]/50 px-4 py-2 font-mono text-xs font-bold text-white hover:bg-[#2614DF]/80 cursor-pointer shadow-[0_0_10px_rgba(1,192,215,0.4)]"
                  >
                    Save API Keys
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
