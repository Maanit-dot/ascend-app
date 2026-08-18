"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Mic,
  Minus,
  Send,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { jarvisApi } from "@/lib/api/jarvis";
import { jarvisSpeech } from "@/lib/speech";
import { useJarvisStore, type JarvisMessage } from "@/store/useJarvisStore";
import { useQuestBoardStore } from "@/store/useQuestBoardStore";
import { useUserStore } from "@/store/useUserStore";
import { getHunterTitle, getHunterRank } from "@/lib/format";
import { cn } from "@/lib/utils";

/* ── Animated Waveform ─────────────────────────────────────────── */
function WaveformBars({ active }: { active: boolean }) {
  const HEIGHTS = [35, 65, 50, 80, 55, 40, 75, 45, 60, 30, 70, 45, 55, 38, 68];
  return (
    <div className="flex items-center gap-px h-6">
      {HEIGHTS.map((h, i) => (
        <span
          key={i}
          className={cn(
            "waveform-bar rounded-full transition-all duration-300",
            active ? "bg-arc-400" : "bg-arc-600/25",
          )}
          style={{
            height: active ? `${Math.max(4, (h / 100) * 24)}px` : "3px",
            width: "2px",
            animationDelay: `${i * 55}ms`,
            animationPlayState: active ? "running" : "paused",
          }}
        />
      ))}
    </div>
  );
}

/* ── JARVIS Orb ─────────────────────────────────────────────────── */
function JarvisOrb({ active }: { active: boolean }) {
  return (
    <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center">
      {/* Outer ring — slow spin */}
      <div className="absolute inset-0 rounded-full border border-arc-500/30 animate-spin-slow" />
      {/* Middle ring */}
      <div className="absolute inset-1 rounded-full border border-arc-400/20 animate-spin-reverse" />
      {/* Core orb */}
      <div
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-arc-500 to-arc-800 shadow-glow-arc transition-all duration-500",
          active && "shadow-glow-arc-lg animate-orb-pulse",
        )}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="2.5" fill="white" />
          <path d="M12 3C7.03 3 3 7.03 3 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          <path d="M12 21C16.97 21 21 16.97 21 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          <path d="M3 12C3 16.97 7.03 21 12 21" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeLinecap="round" />
          <path d="M21 12C21 7.03 16.97 3 12 3" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeLinecap="round" />
        </svg>
      </div>
      {/* Online pulse */}
      <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 border-2 border-void" />
      </span>
    </div>
  );
}

/* ── Chat Message ────────────────────────────────────────────────── */
function ChatMessage({ msg }: { msg: JarvisMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex flex-col animate-fade-in", isUser ? "items-end" : "items-start")}>
      {/* Sender label + timestamp */}
      <div className={cn("mb-1 flex items-center gap-1.5", isUser && "flex-row-reverse")}>
        <span className="font-mono text-[8px] uppercase tracking-wider text-arc-500/50">
          {isUser ? "You" : "JARVIS"}
        </span>
        <span className="font-mono text-[8px] text-arc-500/30">{msg.timestamp}</span>
      </div>

      {/* Bubble */}
      <div className={isUser ? "jarvis-user-bubble" : "jarvis-ai-bubble"}>
        <div className="whitespace-pre-line">{msg.text}</div>

        {/* Quest mutation action card */}
        {msg.action?.type === "QUEST_MUTATION" && (
          <div className="mt-2.5 rounded-lg border border-emerald-500/30 bg-emerald-950/40 p-2.5">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-400 text-[10px] mb-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>Quest Updated</span>
            </div>
            {msg.action.quest_title && (
              <p className="font-mono text-[9px] text-emerald-300/90">
                {msg.action.quest_title}
                {msg.action.new_target && (
                  <> → <strong className="text-white">{msg.action.new_target}</strong></>
                )}
              </p>
            )}
            <button
              onClick={() => {
                const el = document.getElementById("daily-quests");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="mt-1.5 flex items-center gap-1 font-mono text-[8px] font-medium text-emerald-400 hover:text-emerald-200 transition-colors"
            >
              View Updated Quests <ArrowRight className="h-2 w-2" />
            </button>
          </div>
        )}

        {/* Backend/AI unavailable card */}
        {msg.action?.type === "BACKEND_UNAVAILABLE" && (
          <div className="mt-2 rounded-lg border border-crimson-500/25 bg-crimson-950/30 p-2">
            <p className="font-mono text-[9px] text-crimson-400">⚠ Backend Offline</p>
          </div>
        )}
        {msg.action?.type === "AI_UNAVAILABLE" && (
          <div className="mt-2 rounded-lg border border-amber-500/25 bg-amber-950/30 p-2">
            <p className="font-mono text-[9px] text-amber-400">⚠ AI Provider Unavailable</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── JarvisWidget (main export) ─────────────────────────────────── */
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
  const user = useUserStore((s) => s.user);
  const [input, setInput] = useState("");
  const [minimized, setMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
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

      // Apply quest mutations to local store for immediate UI feedback
      if (response.action?.type === "QUEST_MUTATION") {
        if (response.action.action_name === "UPDATE_TARGET" && response.action.new_target) {
          updateQuestTarget(response.action.quest_title || trimmed, response.action.new_target);
          fetchToday();
        } else if (response.action.action_name === "OPTIMIZE_WORKLOAD" && response.action.time_budget_minutes) {
          optimizeWorkload(response.action.time_budget_minutes);
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
        text: "⚠️ **Signal disrupted.** Neural link unstable — please repeat your command, Hunter.",
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
        onError:  () => { setListening(false); },
        onEnd:    () => { setListening(false); },
      });
    }
  }

  const isActive = isListening || isSpeaking;
  const statusText = isListening ? "LISTENING..." : isSpeaking ? "SPEAKING..." : isProcessing ? "PROCESSING..." : "JARVIS ONLINE";

  return (
    <aside className="z-40 hidden h-full w-80 flex-shrink-0 flex-col border-l border-arc-500/25 bg-void/95 xl:flex overflow-hidden">
      {/* Right-edge glow */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-arc-500/30 to-transparent" />
      {/* Left-edge subtle glow */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-arc-500/0 via-arc-500/20 to-arc-500/0" />
      {/* Background inner glow */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-arc-500/5 via-transparent to-arc-500/3" />

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <div className="relative flex h-16 flex-shrink-0 items-center border-b border-arc-500/20 px-4">
        {/* Corner accents */}
        <span className="absolute top-0 left-0 w-4 h-4 border-t border-l border-arc-400/50 pointer-events-none" />
        <span className="absolute top-0 right-0 w-4 h-4 border-t border-r border-arc-400/50 pointer-events-none" />

        {/* Orb + title */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <JarvisOrb active={isActive || isProcessing} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="font-display text-sm font-bold tracking-[0.2em] text-ink-primary text-glow-arc">JARVIS</h2>
              <span className="rounded border border-arc-500/30 bg-arc-500/10 px-1 py-px font-mono text-[8px] text-arc-400">AI</span>
            </div>
            <p className="font-mono text-[8px] uppercase tracking-[0.15em] text-arc-400/70">AI System Assistant</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={toggleVoice}
            className={cn(
              "rounded-lg p-1.5 transition-colors",
              voiceEnabled ? "text-arc-300 hover:bg-arc-500/20" : "text-ink-faint hover:bg-white/5",
            )}
            title={voiceEnabled ? "Mute JARVIS" : "Unmute JARVIS"}
          >
            {voiceEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => setMinimized((v) => !v)}
            className="rounded-lg p-1.5 text-ink-faint hover:bg-white/5 hover:text-ink-secondary transition-colors"
            title="Minimize"
          >
            <Minus className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* ── STATUS BAR ────────────────────────────────────────────── */}
      {!minimized && (
        <div className="flex flex-shrink-0 items-center justify-between border-b border-arc-500/12 bg-arc-950/30 px-4 py-2">
          <span className={cn(
            "font-mono text-[9px] font-semibold tracking-wider uppercase",
            isActive ? "text-emerald-400" : isProcessing ? "text-amber-400" : "text-arc-400/70",
          )}>
            {statusText}
          </span>
          <WaveformBars active={isActive || isProcessing} />
        </div>
      )}

      {/* ── USER SYSTEM DATA ─────────────────────────────────────── */}
      {!minimized && user && (
        <div className="flex-shrink-0 border-b border-arc-500/12 bg-arc-950/15 px-4 py-3">
          <p className="system-label mb-2">Hunter Data</p>
          <div className="space-y-1">
            {[
              { label: "NAME",   value: user.display_name },
              { label: "LEVEL",  value: `${user.character.level}` },
              { label: "RANK",   value: `Rank ${getHunterRank(user.character.level)}` },
              { label: "TITLE",  value: getHunterTitle(user.character.level) },
              {
                label: "XP",
                value: `${user.character.current_xp.toLocaleString()} / ${user.character.xp_required_for_next_level.toLocaleString()}`,
              },
              { label: "STREAK", value: `${user.character.current_streak_days} days` },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="font-mono text-[8px] uppercase tracking-wider text-arc-500/50">{label}</span>
                <span className="font-mono text-[9px] font-medium text-ink-secondary">{value}</span>
              </div>
            ))}
          </div>
          {/* XP progress bar */}
          <div className="mt-2 h-px w-full rounded-full bg-void-deep overflow-hidden">
            <div
              className="h-full rounded-full bg-stat-bar-arc shadow-glow-arc-sm transition-all duration-700"
              style={{ width: `${user.character.xp_progress_percent}%` }}
            />
          </div>
        </div>
      )}

      {/* ── CHAT HISTORY ────────────────────────────────────────── */}
      {!minimized && (
        <div
          ref={scrollRef}
          className="flex-1 space-y-3 overflow-y-auto p-4 font-body text-xs"
          style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(139,92,246,0.2) transparent" }}
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-arc-500/10 border border-arc-500/25">
                <svg className="h-6 w-6 text-arc-400/60" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3" fill="currentColor" />
                  <path d="M12 3C7.03 3 3 7.03 3 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
                  <path d="M12 21C16.97 21 21 16.97 21 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
                </svg>
              </div>
              <div>
                <p className="font-display text-xs font-semibold text-ink-primary">JARVIS Online</p>
                <p className="font-mono text-[9px] text-ink-faint mt-1">
                  How can I assist you today, Hunter?
                </p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <ChatMessage key={msg.id} msg={msg} />
          ))}

          {/* Processing indicator */}
          {isProcessing && (
            <div className="flex items-start gap-2 animate-fade-in">
              <div className="jarvis-ai-bubble flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin text-arc-400 flex-shrink-0" />
                <span className="font-mono text-[9px] text-arc-300">Processing command...</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── INPUT AREA ────────────────────────────────────────────── */}
      {!minimized && (
        <div className="flex-shrink-0 border-t border-arc-500/20 bg-arc-950/25 p-3 space-y-2">
          {/* Mic button */}
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={toggleVoiceListening}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                isListening
                  ? "border-crimson-500/60 bg-crimson-500/15 text-crimson-400 animate-pulse shadow-glow-crimson"
                  : "border-arc-500/30 bg-arc-500/10 text-arc-300 hover:border-arc-500/60 hover:bg-arc-500/20 hover:shadow-glow-arc-sm",
              )}
              aria-label={isListening ? "Stop listening" : "Start voice command"}
            >
              <Mic className={cn("h-4 w-4", isListening && "text-crimson-400")} />
            </button>
          </div>

          {/* Waveform area when listening */}
          {isListening && (
            <div className="flex items-center justify-center">
              <WaveformBars active={true} />
            </div>
          )}

          <p className="text-center font-mono text-[8px] text-arc-500/50">
            {isListening ? "Listening... tap to cancel" : "Tap to speak"}
          </p>

          {/* Text input */}
          <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your comment..."
              disabled={isProcessing}
              className="flex-1 rounded-lg border border-arc-500/20 bg-void/80 px-3 py-2 font-mono text-[10px] text-ink-secondary placeholder:text-arc-500/35 focus:border-arc-400 focus:outline-none focus:ring-1 focus:ring-arc-400/25 disabled:opacity-50 transition-colors"
              aria-label="JARVIS command input"
            />
            <button
              type="submit"
              disabled={!input.trim() || isProcessing}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-arc-600 to-arc-800 text-white shadow-glow-arc-sm transition-all hover:shadow-glow-arc hover:from-arc-500 disabled:opacity-30"
              aria-label="Send command to JARVIS"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}
    </aside>
  );
}
