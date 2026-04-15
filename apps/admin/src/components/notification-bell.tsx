"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { createBrowserClient } from "@dbc/supabase";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
}

export function NotificationBell({
  userId,
  locale,
  initialUnreadCount,
  initialNotifications,
}: {
  userId: string;
  locale: string;
  initialUnreadCount: number;
  initialNotifications: Notification[];
}) {
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Realtime subscription
  useEffect(() => {
    const supabase = createBrowserClient();

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications((prev) => [newNotif, ...prev].slice(0, 10));
          setUnreadCount((c) => c + 1);

          // In-app toast — user sees it whether or not the bell is open.
          toast.message(newNotif.title, {
            description: newNotif.body ?? undefined,
            action: {
              label: "View",
              onClick: () => {
                window.location.href = `/${locale}/notifications`;
              },
            },
          });

          // Browser notification API (for backgrounded tabs if granted)
          if (
            typeof window !== "undefined" &&
            "Notification" in window &&
            Notification.permission === "granted" &&
            document.visibilityState !== "visible"
          ) {
            new Notification(newNotif.title, {
              body: newNotif.body ?? undefined,
              icon: "/icon-192.png",
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as Notification;
          setNotifications((prev) => {
            const oldRow = prev.find((n) => n.id === updated.id);
            if (oldRow && !oldRow.read_at && updated.read_at) {
              setUnreadCount((c) => Math.max(0, c - 1));
            }
            return prev.map((n) => (n.id === updated.id ? updated : n));
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, locale]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const t = {
    en: { title: "Notifications", empty: "No notifications yet", viewAll: "View all", markAllRead: "Mark all read" },
    de: { title: "Benachrichtigungen", empty: "Keine Benachrichtigungen", viewAll: "Alle anzeigen", markAllRead: "Alle als gelesen markieren" },
    fr: { title: "Notifications", empty: "Aucune notification", viewAll: "Tout afficher", markAllRead: "Tout marquer comme lu" },
  }[locale] ?? { title: "Notifications", empty: "No notifications", viewAll: "View all", markAllRead: "Mark all read" };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted"
        aria-label={t.title}
      >
        <span className="text-base">&#9993;</span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-border bg-popover shadow-lg z-50">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="font-heading text-sm font-semibold">{t.title}</p>
            <Link
              href={`/${locale}/notifications`}
              className="text-xs text-primary hover:text-primary/80"
              onClick={() => setOpen(false)}
            >
              {t.viewAll}
            </Link>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                {t.empty}
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`border-b border-border px-4 py-3 last:border-0 ${
                    n.read_at ? "" : "bg-primary/5"
                  }`}
                >
                  <p className="text-sm font-medium">{n.title}</p>
                  {n.body && (
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                      {n.body}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(n.created_at).toLocaleTimeString(locale, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
