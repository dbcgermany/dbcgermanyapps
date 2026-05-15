import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createServerClient } from "@dbc/supabase/server";
import { RecoveryPanel } from "./recovery-panel";

// The confirmation URL contains an order UUID. Without strict referrer policy,
// any external link the buyer clicks from this page would leak that UUID to
// the destination's analytics. `no-referrer` on the page metadata tells the
// browser to omit the Referer header for outbound navigation. Combined with
// the email mask + the noindex below, a leaked share of this URL no longer
// exposes PII to third parties.
export const metadata: Metadata = {
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

// Mask "name@example.com" -> "n***@e***.com" so anyone with the order UUID
// can recognise it's their order without exposing the full PII to a leaked
// link. The full email is only ever in the email itself + admin order
// detail page (auth-gated).
function maskEmail(email: string | null | undefined): string {
  if (!email) return "";
  const at = email.indexOf("@");
  if (at < 1) return email;
  const local = email.slice(0, at);
  const rest = email.slice(at + 1);
  const dot = rest.lastIndexOf(".");
  const domain = dot > 0 ? rest.slice(0, dot) : rest;
  const tld = dot > 0 ? rest.slice(dot) : "";
  const maskLocal = local[0] + "*".repeat(Math.max(2, local.length - 1));
  const maskDomain =
    domain.length <= 1
      ? domain
      : domain[0] + "*".repeat(Math.max(2, domain.length - 1));
  return `${maskLocal}@${maskDomain}${tld}`;
}

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ locale: string; orderId: string }>;
}) {
  const { locale, orderId } = await params;
  const supabase = await createServerClient();
  const t = await getTranslations({
    locale,
    namespace: "tickets.confirmation.page",
  });

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, status, subtotal_cents, discount_cents, total_cents, recipient_name, recipient_email, event_id, created_at, email_sent_at"
    )
    .eq("id", orderId)
    .single();

  if (!order) notFound();

  const { data: event } = await supabase
    .from("events")
    .select("title_en, title_de, title_fr, slug, starts_at, venue_name, city")
    .eq("id", order.event_id)
    .single();

  const { data: tickets } = await supabase
    .from("tickets")
    .select(
      "id, attendee_name, attendee_email, ticket_token, tier_id, email_sent_at"
    )
    .eq("order_id", orderId);

  const titleKey = `title_${locale}` as keyof NonNullable<typeof event>;
  const eventTitle = event
    ? (event[titleKey] as string) || event.title_en
    : "Event";

  const isPaid = order.status === "paid" || order.status === "comped";

  const ticketCountUnsent = (tickets ?? []).filter(
    (x) => !x.email_sent_at
  ).length;
  const recoveryLocale: "en" | "de" | "fr" =
    locale === "de" || locale === "fr" ? locale : "en";

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      {/* Status header */}
      <div className="text-center">
        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl ${
            isPaid
              ? "bg-success-soft"
              : "bg-warning-soft"
          }`}
        >
          {isPaid ? "\u2713" : "\u23F3"}
        </div>
        <h1 className="mt-4 font-heading text-3xl font-bold">
          {isPaid ? t("confirmed") : t("pending")}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {isPaid ? t("subtitle") : t("pendingSubtitle")}
        </p>
      </div>

      {/* Order details */}
      <div className="mt-10 rounded-xl border border-border p-6 space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("orderNumber")}</span>
          <span className="font-mono">{orderId.slice(0, 8).toUpperCase()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("event")}</span>
          <span className="font-medium">{eventTitle}</span>
        </div>
        {event && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("date")}</span>
            <span>
              {new Date(event.starts_at).toLocaleDateString(locale, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("tickets")}</span>
          <span>{tickets?.length ?? 0}</span>
        </div>
        {(order.discount_cents ?? 0) > 0 ? (
          <>
            <div className="border-t border-border pt-3 flex justify-between text-sm text-muted-foreground">
              <span>
                {locale === "de"
                  ? "Zwischensumme"
                  : locale === "fr"
                    ? "Sous-total"
                    : "Subtotal"}
              </span>
              <span>{`\u20AC${((order.subtotal_cents ?? 0) / 100).toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between text-sm text-success">
              <span>
                {locale === "de"
                  ? "Rabatt"
                  : locale === "fr"
                    ? "R\u00E9duction"
                    : "Discount"}
              </span>
              <span>{`\u2212\u20AC${(order.discount_cents / 100).toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>{t("total")}</span>
              <span>
                {order.total_cents === 0
                  ? locale === "de"
                    ? "Kostenlos"
                    : locale === "fr"
                      ? "Gratuit"
                      : "Free"
                  : `\u20AC${(order.total_cents / 100).toFixed(2)}`}
              </span>
            </div>
          </>
        ) : (
          <div className="border-t border-border pt-3 flex justify-between font-medium">
            <span>{t("total")}</span>
            <span>
              {order.total_cents === 0
                ? locale === "de"
                  ? "Kostenlos"
                  : locale === "fr"
                    ? "Gratuit"
                    : "Free"
                : `\u20AC${(order.total_cents / 100).toFixed(2)}`}
            </span>
          </div>
        )}
      </div>

      {/* Recovery panel — visible whenever any ticket is unsent OR the
          buyer wants to retry. Hidden until the order is paid (no point
          resending tickets that don't exist yet). */}
      {isPaid && tickets && tickets.length > 0 && (
        <RecoveryPanel
          orderId={orderId}
          orderEmailSentAt={order.email_sent_at}
          ticketCountUnsent={ticketCountUnsent}
          locale={recoveryLocale}
        />
      )}

      {/* Ticket list */}
      {tickets && tickets.length > 0 && (
        <div className="mt-8">
          <h2 className="font-heading text-lg font-semibold">{t("tickets")}</h2>
          <div className="mt-4 space-y-3">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-center justify-between rounded-lg border border-border p-4"
              >
                <div>
                  <p className="font-medium">{ticket.attendee_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {maskEmail(ticket.attendee_email)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-muted-foreground">
                    {ticket.ticket_token.slice(0, 8).toUpperCase()}
                  </span>
                  {isPaid && (
                    <a
                      href={`/api/tickets/${ticket.ticket_token}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-accent"
                    >
                      {t("downloadPdf")}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10 text-center">
        <Link
          href={`/${locale}`}
          className="text-sm font-medium text-primary hover:text-primary/80"
        >
          &larr; {t("backToEvents")}
        </Link>
      </div>
    </main>
  );
}
