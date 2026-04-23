import type { NotificationType } from "@dbc/types";

type NotificationData = Record<string, unknown>;

// Resolves a notification (type + data payload) to the admin URL the
// operator should land on when they click the bell item. Everything
// routes locale-first. Missing IDs degrade to the index page for that
// entity so the click is never a dead end.
export function notificationHref(
  locale: string,
  type: NotificationType,
  data: NotificationData | null | undefined
): string {
  const d = (data ?? {}) as Record<string, unknown>;
  const base = `/${locale}`;
  const str = (key: string): string | undefined => {
    const v = d[key];
    return typeof v === "string" && v.length > 0 ? v : undefined;
  };
  const orderId = str("order_id");
  const eventId = str("event_id");
  const eventSlug = str("event_slug");
  const tierId = str("tier_id");
  const applicationId = str("application_id");
  const contactId = str("contact_id");

  switch (type) {
    case "new_order":
    case "payment_failed":
    case "refund_issued":
    case "door_sale":
      return orderId ? `${base}/orders/${orderId}` : `${base}/orders`;
    case "tier_sold_out":
    case "low_inventory":
      return eventId
        ? `${base}/events/${eventId}/tiers${tierId ? `#${tierId}` : ""}`
        : `${base}/events`;
    case "new_application":
      return applicationId
        ? `${base}/applications/${applicationId}`
        : `${base}/applications`;
    case "contact_form_received":
      return contactId ? `${base}/contacts/${contactId}` : `${base}/contacts`;
    case "newsletter_subscriber":
      return `${base}/newsletters`;
    case "check_in_milestone":
      return eventId ? `${base}/events/${eventId}/live` : `${base}/events`;
    case "waitlist_available":
      return eventId
        ? `${base}/events/${eventId}/attendees`
        : `${base}/events`;
    case "admin_event_reminder":
      return eventId
        ? `${base}/events/${eventId}`
        : eventSlug
          ? `${base}/events`
          : `${base}/events`;
    case "transfer":
      return eventId
        ? `${base}/events/${eventId}/attendees`
        : `${base}/events`;
    case "daily_digest":
      return `${base}/reports`;
  }
}
