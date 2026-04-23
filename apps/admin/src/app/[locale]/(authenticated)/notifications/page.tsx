import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  CheckCircle,
  CreditCard,
  DoorOpen,
  FileText,
  Mail,
  MessageSquare,
  PackageOpen,
  ShoppingCart,
  Ticket,
  Undo2,
  UserPlus,
  CalendarClock,
  type LucideIcon,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import {
  getAllNotifications,
  markReadAction,
  markAllReadAction,
} from "@/actions/notifications";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { notificationHref } from "@/lib/notification-links";
import type { NotificationType } from "@dbc/types";

const TYPE_ICONS: Record<string, LucideIcon> = {
  new_order: ShoppingCart,
  payment_failed: CreditCard,
  tier_sold_out: Ticket,
  low_inventory: PackageOpen,
  refund_issued: Undo2,
  check_in_milestone: CheckCircle,
  waitlist_available: Bell,
  admin_event_reminder: CalendarClock,
  door_sale: DoorOpen,
  transfer: ArrowLeftRight,
  new_application: FileText,
  contact_form_received: MessageSquare,
  newsletter_subscriber: UserPlus,
  daily_digest: BarChart3,
  sequence_sent: Mail,
};

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const notifications = await getAllNotifications();
  const tBack = await getTranslations({ locale, namespace: "admin.back" });

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const t = {
    en: { title: "Notifications", markAll: "Mark all as read", empty: "No notifications yet.", unread: "unread" },
    de: { title: "Benachrichtigungen", markAll: "Alle als gelesen markieren", empty: "Keine Benachrichtigungen.", unread: "ungelesen" },
    fr: { title: "Notifications", markAll: "Tout marquer comme lu", empty: "Aucune notification.", unread: "non lues" },
  }[locale] ?? { title: "Notifications", markAll: "Mark all read", empty: "No notifications", unread: "unread" };

  return (
    <div>
      <PageHeader
        title={t.title}
        description={unreadCount > 0 ? `${unreadCount} ${t.unread}` : undefined}
        back={{ href: `/${locale}/dashboard`, label: tBack("dashboard") }}
        cta={unreadCount > 0 ? (
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
        ) : undefined}
      />

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} message={t.empty} className="mt-12" />
      ) : (
        <div className="mt-6 space-y-2">
          {notifications.map((n) => {
            const Icon = TYPE_ICONS[n.type] ?? Bell;
            const href = notificationHref(
              locale,
              n.type as NotificationType,
              (n as unknown as { data: Record<string, unknown> | null }).data
            );
            return (
              <form
                key={n.id}
                action={async () => {
                  "use server";
                  if (!n.read_at) await markReadAction(n.id, locale);
                  redirect(href);
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
                    <Icon
                      className={`mt-0.5 h-5 w-5 shrink-0 ${
                        n.read_at ? "text-muted-foreground" : "text-primary"
                      }`}
                      strokeWidth={1.75}
                    />
                    <div className="min-w-0 flex-1">
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
            );
          })}
        </div>
      )}
    </div>
  );
}
