"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Radio } from "lucide-react";
import { api } from "@/lib/api-client";
import { useUserStore } from "@/store/useUserStore";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  sender_name: string;
  message_text: string;
  created_at: string;
  is_me?: boolean;
}

export function ChatMiniPanel() {
  const user = useUserStore((s) => s.user);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial demo or real chatter feeds
    const initial: ChatMessage[] = [
      {
        id: "1",
        sender_name: "Aryan",
        message_text: "Bro I just hit level 140! 🔥",
        created_at: "10:42 PM",
        is_me: false,
      },
      {
        id: "2",
        sender_name: user?.display_name || "Maanit",
        message_text: "Let's do a raid tonight.",
        created_at: "10:43 PM",
        is_me: true,
      },
      {
        id: "3",
        sender_name: "Rohan",
        message_text: "I'm in!",
        created_at: "10:43 PM",
        is_me: false,
      },
    ];
    setMessages(initial);
  }, [user]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isSending) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender_name: user?.display_name || "Hunter",
      message_text: inputMessage.trim(),
      created_at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      is_me: true,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputMessage("");

    // Scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  return (
    <div className="hud-panel p-3 space-y-2 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-xs font-bold tracking-wider text-ink-primary">
            HUNTER CONNECT CHAT
          </h3>
          <span className="flex items-center gap-1 rounded bg-crimson-500/10 border border-crimson-500/30 px-1.5 py-0.5 font-mono text-[8px] text-crimson-400">
            <span className="h-1.5 w-1.5 rounded-full bg-crimson-400 animate-pulse" /> LIVE
          </span>
        </div>
        <span className="font-mono text-[8px] text-ink-faint">Group: Shadow Army</span>
      </div>

      {/* Messages List */}
      <div className="flex-1 space-y-1.5 overflow-y-auto pr-1 min-h-0 scrollbar-thin">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "rounded-lg border p-1.5 text-xs transition-colors",
              m.is_me
                ? "border-arc-500/25 bg-arc-950/40 text-right ml-4"
                : "border-arc-500/10 bg-void/50 text-left mr-4"
            )}
          >
            <div className="flex items-center justify-between gap-1 mb-0.5">
              <span
                className={cn(
                  "font-mono text-[9px] font-bold",
                  m.is_me ? "text-arc-300" : "text-cyan-300"
                )}
              >
                {m.sender_name}
              </span>
              <span className="font-mono text-[8px] text-ink-faint">{m.created_at}</span>
            </div>
            <p className="font-body text-[11px] text-ink-secondary leading-snug">{m.message_text}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input box */}
      <form onSubmit={handleSend} className="relative flex items-center pt-1 border-t border-arc-500/10">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type a message..."
          className="w-full rounded-lg border border-arc-500/20 bg-void/80 px-2.5 py-1.5 pr-8 font-body text-xs text-ink-primary placeholder:text-ink-faint focus:border-arc-500/50 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim()}
          className="absolute right-1.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-md bg-arc-500/20 text-arc-400 hover:bg-arc-500/30 disabled:opacity-40 transition-colors"
        >
          <Send className="h-3 w-3" />
        </button>
      </form>
    </div>
  );
}
