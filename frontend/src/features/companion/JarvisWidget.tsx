"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Mic,
  Send,
  Volume2,
  VolumeX,
  Trophy,
  Sparkles,
  Zap,
  Target,
  BarChart2,
} from "lucide-react";
import { jarvisApi, type JarvisAction } from "@/lib/api/jarvis";
import { jarvisSpeech } from "@/lib/speech";
import { useJarvisStore, type JarvisMessage } from "@/store/useJarvisStore";
import { useQuestBoardStore } from "@/store/useQuestBoardStore";
import { useUserStore } from "@/store/useUserStore";
import { cn } from "@/lib/utils";
import Link from "next/link";

/* ── Holographic Soundwave Frequency Core (Image 1 Matching) ───── */
function JarvisHoloReactor({ active }: { active: boolean }) {
  return (
    <div className="relative flex flex-col items-center justify-center py-1.5 flex-shrink-0">
      {/* Outer Glow & Concentric Rings */}
      <div className="relative flex items-center justify-center" style={{ width: 140, height: 68 }}>
        <svg className="absolute inset-0" width="140" height="68" viewBox="0 0 140 68" fill="none">
          {/* Background horizontal axis line */}
          <line x1="10" y1="34" x2="130" y2="34" stroke="rgba(139,92,246,0.3)" strokeWidth="1" strokeDasharray="2 4" />

          {/* Central concentric energy ellipses */}
          <ellipse cx="70" cy="34" rx="42" ry="26" stroke="rgba(168,85,247,0.35)" strokeWidth="1" strokeDasharray="4 4" />
          <ellipse cx="70" cy="34" rx="30" ry="18" stroke="rgba(192,178,255,0.4)" strokeWidth="1" />

          {/* Dynamic Soundwave Frequencies */}
          <path
            d="M20 34 Q35 15 45 34 T70 12 T95 48 T105 34 T120 34"
            stroke="rgba(168,85,247,0.9)"
            strokeWidth="1.5"
            strokeLinecap="round"
            style={{ animation: active ? "arc-draw 1.5s ease-in-out infinite" : "none", filter: "drop-shadow(0 0 4px #A855F7)" }}
          />
          <path
            d="M30 34 Q45 48 55 34 T80 52 T105 20 T115 34"
            stroke="rgba(0,229,255,0.85)"
            strokeWidth="1"
            strokeLinecap="round"
            style={{ animation: active ? "arc-draw 2s ease-in-out infinite" : "none", filter: "drop-shadow(0 0 4px #00E5FF)" }}
          />
        </svg>

        {/* Center glowing energy sphere */}
        <div
          className={cn(
            "relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-arc-400 via-arc-600 to-arc-950 shadow-glow-arc transition-all duration-500",
            active && "scale-110 shadow-glow-arc-lg animate-orb-pulse"
          )}
        >
          <div className="h-3 w-3 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
        </div>
      </div>
    </div>
  );
}

/* ── Chat Message Bubble ─────────────────────────────────────────── */
function ChatMessage({ msg }: { msg: JarvisMessage }) {
  const isUser = msg.role === "user";

  return (
    <div className={cn("flex flex-col animate-fade-in", isUser ? "items-end" : "items-start")}>
      <div className={cn("mb-0.5 flex items-center gap-1.5", isUser && "flex-row-reverse")}>
        <span className="font-mono text-[8px] uppercase tracking-wider text-arc-300 font-bold">
          {isUser ? "You" : "JARVIS 23:02"}
        </span>
        <span className="font-mono text-[8px] text-ink-faint">{msg.timestamp}</span>
      </div>

      <div
        className={cn(
          "rounded-lg px-2.5 py-1.5 max-w-[90%] leading-relaxed text-[10px]",
          isUser
            ? "border border-arc-500/30 bg-arc-950/60 text-white ml-auto"
            : "border border-arc-500/20 bg-void/80 text-ink-secondary"
        )}
      >
        <div className="whitespace-pre-line">{msg.text}</div>

        {msg.action?.type === "QUEST_MUTATION" && (
          <div className="mt-1 rounded border border-emerald-500/30 bg-emerald-950/40 p-1.5">
            <div className="flex items-center gap-1 font-semibold text-emerald-400 text-[8px] mb-0.5">
              <CheckCircle2 className="h-2.5 w-2.5" />
              <span>Quest Target Updated</span>
            </div>
            {msg.action.quest_title && (
              <p className="font-mono text-[7px] text-emerald-300/90">
                {msg.action.quest_title} → <strong className="text-white">{msg.action.new_target}</strong>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Jarvis Main Widget Export ──────────────────────────────────── */
export function JarvisWidget() {
  const {
    isListening,
    isProcessing,
    isSpeaking,
    voiceEnabled,
    messages,
    setListening,
    setProcessing,
    setSpeaking,
    toggleVoice,
    addMessage,
  } = useJarvisStore();

  const { updateQuestTarget, optimizeWorkload, fetchToday } = useQuestBoardStore();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isProcessing]);

  async function handleCommandSubmit(commandText: string) {
    const trimmed = commandText.trim();
    if (!trimmed || isProcessing) return;

    addMessage({ role: "user", text: trimmed });
    setInput("");
    setProcessing(true);

    try {
      const historyPayload = messages.slice(-6).map((m) => ({ role: m.role, text: m.text }));
      const response = await jarvisApi.sendCommand(trimmed, historyPayload);

      if (response.action?.type === "QUEST_MUTATION") {
        if (response.action.action_name === "UPDATE_TARGET" && response.action.new_target) {
          updateQuestTarget(response.action.quest_title || trimmed, response.action.new_target);
          fetchToday();
        } else if (response.action.action_name === "OPTIMIZE_WORKLOAD" && response.action.time_budget_minutes) {
          optimizeWorkload(response.action.time_budget_minutes);
          fetchToday();
        } else if (response.action.action_name === "ADD_QUEST" && response.action.board_refresh) {
          fetchToday();
        }
      }

      addMessage({ role: "jarvis", text: response.reply, action: response.action });

      if (voiceEnabled) {
        setSpeaking(true);
        jarvisSpeech.speak(response.reply, () => setSpeaking(false));
      }
    } catch {
      addMessage({
        role: "jarvis",
        text: "⚠️ Signal disrupted. Neural link unstable — please repeat your command, Hunter.",
      });
    } finally {
      setProcessing(false);
    }
  }

  function handleFormSubmit(e: FormEvent) {
    e.preventDefault();
    handleCommandSubmit(input);
  }

  function toggleVoiceListening() {
    if (isListening) {
      jarvisSpeech.stopListening();
      setListening(false);
    } else {
      setListening(true);
      jarvisSpeech.startListening({
        onResult: (transcript) => { setListening(false); handleCommandSubmit(transcript); },
        onError: () => { setListening(false); },
        onEnd: () => { setListening(false); },
      });
    }
  }

  const SUGGESTED_ACTIONS = [
    { label: "Optimize today's quests", cmd: "Optimize my workload to 60 minutes", icon: Zap },
    { label: "Analyze weak subjects", cmd: "What is my weakest stat and subject?", icon: Target },
    { label: "Generate new quest", cmd: "Add a new quest: Meditation for 20 minutes", icon: Sparkles },
    { label: "Show progress report", cmd: "Show my quests", icon: BarChart2 },
  ];

  const isActive = isListening || isSpeaking;

  return (
    <aside className="z-40 hidden h-full w-[270px] xl:w-[285px] flex-shrink-0 flex-col border-l border-arc-500/20 bg-[#05030D]/95 lg:flex overflow-hidden p-2 gap-2 select-none">
      {/* ── HEADER ──────────────────────────────────────────────── */}
      <div className="flex h-10 flex-shrink-0 items-center justify-between border-b border-arc-500/20 px-1 pb-1">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <h2 className="font-display text-xs font-bold tracking-[0.2em] text-white text-glow-arc">JARVIS AI</h2>
          </div>
          <span className="font-mono text-[7px] tracking-widest text-arc-400/80 uppercase">AI SYSTEM ASSISTANT</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[8px] uppercase tracking-wider text-emerald-400 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> ONLINE
          </span>
          <button
            onClick={toggleVoice}
            className={cn(
              "rounded p-1 transition-colors",
              voiceEnabled ? "text-arc-300 hover:bg-arc-500/20" : "text-ink-faint hover:bg-white/5"
            )}
            title={voiceEnabled ? "Mute JARVIS" : "Unmute JARVIS"}
          >
            {voiceEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* ── HOLOGRAPHIC SOUNDWAVE CORE ─────────────────────────── */}
      <JarvisHoloReactor active={isActive || isProcessing} />

      {/* ── CHAT MESSAGE TRANSCRIPT ─────────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-1.5 overflow-y-auto p-1 font-body text-xs min-h-0 scrollbar-thin"
      >
        {messages.length === 0 ? (
          <div className="rounded-lg border border-arc-500/15 bg-arc-950/30 p-2 text-center space-y-0.5">
            <p className="font-mono text-[9px] text-arc-300">&quot;How can I assist you, Hunter?&quot;</p>
            <p className="font-mono text-[8px] text-ink-faint">&quot;What are my quests today?&quot;</p>
          </div>
        ) : (
          messages.map((msg) => <ChatMessage key={msg.id} msg={msg} />)
        )}

        {isProcessing && (
          <div className="flex items-center gap-1.5 text-arc-400 font-mono text-[8px] py-0.5">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Processing command...</span>
          </div>
        )}
      </div>

      {/* ── SUGGESTED ACTIONS DOCK ───────────────────────────────── */}
      <div className="flex-shrink-0 space-y-1 pt-1 border-t border-arc-500/15">
        <p className="font-mono text-[7px] text-arc-400/80 uppercase tracking-widest font-bold px-0.5">
          SUGGESTED ACTIONS
        </p>
        <div className="space-y-1">
          {SUGGESTED_ACTIONS.map((action, i) => (
            <button
              key={i}
              onClick={() => handleCommandSubmit(action.cmd)}
              disabled={isProcessing}
              className="flex w-full items-center justify-between rounded border border-arc-500/20 bg-void/80 px-2 py-1 text-left font-mono text-[8px] text-ink-secondary hover:border-arc-400/50 hover:bg-arc-950/40 hover:text-white transition-all group disabled:opacity-50"
            >
              <div className="flex items-center gap-1.5 truncate">
                <action.icon className="h-2.5 w-2.5 text-arc-400 group-hover:text-arc-300 flex-shrink-0" />
                <span className="truncate">{action.label}</span>
              </div>
              <ArrowRight className="h-2.5 w-2.5 text-arc-500 group-hover:translate-x-0.5 group-hover:text-arc-300 transition-all flex-shrink-0 ml-1" />
            </button>
          ))}
        </div>
      </div>

      {/* ── VOICE MIC BUTTON & INPUT ─────────────────────────────── */}
      <div className="flex-shrink-0 space-y-1.5 pt-1 border-t border-arc-500/15">
        <div className="flex flex-col items-center gap-0.5">
          <button
            type="button"
            onClick={toggleVoiceListening}
            className={cn(
              "relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 shadow-glow-arc-lg",
              isListening
                ? "border-crimson-500 bg-crimson-500/25 text-crimson-400 shadow-glow-crimson animate-pulse"
                : "border-arc-300 bg-gradient-to-br from-arc-500 via-arc-700 to-arc-950 text-white hover:scale-105"
            )}
            title={isListening ? "Stop Listening" : "Tap to speak"}
          >
            <Mic className="h-4 w-4" />
          </button>
          <span className="font-mono text-[7px] text-ink-muted">Tap to speak</span>
        </div>

        <form onSubmit={handleFormSubmit} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your command..."
            disabled={isProcessing}
            className="w-full rounded border border-arc-500/20 bg-void/90 px-2.5 py-1 pr-7 font-mono text-[9px] text-ink-primary placeholder:text-ink-faint focus:border-arc-400 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="absolute right-1 flex h-5 w-5 items-center justify-center rounded bg-arc-600 text-white hover:bg-arc-500 disabled:opacity-30 transition-colors"
          >
            <Send className="h-2.5 w-2.5" />
          </button>
        </form>
      </div>

      {/* ── RECENT ACHIEVEMENT CARD ─────────────────────────────── */}
      <div className="flex-shrink-0 pt-0.5">
        <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-1.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-amber-500/25 text-amber-300">
              <Trophy className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-display text-[8px] font-bold text-white truncate">Unstoppable</span>
                <span className="rounded bg-amber-500/30 px-1 font-mono text-[6px] text-amber-300">NEW</span>
              </div>
              <p className="font-mono text-[7px] text-amber-400/90">+500 XP</p>
            </div>
          </div>
          <Link href="/achievements" className="font-mono text-[7px] text-amber-400 hover:underline flex-shrink-0">
            VIEW ALL →
          </Link>
        </div>
      </div>
    </aside>
  );
}
