import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createServerClient } from "@dbc/supabase/server";
import { TransferForm } from "./transfer-form";

export default async function TransferPage({
  params,
}: {
  params: Promise<{ locale: string; ticketId: string }>;
}) {
  const { locale, ticketId } = await params;
  const supabase = await createServerClient();
  const tTransfer = await getTranslations({
    locale,
    namespace: "tickets.transfer",
  });
  const t = await getTranslations({
    locale,
    namespace: "tickets.transfer.page",
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth?redirect=/${locale}/transfer/${ticketId}`);
  }

  // Fetch ticket + verify ownership + load event details
  const { data: ticket } = await supabase
    .from("tickets")
    .select(
      "id, attendee_name, attendee_email, checked_in_at, is_transferred, tier_id, event_id, order_id"
    )
    .eq("id", ticketId)
    .single();

  if (!ticket) notFound();

  // Verify ownership
  const { data: order } = await supabase
    .from("orders")
    .select("buyer_id")
    .eq("id", ticket.order_id)
    .single();

  if (!order || order.buyer_id !== user.id) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-heading text-2xl font-bold">
          {tTransfer("notAuthorized")}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {tTransfer("notAuthorizedDescription")}
        </p>
      </main>
    );
  }

  // Fetch event + tier for display
  const [{ data: event }, { data: tier }] = await Promise.all([
    supabase
      .from("events")
      .select("title_en, title_de, title_fr, starts_at, ends_at")
      .eq("id", ticket.event_id)
      .single(),
    supabase
      .from("ticket_tiers")
      .select("name_en, name_de, name_fr")
      .eq("id", ticket.tier_id)
      .single(),
  ]);

  const eventEnded = event ? new Date(event.ends_at) < new Date() : false;
  // Transfers must lock 7 days before the event so we have lead time to
  // update wallet passes, catering counts, and the venue security manifest.
  const cutoffMs = event
    ? new Date(event.starts_at).getTime() - 7 * 24 * 60 * 60 * 1000
    : 0;
  const cutoffReached = event ? new Date().getTime() > cutoffMs : false;
  const eventTitle = event
    ? ((event[`title_${locale}` as keyof typeof event] as string) ||
      event.title_en)
    : "";
  const tierName = tier
    ? ((tier[`name_${locale}` as keyof typeof tier] as string) || tier.name_en)
    : "";

  const blocked =
    Boolean(ticket.checked_in_at) || eventEnded || cutoffReached;
  const blockedReason = ticket.checked_in_at
    ? t("blockedCheckedIn")
    : eventEnded
      ? t("blockedEnded")
      : cutoffReached
        ? t("blockedCutoff")
        : null;
  const cutoffDateLabel = event
    ? new Date(cutoffMs).toLocaleDateString(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <main className="mx-auto max-w-lg px-4 py-12">
      <Link
        href={`/${locale}/orders`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; {t("back")}
      </Link>

      <h1 className="mt-4 font-heading text-2xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("description")}</p>

      {event && !blocked && (
        <p className="mt-3 text-sm font-medium text-warning">
          {t("cutoffNotice", { date: cutoffDateLabel })}
        </p>
      )}

      {/* Current ticket card */}
      <div className="mt-6 rounded-lg border border-border p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {t("currentAttendee")}
        </p>
        <p className="mt-1 font-medium">{ticket.attendee_name}</p>
        <p className="text-sm text-muted-foreground">{ticket.attendee_email}</p>
        {eventTitle && (
          <p className="mt-3 text-sm">
            {eventTitle}
            {tierName && (
              <span className="text-muted-foreground"> &middot; {tierName}</span>
            )}
          </p>
        )}
      </div>

      {blocked ? (
        <div className="mt-6 rounded-md bg-danger-soft p-4 text-sm text-danger">
          {blockedReason}
        </div>
      ) : (
        <TransferForm ticketId={ticketId} locale={locale} />
      )}
    </main>
  );
}
