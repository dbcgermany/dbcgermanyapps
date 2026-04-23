"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { createBrowserClient } from "@dbc/supabase";

import { notificationHref } from "@/lib/notification-links";
import type { NotificationType } from "@dbc/types";
import { markOneNotificationRead } from "@/actions/notifications";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
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
          // Action button deep-links to the specific entity when possible
          // so one click on the toast goes straight to the thing.
          const toastHref = notificationHref(
            locale,
            newNotif.type as NotificationType,
            newNotif.data
          );
          toast.message(newNotif.title, {
            description: newNotif.body ?? undefined,
            action: {
              label: "View",
              onClick: () => {
                window.location.href = toastHref;
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
        <Bell className="h-5 w-5" strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span
            aria-label={`${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`}
            className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background"
          />
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
              notifications.map((n) => {
                const href = notificationHref(
                  locale,
                  n.type as NotificationType,
                  n.data
                );
                return (
                  <Link
                    key={n.id}
                    href={href}
                    onClick={() => {
                      if (!n.read_at) {
                        // Optimistic: decrement locally; the Realtime UPDATE
                        // will arrive when the server write lands.
                        setUnreadCount((c) => Math.max(0, c - 1));
                        setNotifications((prev) =>
                          prev.map((row) =>
                            row.id === n.id
                              ? { ...row, read_at: new Date().toISOString() }
                              : row
                          )
                        );
                        markOneNotificationRead(n.id).catch((err) =>
                          console.error("markOneNotificationRead failed:", err)
                        );
                      }
                      setOpen(false);
                    }}
                    className={`block border-b border-border px-4 py-3 last:border-0 transition-colors hover:bg-muted ${
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
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
