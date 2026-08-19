"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { notificationApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { AppNotification, NotificationType } from "@/types";

const TYPE_DOT: Record<NotificationType, string> = {
  quest_reminder: "bg-arc-400",
  level_up: "bg-amber-400",
  boss_update: "bg-crimson-400",
  achievement_unlock: "bg-amber-400",
  ai_message: "bg-cyan-400",
  burnout_warning: "bg-crimson-500",
  social_message: "bg-purple-400",
  system: "bg-ink-faint",
};

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    const fetchNotifications = () => {
      notificationApi.list().then(setNotifications).catch(() => {});
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleOpen() {
    setIsOpen((v) => !v);
    if (!isOpen) {
      setIsLoading(true);
      const fresh = await notificationApi.list();
      setNotifications(fresh);
      setIsLoading(false);
    }
  }

  async function handleMarkAllRead() {
    await notificationApi.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  async function handleItemClick(notification: AppNotification) {
    if (!notification.is_read) {
      await notificationApi.markRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
      );
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={handleOpen}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-panel-border bg-panel/60 text-ink-muted transition-colors hover:text-ink-primary"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-crimson-500 px-1 font-mono text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="glass-panel-raised absolute right-0 top-11 z-50 max-h-96 w-80 overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-panel-border px-4 py-3">
              <h3 className="font-body text-sm font-semibold text-ink-primary">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="font-body text-xs text-arc-400 hover:text-arc-300"
                >
                  Mark all read
                </button>
              )}
            </div>

            {isLoading ? (
              <p className="p-4 text-center font-body text-xs text-ink-muted">Loading...</p>
            ) : notifications.length === 0 ? (
              <p className="p-6 text-center font-body text-xs text-ink-muted">
                No notifications yet.
              </p>
            ) : (
              <ul>
                {notifications.map((n) => (
                  <li key={n.id}>
                    <button
                      onClick={() => handleItemClick(n)}
                      className={cn(
                        "flex w-full items-start gap-2.5 border-b border-panel-border/60 px-4 py-3 text-left transition-colors hover:bg-white/[0.03]",
                        !n.is_read && "bg-arc-500/[0.04]"
                      )}
                    >
                      <span className={cn("mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full", TYPE_DOT[n.type])} />
                      <div className="min-w-0 flex-1">
                        <p className="font-body text-xs font-semibold text-ink-primary">{n.title}</p>
                        <p className="mt-0.5 line-clamp-2 font-body text-xs text-ink-muted">{n.body}</p>
                        <p className="hud-label mt-1 text-ink-faint">
                          {formatDistanceToNow(parseISO(n.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
