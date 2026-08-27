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
} from "lucide-react";
import { jarvisApi, type JarvisAction } from "@/lib/api/jarvis";
import { jarvisSpeech } from "@/lib/speech";
import { useJarvisStore, type JarvisMessage } from "@/store/useJarvisStore";
import { useQuestBoardStore } from "@/store/useQuestBoardStore";
import { useUserStore } from "@/store/useUserStore";
import { getHunterTitle, getHunterRank } from "@/lib/format";
import { cn } from "@/lib/utils";
import Link from "next/link";

/* ── Animated Waveform Bars ─────────────────────────────────────── */
function WaveformBars({ active }: { active: boolean }) {
  const HEIGHTS = [35, 65, 50, 80, 55, 40, 75, 45, 60, 30, 70, 45, 55, 38, 68];
  return (
    <div className="flex items-center gap-px h-5">
      {HEIGHTS.map((h, i) => (
        <span
          key={i}
          className={cn(
            "waveform-bar rounded-full transition-all duration-300",
            active ? "bg-arc-300 shadow-glow-arc-sm" : "bg-arc-600/30",
          )}
          style={{
            height: active ? `${Math.max(3, (h / 100) * 20)}px` : "2px",
            width: "2px",
            animationDelay: `${i * 55}ms`,
            animationPlayState: active ? "running" : "paused",
          }}
        />
      ))}
    </div>
  );
}

/* ── JARVIS Orb Header ──────────────────────────────────────────── */
function JarvisOrb({ active }: { active: boolean }) {
  return (
    <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center">
      <div className="absolute inset-0 rounded-full border border-arc-500/40 animate-spin-slow" />
      <div className="absolute inset-0.5 rounded-full border border-arc-400/30 animate-spin-reverse" />
      <div
        className={cn(
          "relative flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-arc-500 to-arc-800 shadow-glow-arc transition-all duration-500",
          active && "shadow-glow-arc-lg animate-orb-pulse",
        )}
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="2.5" fill="white" />
          <path d="M12 3C7.03 3 3 7.03 3 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
          <path d="M12 21C16.97 21 21 16.97 21 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
          <path d="M3 12C3 16.97 7.03 21 12 21" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeLinecap="round" />
          <path d="M21 12C21 7.03 16.97 3 12 3" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeLinecap="round" />
        </svg>
      </div>
      <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 border border-void" />
      </span>
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
          {isUser ? "You" : "JARVIS"}
        </span>
        <span className="font-mono text-[8px] text-ink-faint">{msg.timestamp}</span>
      </div>

      <div className={isUser ? "jarvis-user-bubble" : "jarvis-ai-bubble"}>
        <div className="whitespace-pre-line text-[11px]">{msg.text}</div>

        {msg.action?.type === "QUEST_MUTATION" && (
          <div className="mt-1.5 rounded border border-emerald-500/30 bg-emerald-950/40 p-2">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-400 text-[9px] mb-0.5">
              <CheckCircle2 className="h-3 w-3" />
              <span>Quest Updated</span>
            </div>
            {msg.action.quest_title && (
              <p className="font-mono text-[8px] text-emerald-300/90">
                {msg.action.quest_title}
                {msg.action.new_target && (
                  <> → <strong className="text-white">{msg.action.new_target}</strong></>
                )}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Large Mic Orb with Waveforms (Matching Reference Screenshot) ─ */
function VoiceOrbWithWaveform({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <div className="flex flex-col items-center gap-1 my-1">
      <div className="flex items-center justify-center gap-2.5 w-full">
        <WaveformBars active={active} />

        {/* Central glowing microphone orb */}
        <button
          type="button"
          onClick={onClick}
          className={cn(
            "relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 shadow-glow-arc-lg",
            active
              ? "border-crimson-500 bg-crimson-500/25 text-crimson-400 shadow-glow-crimson animate-pulse"
              : "border-arc-300 bg-gradient-to-br from-arc-500 via-arc-700 to-arc-950 text-white hover:scale-105",
          )}
          title={active ? "Stop Listening" : "Tap to speak"}
        >
          <div className="absolute inset-0 rounded-full border border-arc-300/40 animate-ping-slow pointer-events-none" />
          <Mic className="h-5 w-5" />
        </button>

        <WaveformBars active={active} />
      </div>
      <span className="font-mono text-[8px] text-ink-muted">Tap to speak</span>
    </div>
  );
}

/* ── JarvisWidget Main Export ───────────────────────────────────── */
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

  const { board, updateQuestTarget, optimizeWorkload, fetchToday } = useQuestBoardStore();
  const user = useUserStore((s) => s.user);
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
        onError: () => { setListening(false); },
        onEnd: () => { setListening(false); },
      });
    }
  }

  const isActive = isListening || isSpeaking;

  return (
    <aside className="z-40 hidden h-full w-[290px] xl:w-[320px] 2xl:w-[340px] flex-shrink-0 flex-col border-l border-arc-500/20 bg-void/95 lg:flex overflow-hidden p-2 gap-2 select-none">
      {/* ── HEADER ──────────────────────────────────────────────── */}
      <div className="relative flex h-12 flex-shrink-0 items-center justify-between border-b border-arc-500/20 px-2 pb-1.5">
        <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-arc-400/40 pointer-events-none" />
        <span className="absolute top-0 right-0 w-3 h-3 border-t border-r border-arc-400/40 pointer-events-none" />

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <JarvisOrb active={isActive || isProcessing} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="font-display text-xs font-bold tracking-[0.2em] text-white text-glow-arc">JARVIS</h2>
              <span className="rounded border border-arc-500/30 bg-arc-500/10 px-1 font-mono text-[7px] text-arc-400">AI</span>
            </div>
            <p className="font-mono text-[8px] uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <span className="h-1 w-1 rounded-full bg-emerald-400" /> ONLINE
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <WaveformBars active={isActive || isProcessing} />
          <button
            onClick={toggleVoice}
            className={cn(
              "rounded p-1 transition-colors",
              voiceEnabled ? "text-arc-300 hover:bg-arc-500/20" : "text-ink-faint hover:bg-white/5",
            )}
            title={voiceEnabled ? "Mute JARVIS" : "Unmute JARVIS"}
          >
            {voiceEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* ── HUNTER DATA METRICS ─────────────────────────────────── */}
      {user && (
        <div className="flex-shrink-0 rounded-lg border border-arc-500/20 bg-arc-950/30 p-2 space-y-1">
          <p className="system-label text-[8px] text-arc-300 font-bold uppercase tracking-widest">HUNTER DATA</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono text-[9px]">
            <div className="flex justify-between">
              <span className="text-ink-faint">NAME</span>
              <span className="text-white font-semibold truncate max-w-[80px]">{user.display_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-faint">LEVEL</span>
              <span className="text-arc-300 font-bold">{user.character.level}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-faint">RANK</span>
              <span className="text-amber-400 font-semibold">Rank {getHunterRank(user.character.level)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-faint">TITLE</span>
              <span className="text-ink-secondary truncate max-w-[80px]">{getHunterTitle(user.character.level)}</span>
            </div>
            <div className="flex justify-between col-span-2">
              <span className="text-ink-faint">XP</span>
              <span className="text-arc-300 font-mono">{user.character.current_xp.toLocaleString()} / {user.character.xp_required_for_next_level.toLocaleString()}</span>
            </div>
            <div className="flex justify-between col-span-2">
              <span className="text-ink-faint">STREAK</span>
              <span className="text-amber-400 font-bold">{user.character.current_streak_days} days</span>
            </div>
          </div>
        </div>
      )}

      {/* ── CHAT MESSAGES & TODAY'S QUESTS ─────────────────────── */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-2 overflow-y-auto p-1.5 font-body text-xs min-h-0 scrollbar-thin"
      >
        {messages.length === 0 ? (
          <div className="rounded-lg border border-arc-500/15 bg-arc-950/30 p-2 text-center space-y-1">
            <p className="font-mono text-[9px] text-arc-300">&quot;How can I assist you, Hunter?&quot;</p>
            <p className="font-mono text-[8px] text-ink-faint">&quot;What are my quests today?&quot;</p>
          </div>
        ) : (
          messages.map((msg) => <ChatMessage key={msg.id} msg={msg} />)
        )}


        {isProcessing && (
          <div className="flex items-center gap-2 text-arc-400 font-mono text-[9px] py-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Processing command...</span>
          </div>
        )}
      </div>

      {/* ── MIC VOICE ORB WITH WAVEFORMS ───────────────────────── */}
      <div className="flex-shrink-0 rounded-lg border border-arc-500/20 bg-arc-950/40 p-2 space-y-1">
        <VoiceOrbWithWaveform active={isListening} onClick={toggleVoiceListening} />

        <form onSubmit={handleFormSubmit} className="flex items-center gap-1.5 pt-1 border-t border-arc-500/15">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your command..."
            disabled={isProcessing}
            className="flex-1 rounded-lg border border-arc-500/20 bg-void/90 px-2.5 py-1 font-mono text-[10px] text-ink-primary placeholder:text-ink-faint focus:border-arc-400 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-arc-600 text-white hover:bg-arc-500 disabled:opacity-30 transition-colors"
          >
            <Send className="h-3 w-3" />
          </button>
        </form>
      </div>

      {/* ── RECENT ACHIEVEMENT ──────────────────────────────────── */}
      <div className="flex-shrink-0">
        <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-1.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-amber-500/25 text-amber-300">
              <Trophy className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-display text-[9px] font-bold text-white truncate">Unstoppable</span>
                <span className="rounded bg-amber-500/30 px-1 font-mono text-[7px] text-amber-300">NEW</span>
              </div>
              <p className="font-mono text-[8px] text-amber-400/90">+500 XP</p>
            </div>
          </div>
          <Link href="/achievements" className="font-mono text-[8px] text-amber-400 hover:underline flex-shrink-0">
            VIEW ALL →
          </Link>
        </div>
      </div>
    </aside>
  );
}
