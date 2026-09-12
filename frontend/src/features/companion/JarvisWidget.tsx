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

/* ── Holographic Soundwave Frequency Core (Aligned with background) ───── */
function JarvisHoloReactor({ active }: { active: boolean }) {
  return (
    <div className="relative flex flex-col items-center justify-center h-20 2xl:h-24 w-full flex-shrink-0 pointer-events-none">
      {active && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="h-16 w-16 rounded-full bg-arc-500/30 animate-ping" />
          <span className="h-20 w-20 rounded-full bg-arc-400/20 animate-pulse" />
        </div>
      )}
    </div>
  );
}

/* ── Chat Message Bubble ─────────────────────────────────────────── */
function ChatMessage({ msg }: { msg: JarvisMessage }) {
  const isUser = msg.role === "user";

  return (
    <div className={cn("flex flex-col animate-fade-in", isUser ? "items-end" : "items-start")}>
      <div className={cn("mb-0.5 flex items-center gap-1.5", isUser && "flex-row-reverse")}>
        <span className="font-mono text-[8px] uppercase tracking-wider text-[#00E5FF] font-bold">
          {isUser ? "You" : "JARVIS 23:02"}
        </span>
        <span className="font-mono text-[8px] text-[#C0BEEF]/70">{msg.timestamp}</span>
      </div>

      <div
        className={cn(
          "rounded-lg px-2.5 py-1.5 max-w-[95%] leading-relaxed text-[10px] font-body",
          isUser
            ? "bg-[#2614DF]/40 border border-[#01C0D7]/40 text-white ml-auto shadow-[0_0_8px_rgba(38,20,223,0.3)]"
            : "bg-[#0C081D]/85 border border-[#4D30EC]/50 text-white shadow-[0_0_10px_rgba(0,0,0,0.8)]"
        )}
      >
        <div className="whitespace-pre-line text-white font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{msg.text}</div>

        {msg.action?.type === "QUEST_MUTATION" && (
          <div className="mt-1 rounded bg-[#01C0D7]/20 border border-[#01C0D7]/40 p-1.5">
            <div className="flex items-center gap-1 font-semibold text-[#00E5FF] text-[8px] mb-0.5">
              <CheckCircle2 className="h-2.5 w-2.5" />
              <span>Quest Target Updated</span>
            </div>
            {msg.action.quest_title && (
              <p className="font-mono text-[7px] text-[#E8EEFF]">
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
    <aside className="relative z-40 hidden h-full w-[270px] xl:w-[285px] flex-shrink-0 flex-col bg-[#03010B] lg:flex overflow-hidden p-2.5 gap-1.5 select-none">
      {/* ── User-Provided Full Holographic Frame Background Image ─────────── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/custom_bg/jarvis_bg.png"
        alt="JARVIS AI Holographic Background"
        className="absolute inset-0 h-full w-full object-fill pointer-events-none opacity-95 z-0"
      />
      {/* ── HEADER ──────────────────────────────────────────────── */}
      <div className="relative z-10 flex h-10 flex-shrink-0 items-center justify-between px-1 pb-1">
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
      <div className="relative z-10">
        <JarvisHoloReactor active={isActive || isProcessing} />
      </div>

      {/* ── CHAT MESSAGE TRANSCRIPT ─────────────────────────────── */}
      <div
        ref={scrollRef}
        className="relative z-10 flex-1 space-y-1.5 overflow-y-auto p-1 font-body text-xs min-h-0 scrollbar-thin"
      >
        {messages.length === 0 ? (
          <div className="rounded-lg bg-[#0C081D]/85 border border-[#4D30EC]/40 p-2.5 text-center space-y-1">
            <p className="font-mono text-[9px] text-[#00E5FF] font-bold">&quot;How can I assist you, Hunter?&quot;</p>
            <p className="font-mono text-[8px] text-[#C0BEEF]/80">&quot;What are my quests today?&quot;</p>
          </div>
        ) : (
          messages.map((msg) => <ChatMessage key={msg.id} msg={msg} />)
        )}

        {isProcessing && (
          <div className="flex items-center gap-1.5 text-[#00E5FF] font-mono text-[8px] py-0.5">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Processing command...</span>
          </div>
        )}
      </div>

      {/* ── SUGGESTED ACTIONS DOCK ───────────────────────────────── */}
      <div className="relative z-10 flex-shrink-0 space-y-1 pt-1">
        <p className="font-mono text-[7px] text-[#00E5FF] uppercase tracking-widest font-bold px-0.5">
          SUGGESTED ACTIONS
        </p>
        <div className="space-y-1">
          {SUGGESTED_ACTIONS.map((action, i) => (
            <button
              key={i}
              onClick={() => handleCommandSubmit(action.cmd)}
              disabled={isProcessing}
              className="flex w-full items-center justify-between rounded-lg bg-[#0C081D]/85 border border-[#2614DF]/40 px-2.5 py-1.5 text-left font-mono text-[8px] text-[#E8EEFF] hover:bg-[#2614DF]/30 hover:border-[#01C0D7]/60 hover:text-white transition-all group disabled:opacity-50 shadow-[0_0_8px_rgba(0,0,0,0.6)]"
            >
              <div className="flex items-center gap-1.5 truncate">
                <action.icon className="h-2.5 w-2.5 text-[#00E5FF] group-hover:text-white flex-shrink-0" />
                <span className="truncate">{action.label}</span>
              </div>
              <ArrowRight className="h-2.5 w-2.5 text-[#00E5FF] group-hover:translate-x-0.5 group-hover:text-white transition-all flex-shrink-0 ml-1" />
            </button>
          ))}
        </div>
      </div>

      {/* ── VOICE MIC BUTTON & INPUT ─────────────────────────────── */}
      <div className="relative z-10 flex-shrink-0 space-y-1.5 pt-1">
        <div className="flex flex-col items-center gap-0.5">
          <button
            type="button"
            onClick={toggleVoiceListening}
            className={cn(
              "relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-all duration-300 shadow-glow-arc-lg",
              isListening
                ? "bg-crimson-500/25 text-crimson-400 shadow-glow-crimson animate-pulse"
                : "bg-gradient-to-br from-[#2614DF] via-[#4D30EC] to-[#01C0D7] text-white hover:scale-105 shadow-[0_0_12px_rgba(0,229,255,0.6)]"
            )}
            title={isListening ? "Stop Listening" : "Tap to speak"}
          >
            <Mic className="h-4 w-4" />
          </button>
          <span className="font-mono text-[7px] text-[#C0BEEF]/80">Tap to speak</span>
        </div>

        <form onSubmit={handleFormSubmit} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your command..."
            disabled={isProcessing}
            className="w-full rounded-lg bg-[#0C081D]/90 border border-[#2614DF]/40 px-2.5 py-1.5 pr-7 font-mono text-[9px] text-white placeholder:text-[#C0BEEF]/50 focus:outline-none focus:border-[#00E5FF] disabled:opacity-50 shadow-[0_0_8px_rgba(0,0,0,0.6)]"
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="absolute right-1 flex h-5 w-5 items-center justify-center rounded bg-[#2614DF] text-white hover:bg-[#00E5FF] hover:text-black disabled:opacity-30 transition-colors"
          >
            <Send className="h-2.5 w-2.5" />
          </button>
        </form>
      </div>

      {/* ── RECENT ACHIEVEMENT CARD ─────────────────────────────── */}
      <div className="relative z-10 flex-shrink-0 pt-0.5">
        <div className="rounded-lg bg-[#0C081D]/85 border border-[#4D30EC]/40 p-1.5 flex items-center justify-between gap-2 shadow-[0_0_10px_rgba(0,0,0,0.6)]">
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
