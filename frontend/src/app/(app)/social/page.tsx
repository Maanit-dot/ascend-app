"use client";

import { useEffect, useRef, useState } from "react";
import {
  Users,
  Search,
  UserPlus,
  Send,
  Loader2,
  MessageSquare,
  Globe,
  Radio,
  Trash2,
  UserMinus,
  MoreVertical,
  X,
  AlertTriangle,
  Smile,
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

type ConfirmAction = "remove_friend" | "clear_chat" | null;

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

function formatDateLabel(timeStr: string): string {
  try {
    const d = new Date(timeStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

/** Quick emoji picker — a small set of common emojis */
const QUICK_EMOJIS = ["😄", "👍", "🔥", "⚔️", "💪", "🏆", "❤️", "😂", "🎯", "💀", "✅", "🚀"];

/** Confirmation modal overlay */
function ConfirmModal({
  action,
  friendName,
  onConfirm,
  onCancel,
}: {
  action: ConfirmAction;
  friendName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!action) return null;
  const isRemove = action === "remove_friend";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 backdrop-blur-sm">
      <div className="hud-panel-elite mx-4 w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-crimson-500/20 text-crimson-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-sm font-bold text-white">
              {isRemove ? "Remove Friend" : "Clear Chat"}
            </h2>
            <p className="font-mono text-[9px] text-ink-faint">
              {isRemove ? "This action cannot be undone." : "This only clears messages locally."}
            </p>
          </div>
        </div>
        <p className="font-mono text-xs text-ink-secondary">
          {isRemove
            ? `Remove ${friendName} from your Hunter Network? You will lose chat history.`
            : `Clear all messages in your conversation with ${friendName}?`}
        </p>
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-arc-500/30 py-2 font-mono text-xs text-ink-muted hover:border-arc-400 hover:text-white transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-crimson-600 py-2 font-mono text-xs font-bold text-white hover:bg-crimson-500 transition-all"
          >
            {isRemove ? "Remove" : "Clear"}
          </button>
        </div>
      </div>
    </div>
  );
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
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const hasAutoSelected = useRef(false);

  // Load friend list
  const fetchFriends = async () => {
    try {
      const res = await api.get<{ friends: PublicHunterProfile[] }>("/social/friends");
      setFriends(res.friends);
      if (res.friends[0] && !hasAutoSelected.current) {
        hasAutoSelected.current = true;
        setSelectedFriend(res.friends[0]);
      }
    } catch {
      // Silently catch
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
    const interval = setInterval(fetchFriends, 5000);
    return () => clearInterval(interval);
  }, []);

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // WebSocket for real-time messages
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
      } catch {}
    };
    return () => ws.close();
  }, [user, selectedFriend]);

  // Load chat history when selected friend changes
  useEffect(() => {
    if (!selectedFriend) return;
    setMessages([]);
    api
      .get<ChatMessage[]>(`/social/messages/${selectedFriend.id}`)
      .then((history) => setMessages(history))
      .catch(() => setMessages([]));
  }, [selectedFriend]);

  // Scroll chat to bottom on new messages
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
      inputRef.current?.focus();
    } catch {
      // fallback
    } finally {
      setIsSending(false);
    }
  };

  // Remove friend
  const handleRemoveFriend = async () => {
    if (!selectedFriend) return;
    const friendToRemove = selectedFriend;
    setConfirmAction(null);
    setSelectedFriend(null);
    setMessages([]);
    setFriends((prev) => prev.filter((f) => f.id !== friendToRemove.id));
    hasAutoSelected.current = false;
    try {
      await api.post("/social/friends/remove", { friend_id: friendToRemove.id });
      fetchFriends();
    } catch {
      // Failed to remove on backend
    }
  };

  // Clear chat
  const handleClearChat = async () => {
    if (!selectedFriend) return;
    const friendToClear = selectedFriend;
    setConfirmAction(null);
    setMessages([]);
    try {
      await api.post("/social/messages/clear", { friend_id: friendToClear.id });
    } catch {
      // fallback
    }
  };

  // Group messages by date for date separator labels
  const groupedMessages: { dateLabel: string; msgs: ChatMessage[] }[] = [];
  messages.forEach((m) => {
    const label = formatDateLabel(m.created_at);
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.dateLabel === label) {
      last.msgs.push(m);
    } else {
      groupedMessages.push({ dateLabel: label, msgs: [m] });
    }
  });

  return (
    <>
      {/* Confirm modal */}
      <ConfirmModal
        action={confirmAction}
        friendName={selectedFriend?.display_name ?? ""}
        onConfirm={confirmAction === "remove_friend" ? handleRemoveFriend : handleClearChat}
        onCancel={() => setConfirmAction(null)}
      />

      <div className="mx-auto max-w-full space-y-4">
        {/* Header */}
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
            <button onClick={() => setSearchResult(null)} className="text-ink-faint hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Left: Friend List */}
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
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    onClick={() => { setSelectedFriend(friend); setShowMenu(false); }}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-2.5 transition-all cursor-pointer group",
                      selectedFriend?.id === friend.id
                        ? "border-arc-500/50 bg-arc-500/15 shadow-glow-arc-sm"
                        : "border-arc-500/15 bg-panel/40 hover:border-arc-500/30 hover:bg-panel/70"
                    )}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-arc-500/30 bg-void overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={friend.avatar_url || "/hunter_avatar.jpg"}
                          alt={friend.display_name}
                          className="h-full w-full object-cover"
                        />
                      </div>
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
                        {friend.is_online ? "● Online" : "○ Offline"} · Rank {friend.rank}
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

          {/* Right: Profile + Chat */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {selectedFriend ? (
              <>
                {/* Profile Card */}
                <div className="hud-panel p-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-arc-950/40 to-panel/80">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-arc-500/40 bg-void overflow-hidden shadow-glow-arc">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
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
                      <p className={cn("font-mono text-[9px] mt-0.5", selectedFriend.is_online ? "text-emerald-400" : "text-ink-faint")}>
                        {selectedFriend.is_online ? "● ONLINE" : "○ OFFLINE"}
                      </p>
                    </div>
                  </div>
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

                {/* Chat Window */}
                <div className="hud-panel flex flex-col" style={{ height: "calc(100vh - 420px)", minHeight: "340px" }}>
                  {/* Chat Header */}
                  <div className="flex items-center justify-between border-b border-arc-500/20 px-4 py-2.5 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-arc-400" />
                      <span className="font-mono text-xs font-bold text-white">
                        NEURAL CHAT // {selectedFriend.display_name.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="system-label hidden sm:block">E2E Encrypted</span>
                      {/* ⋮ Options Menu */}
                      <div ref={menuRef} className="relative">
                        <button
                          onClick={() => setShowMenu((v) => !v)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-arc-500/20 text-ink-faint hover:text-arc-300 hover:border-arc-400 transition-colors"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </button>
                        {showMenu && (
                          <div className="absolute right-0 top-full mt-1 w-44 rounded-lg border border-arc-500/30 bg-void/95 backdrop-blur-xl shadow-xl z-30 overflow-hidden">
                            <button
                              onClick={() => { setConfirmAction("clear_chat"); setShowMenu(false); }}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 font-mono text-xs text-ink-secondary hover:bg-arc-500/10 hover:text-white transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-arc-400" />
                              Clear Chat
                            </button>
                            <div className="h-px bg-arc-500/15" />
                            <button
                              onClick={() => { setConfirmAction("remove_friend"); setShowMenu(false); }}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 font-mono text-xs text-crimson-400 hover:bg-crimson-500/10 transition-colors"
                            >
                              <UserMinus className="h-3.5 w-3.5" />
                              Remove Friend
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin scrollbar-thumb-arc-900/40 min-h-0"
                  >
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center gap-2">
                        <Radio className="h-8 w-8 text-arc-500/30" />
                        <p className="font-mono text-xs text-ink-muted">No messages yet.</p>
                        <p className="font-mono text-[9px] text-arc-500/50">Send a message to start the conversation.</p>
                      </div>
                    ) : (
                      groupedMessages.map((group) => (
                        <div key={group.dateLabel}>
                          {/* Date separator */}
                          <div className="flex items-center gap-3 my-3">
                            <div className="flex-1 h-px bg-arc-500/15" />
                            <span className="font-mono text-[9px] text-ink-faint px-2">{group.dateLabel}</span>
                            <div className="flex-1 h-px bg-arc-500/15" />
                          </div>

                          <div className="space-y-2">
                            {group.msgs.map((m, idx) => {
                              const isMe = m.sender_id === user?.id;
                              const prevMsg = group.msgs[idx - 1];
                              const isSameAuthor = prevMsg && prevMsg.sender_id === m.sender_id;
                              return (
                                <div
                                  key={m.id}
                                  className={cn("flex items-end gap-2", isMe ? "flex-row-reverse" : "flex-row")}
                                >
                                  {/* Avatar — only show for first message in a run */}
                                  <div className={cn("flex-shrink-0 w-7 h-7", isSameAuthor && "invisible")}>
                                    {!isSameAuthor && (
                                      <div className="h-7 w-7 rounded-full border border-arc-500/30 bg-arc-900 overflow-hidden">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                          src={isMe ? (user?.avatar_url || "/hunter_avatar.jpg") : (selectedFriend.avatar_url || "/hunter_avatar.jpg")}
                                          alt=""
                                          className="h-full w-full object-cover"
                                        />
                                      </div>
                                    )}
                                  </div>

                                  {/* Bubble */}
                                  <div className={cn("flex flex-col", isMe ? "items-end" : "items-start", "max-w-[72%]")}>
                                    {!isSameAuthor && (
                                      <span className="font-mono text-[8px] text-ink-faint mb-1 px-1">
                                        {isMe ? "You" : selectedFriend.display_name} · {formatLocalTime(m.created_at)}
                                      </span>
                                    )}
                                    <div
                                      className={cn(
                                        "px-3.5 py-2 font-body text-sm leading-relaxed break-words",
                                        isMe
                                          ? "rounded-2xl rounded-br-sm bg-gradient-to-br from-arc-600 to-arc-800 text-white shadow-glow-arc-sm"
                                          : "rounded-2xl rounded-bl-sm border border-arc-500/20 bg-arc-950/80 text-ink-primary"
                                      )}
                                    >
                                      {m.message_text}
                                    </div>
                                    {isSameAuthor && (
                                      <span className="font-mono text-[7px] text-ink-faint/50 mt-0.5 px-1">
                                        {formatLocalTime(m.created_at)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Input Bar */}
                  <div className="flex-shrink-0 border-t border-arc-500/20 p-3 space-y-2">
                    {/* Quick emoji row */}
                    {showEmojiPicker && (
                      <div className="flex items-center gap-1.5 flex-wrap pb-1">
                        {QUICK_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setInputMessage((prev) => prev + emoji);
                              inputRef.current?.focus();
                            }}
                            className="text-lg hover:scale-125 transition-transform"
                          >
                            {emoji}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setShowEmojiPicker(false)}
                          className="ml-auto font-mono text-[9px] text-ink-faint hover:text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}

                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                      {/* Emoji toggle */}
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker((v) => !v)}
                        className={cn(
                          "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border transition-colors",
                          showEmojiPicker
                            ? "border-arc-400 bg-arc-500/20 text-arc-300"
                            : "border-arc-500/20 text-ink-faint hover:border-arc-400 hover:text-arc-300"
                        )}
                        title="Emoji"
                      >
                        <Smile className="h-4 w-4" />
                      </button>

                      <input
                        ref={inputRef}
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder={`Message ${selectedFriend.display_name}...`}
                        disabled={isSending}
                        className="flex-1 rounded-xl border border-arc-500/25 bg-void/90 px-4 py-2.5 font-body text-sm text-white placeholder:text-arc-500/40 focus:border-arc-400 focus:outline-none focus:ring-1 focus:ring-arc-500/30 disabled:opacity-50 transition-all"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e as any);
                          }
                        }}
                      />

                      <button
                        type="submit"
                        disabled={!inputMessage.trim() || isSending}
                        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-arc-500 text-white shadow-glow-arc hover:bg-arc-400 disabled:opacity-40 transition-all"
                      >
                        {isSending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </button>
                    </form>
                  </div>
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
    </>
  );
}
