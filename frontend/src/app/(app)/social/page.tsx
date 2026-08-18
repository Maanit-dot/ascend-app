"use client";

import { useEffect, useRef, useState } from "react";
import {
  Users,
  Search,
  UserPlus,
  Send,
  Shield,
  Zap,
  Flame,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Globe,
  Radio,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { useUserStore } from "@/store/useUserStore";
import { cn } from "@/lib/utils";

interface PublicHunterProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  level: number;
  rank: string;
  title: string;
  current_streak_days: number;
  total_xp_earned: number;
  is_online: boolean;
}

interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message_text: string;
  created_at: string;
  is_read: boolean;
}

function formatLocalTime(timeStr: string) {
  if (!timeStr) return "";
  try {
    const d = new Date(timeStr);
    if (isNaN(d.getTime())) return timeStr;
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return timeStr;
  }
}

export default function HunterNetworkPage() {
  const user = useUserStore((s) => s.user);
  const [friends, setFriends] = useState<PublicHunterProfile[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<PublicHunterProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Load friend list
  const fetchFriends = async () => {
    try {
      const res = await api.get<{ friends: PublicHunterProfile[] }>("/social/friends");
      setFriends(res.friends);
      if (res.friends[0] && !selectedFriend) {
        setSelectedFriend(res.friends[0]);
      }
    } catch {
      // Silently catch if unauthenticated or error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
    const interval = setInterval(fetchFriends, 5000);
    return () => clearInterval(interval);
  }, []);

  // Connect WebSocket for real-time messages & presence
  useEffect(() => {
    if (!user) return;
    const wsUrl = process.env.NEXT_PUBLIC_API_URL
      ? process.env.NEXT_PUBLIC_API_URL.replace("http", "ws") + `/social/ws/${user.id}`
      : `ws://localhost:8000/api/v1/social/ws/${user.id}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.sender_id && selectedFriend && data.sender_id === selectedFriend.id) {
          setMessages((prev) => [...prev, data]);
        }
      } catch {
        // Ignore invalid message format
      }
    };

    return () => {
      ws.close();
    };
  }, [user, selectedFriend]);

  // Load chat history when selected friend changes
  useEffect(() => {
    if (!selectedFriend) return;
    api
      .get<ChatMessage[]>(`/social/messages/${selectedFriend.id}`)
      .then((history) => setMessages(history))
      .catch(() => setMessages([]));
  }, [selectedFriend]);

  // Scroll chat to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  // Send friend request
  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const res = await api.post<{ message: string }>("/social/friends/request", {
        display_name_or_email: searchQuery.trim(),
      });
      setSearchResult(res.message);
      setSearchQuery("");
      fetchFriends();
    } catch (err: any) {
      setSearchResult(err?.response?.data?.detail || "Could not find Hunter.");
    }
  };

  // Send chat message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFriend || !inputMessage.trim() || isSending) return;
    setIsSending(true);

    try {
      const sentMsg = await api.post<ChatMessage>("/social/messages/send", {
        receiver_id: selectedFriend.id,
        message_text: inputMessage.trim(),
      });
      setMessages((prev) => [...prev, sentMsg]);
      setInputMessage("");
    } catch {
      // Chat fallback
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-full space-y-4">
      {/* Header Banner */}
      <div className="hud-panel p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-arc-400" />
            <h1 className="font-display text-lg font-bold tracking-[0.2em] text-white">HUNTER NETWORK</h1>
            <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[9px] text-emerald-400">
              ● REALTIME MATRIX
            </span>
          </div>
          <p className="font-mono text-[10px] text-arc-400/70 mt-1">
            Connect with fellow Hunters, inspect progress ranks, and coordinate squad operations.
          </p>
        </div>

        {/* Search / Add Friend Form */}
        <form onSubmit={handleAddFriend} className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-arc-500/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Hunter name or email..."
              className="w-full rounded-lg border border-arc-500/25 bg-void/80 pl-8 pr-3 py-1.5 font-mono text-xs text-white placeholder:text-arc-500/40 focus:border-arc-400 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-1 rounded-lg bg-arc-500 px-3 py-1.5 font-mono text-xs font-semibold text-white shadow-glow-arc hover:bg-arc-400 transition-all whitespace-nowrap"
          >
            <UserPlus className="h-3.5 w-3.5" /> Connect
          </button>
        </form>
      </div>

      {searchResult && (
        <div className="hud-panel p-3 border-emerald-500/30 bg-emerald-950/20 text-emerald-300 font-mono text-xs flex items-center justify-between">
          <span>{searchResult}</span>
          <button onClick={() => setSearchResult(null)} className="text-ink-faint hover:text-white">✕</button>
        </div>
      )}

      {/* Main Grid: Hunter List (Left) + Profile & Chat Window (Right) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left Column: Connected Hunters List */}
        <div className="hud-panel p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-arc-500/15 pb-2">
            <h2 className="font-display text-xs font-bold tracking-wider text-ink-primary">CONNECTED HUNTERS</h2>
            <span className="system-label">{friends.length} Active</span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-arc-400" />
            </div>
          ) : friends.length > 0 ? (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  onClick={() => setSelectedFriend(friend)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-2.5 transition-all cursor-pointer",
                    selectedFriend?.id === friend.id
                      ? "border-arc-500/50 bg-arc-500/15 shadow-glow-arc-sm"
                      : "border-arc-500/15 bg-panel/40 hover:border-arc-500/30 hover:bg-panel/70"
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-arc-500/30 bg-void overflow-hidden">
                      <img
                        src={friend.avatar_url || "/hunter_avatar.jpg"}
                        alt={friend.display_name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    {/* Status badge */}
                    <span
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-void",
                        friend.is_online ? "bg-emerald-500" : "bg-ink-faint"
                      )}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-display text-xs font-bold text-white truncate">{friend.display_name}</p>
                      <span className="font-mono text-[9px] text-arc-400 font-semibold">Lvl {friend.level}</span>
                    </div>
                    <p className="font-mono text-[9px] text-arc-400/70 truncate">
                      Rank {friend.rank} • {friend.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
              <Globe className="h-8 w-8 text-arc-500/30" />
              <p className="font-mono text-xs text-ink-muted">No Hunters connected yet.</p>
              <p className="font-mono text-[9px] text-arc-500/50">Enter a display name above to add a friend.</p>
            </div>
          )}
        </div>

        {/* Right Column: Public Profile & Chat Box */}
        <div className="lg:col-span-2 space-y-4">
          {selectedFriend ? (
            <>
              {/* Selected Hunter Public Profile Card */}
              <div className="hud-panel p-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-arc-950/40 to-panel/80">
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-arc-500/40 bg-void overflow-hidden shadow-glow-arc">
                      <img
                        src={selectedFriend.avatar_url || "/hunter_avatar.jpg"}
                        alt={selectedFriend.display_name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <span
                      className={cn(
                        "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-void",
                        selectedFriend.is_online ? "bg-emerald-500" : "bg-ink-faint"
                      )}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-base font-bold text-white">{selectedFriend.display_name}</h3>
                      <span className="rounded border border-arc-500/30 bg-arc-500/10 px-1.5 py-0.5 font-mono text-[9px] text-arc-300">
                        Rank {selectedFriend.rank}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-arc-400 mt-0.5">The {selectedFriend.title}</p>
                    <p className="font-mono text-[9px] text-emerald-400 mt-0.5">
                      {selectedFriend.is_online ? "● ONLINE" : "○ OFFLINE"}
                    </p>
                  </div>
                </div>

                {/* Profile Stats Cluster */}
                <div className="grid grid-cols-3 gap-3 text-center border-t sm:border-t-0 sm:border-l border-arc-500/20 pt-3 sm:pt-0 sm:pl-4">
                  <div>
                    <span className="system-label">Level</span>
                    <p className="font-display text-lg font-bold text-arc-400">{selectedFriend.level}</p>
                  </div>
                  <div>
                    <span className="system-label">Streak</span>
                    <p className="font-display text-lg font-bold text-amber-400">{selectedFriend.current_streak_days}d</p>
                  </div>
                  <div>
                    <span className="system-label">Total XP</span>
                    <p className="font-display text-lg font-bold text-cyan-400">{selectedFriend.total_xp_earned.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Chat Terminal Window */}
              <div className="hud-panel flex flex-col h-[400px]">
                <div className="flex items-center justify-between border-b border-arc-500/20 px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-arc-400" />
                    <span className="font-mono text-xs font-bold text-white">
                      NEURAL CHAT // {selectedFriend.display_name.toUpperCase()}
                    </span>
                  </div>
                  <span className="system-label">Encrypted</span>
                </div>

                {/* Message History Container */}
                <div
                  ref={scrollRef}
                  className="flex-1 space-y-3 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-arc-900/40"
                >
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center gap-2">
                      <Radio className="h-8 w-8 text-arc-500/30" />
                      <p className="font-mono text-xs text-ink-muted">No message logs yet.</p>
                      <p className="font-mono text-[9px] text-arc-500/50">Send a message to initiate communication.</p>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMe = m.sender_id === user?.id;
                      return (
                        <div key={m.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                          <div className="mb-1 flex items-center gap-1.5 font-mono text-[8px] text-arc-500/50">
                            <span>{isMe ? "You" : selectedFriend.display_name}</span>
                            <span>•</span>
                            <span>{formatLocalTime(m.created_at)}</span>
                          </div>
                          <div
                            className={cn(
                              "max-w-[80%] rounded-xl px-3 py-2 font-mono text-xs leading-relaxed",
                              isMe
                                ? "rounded-br-sm bg-gradient-to-br from-arc-700 to-arc-900 text-white shadow-glow-arc-sm"
                                : "rounded-bl-sm border border-arc-500/20 bg-arc-950/70 text-ink-secondary"
                            )}
                          >
                            {m.message_text}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Input Bar */}
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 border-t border-arc-500/20 p-3">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={`Message ${selectedFriend.display_name}...`}
                    disabled={isSending}
                    className="flex-1 rounded-lg border border-arc-500/25 bg-void/90 px-3 py-2 font-mono text-xs text-white placeholder:text-arc-500/40 focus:border-arc-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || isSending}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-arc-500 text-white shadow-glow-arc hover:bg-arc-400 disabled:opacity-40 transition-all"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="hud-panel flex flex-col items-center justify-center py-20 text-center gap-3">
              <Users className="h-10 w-10 text-arc-500/40" />
              <p className="font-display text-sm font-bold text-white">Select a Hunter to Open Communication</p>
              <p className="font-mono text-xs text-ink-muted">Choose a connected Hunter from the list on the left.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
