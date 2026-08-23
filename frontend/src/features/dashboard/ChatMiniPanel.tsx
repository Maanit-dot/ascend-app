"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
    if (!inputMessage.trim()) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender_name: user?.display_name || "Hunter",
      message_text: inputMessage.trim(),
      created_at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      is_me: true,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputMessage("");

    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  return (
    <div className="hud-panel p-2.5 h-full flex flex-col justify-between overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <h3 className="font-display text-[11px] font-bold tracking-wider text-white">
            HUNTER CONNECT CHAT
          </h3>
          <span className="flex items-center gap-0.5 rounded bg-crimson-500/15 border border-crimson-500/30 px-1 font-mono text-[7px] text-crimson-400 font-semibold">
            <span className="h-1 w-1 rounded-full bg-crimson-400 animate-pulse" /> LIVE
          </span>
        </div>
        <span className="font-mono text-[7px] text-ink-faint">Group: Shadow Army</span>
      </div>

      {/* Messages List */}
      <div className="flex-1 space-y-1 overflow-y-auto pr-1 my-1 min-h-0 scrollbar-thin">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "rounded border px-1.5 py-0.5 text-[10px]",
              m.is_me
                ? "border-arc-500/25 bg-arc-950/40 text-right ml-3"
                : "border-arc-500/10 bg-void/50 text-left mr-3"
            )}
          >
            <div className="flex items-center justify-between gap-1">
              <span
                className={cn(
                  "font-mono text-[8px] font-bold truncate",
                  m.is_me ? "text-arc-300" : "text-cyan-300"
                )}
              >
                {m.sender_name}
              </span>
              <span className="font-mono text-[7px] text-ink-faint">{m.created_at}</span>
            </div>
            <p className="font-body text-[10px] text-ink-secondary leading-tight">{m.message_text}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input box */}
      <form onSubmit={handleSend} className="relative flex items-center pt-1 border-t border-arc-500/10 flex-shrink-0">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type a message..."
          className="w-full rounded border border-arc-500/20 bg-void/90 px-2 py-1 pr-6 font-body text-[10px] text-ink-primary placeholder:text-ink-faint focus:border-arc-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim()}
          className="absolute right-1 top-2 flex h-4 w-4 items-center justify-center rounded text-arc-400 hover:text-white disabled:opacity-30 transition-colors"
        >
          <Send className="h-2.5 w-2.5" />
        </button>
      </form>
    </div>
  );
}
