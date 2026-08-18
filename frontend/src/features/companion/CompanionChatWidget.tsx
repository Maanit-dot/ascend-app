"use client";

import { useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { aiApi } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "arc";
  text: string;
}

export function CompanionChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "intro",
      role: "arc",
      text: "I'm ARC. Ask me about your progress, weak subjects, or whether today's load is sustainable.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      const result = await aiApi.companionChat(trimmed);
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "arc", text: result.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "arc", text: "Connection to ARC is unstable — try again shortly." },
      ]);
    } finally {
      setIsSending(false);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      });
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-[80] sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="glass-panel-raised mb-3 flex h-[26rem] w-[22rem] flex-col overflow-hidden shadow-glow-arc"
          >
            <div className="flex items-center gap-2.5 border-b border-panel-border px-4 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-arc-400 to-arc-700 shadow-glow-arc">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-body text-sm font-semibold text-ink-primary">ARC</p>
                <p className="hud-label text-cyan-400">Online</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="ml-auto text-ink-faint hover:text-ink-primary"
                aria-label="Close ARC chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-lg px-3 py-2 font-body text-xs leading-relaxed",
                      msg.role === "user"
                        ? "bg-arc-500 text-white"
                        : "border border-panel-border bg-void/60 text-ink-secondary"
                    )}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isSending && (
                <div className="flex justify-start">
                  <div className="rounded-lg border border-panel-border bg-void/60 px-3 py-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-arc-400" />
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-panel-border p-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask ARC..."
                maxLength={500}
                className="flex-1 rounded-lg border border-panel-border bg-void/60 px-3 py-2 font-body text-xs text-ink-primary placeholder:text-ink-faint focus:border-arc-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || isSending}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-arc-500 text-white transition-colors hover:bg-arc-400 disabled:opacity-40"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen((v) => !v)}
        whileTap={{ scale: 0.95 }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-arc-400 to-arc-700 text-white shadow-glow-arc"
        aria-label="Toggle ARC companion chat"
      >
        {isOpen ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </motion.button>
    </div>
  );
}
