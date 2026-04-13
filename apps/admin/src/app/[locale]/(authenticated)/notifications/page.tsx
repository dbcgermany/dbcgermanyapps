import {
  getAllNotifications,
  markReadAction,
  markAllReadAction,
} from "@/actions/notifications";

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const notifications = await getAllNotifications();

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const t = {
    en: { title: "Notifications", markAll: "Mark all as read", empty: "No notifications yet.", unread: "unread" },
    de: { title: "Benachrichtigungen", markAll: "Alle als gelesen markieren", empty: "Keine Benachrichtigungen.", unread: "ungelesen" },
    fr: { title: "Notifications", markAll: "Tout marquer comme lu", empty: "Aucune notification.", unread: "non lues" },
  }[locale] ?? { title: "Notifications", markAll: "Mark all read", empty: "No notifications", unread: "unread" };

  const typeIcons: Record<string, string> = {
    new_order: "\u{1F4B5}",
    tier_sold_out: "\u{1F3AB}",
    refund_issued: "\u21A9",
    check_in_milestone: "\u2713",
    waitlist_available: "\u{1F514}",
    door_sale: "\u{1F6AA}",
    transfer: "\u21C4",
    sequence_sent: "\u2709",
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">{t.title}</h1>
          {unreadCount > 0 && (
            <p className="mt-1 text-sm text-muted-foreground">
              {unreadCount} {t.unread}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <form
            action={async () => {
              "use server";
              await markAllReadAction(locale);
            }}
          >
            <button
              type="submit"
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              {t.markAll}
            </button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="mt-12 rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
          {t.empty}
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {notifications.map((n) => (
            <form
              key={n.id}
              action={async () => {
                "use server";
                if (!n.read_at) await markReadAction(n.id, locale);
              }}
              className="block"
            >
              <button
                type="submit"
                className={`w-full rounded-lg border p-4 text-left transition-colors ${
                  n.read_at
                    ? "border-border hover:bg-muted/30"
                    : "border-primary/30 bg-primary/5 hover:bg-primary/10"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">{typeIcons[n.type] ?? "\u2022"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{n.title}</p>
                    {n.body && (
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {n.body}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(n.created_at).toLocaleString(locale, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {!n.read_at && (
                    <span
                      className="h-2 w-2 shrink-0 rounded-full bg-primary"
                      aria-label="Unread"
                    />
                  )}
                </div>
              </button>
            </form>
          ))}
        </div>
      )}
    </div>
  );
}
