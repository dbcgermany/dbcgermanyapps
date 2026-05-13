import type { SupabaseClient } from "@supabase/supabase-js";
import { sendTicketEmail } from "@dbc/email";
import { captureServerError } from "@/lib/observe";

/**
 * Generates PDF tickets and emails one to each attendee on the order.
 *
 * Idempotency:
 *   - Per-ticket: each row carries `tickets.email_sent_at`. The loop only
 *     attempts rows where it's NULL (or all rows when forceResend is set).
 *   - Per-order: `orders.email_sent_at` is stamped only after every ticket
 *     has its own stamp. A partial-failure batch leaves order.email_sent_at
 *     NULL so the next caller (Stripe webhook retry, manual resend, cron)
 *     re-enters the loop and only the un-sent rows fire.
 *
 * Designed to be called from the Stripe webhook OR from a free-order code path.
 * Uses a service-role Supabase client (no cookie auth).
 */
export async function sendTicketsForOrder(
  supabase: SupabaseClient,
  orderId: string,
  options: { forceResend?: boolean; overrideEmail?: string } = {}
): Promise<{ sent: number; skipped: number; failed: number }> {
  // Fetch order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, event_id, locale, email_sent_at, status, acquisition_type")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    throw new Error(`Order ${orderId} not found`);
  }

  // Order-level idempotency: order.email_sent_at means "all rows sent".
  // Skip the whole batch if we've already done that, unless forceResend.
  if (order.email_sent_at && !options.forceResend) {
    return { sent: 0, skipped: 0, failed: 0 };
  }

  // Only send for paid/comped orders
  if (order.status !== "paid" && order.status !== "comped") {
    throw new Error(`Order ${orderId} is not paid (status: ${order.status})`);
  }

  // Fetch event
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select(
      "id, title_en, title_de, title_fr, event_type, starts_at, ends_at, venue_name, venue_address, city, timezone"
    )
    .eq("id", order.event_id)
    .single();

  if (eventError || !event) {
    throw new Error(`Event ${order.event_id} not found`);
  }

  // Fetch every ticket on the order — we filter the un-sent ones in code so
  // the per-order summary at the end can count skipped rows.
  const { data: tickets, error: ticketsError } = await supabase
    .from("tickets")
    .select(
      "id, ticket_token, attendee_name, attendee_email, tier_id, pdf_url, email_sent_at"
    )
    .eq("order_id", orderId);

  if (ticketsError || !tickets) {
    throw new Error(`No tickets found for order ${orderId}`);
  }

  // Fetch all tiers in one query
  const tierIds = [...new Set(tickets.map((t) => t.tier_id))];
  const { data: tiers } = await supabase
    .from("ticket_tiers")
    .select("id, name_en, name_de, name_fr")
    .in("id", tierIds);

  const tierMap = new Map((tiers ?? []).map((t) => [t.id, t]));

  // Fetch branding once per batch. Includes the legal/company address +
  // bank details so the invitation letter PDF shows the right "sender"
  // block (DBC Germany UG, Düsseldorf — NOT the event venue) and so the
  // ticket PDF footer can render the company line correctly.
  const { data: companyInfo } = await supabase
    .from("company_info")
    .select(
      `brand_name, legal_name, legal_form, support_email, primary_color, logo_light_url,
       registered_address, registered_postal_code, registered_city, registered_country, phone,
       iban, bic, account_holder, bank_name`
    )
    .eq("id", 1)
    .maybeSingle();

  const locale = (order.locale as "en" | "de" | "fr") ?? "en";
  const eventTitle =
    (event[`title_${locale}` as keyof typeof event] as string) ||
    event.title_en;

  const ticketsBaseUrl =
    process.env.NEXT_PUBLIC_TICKETS_URL ?? "https://tickets.dbc-germany.com";
  const orderUrl = `${ticketsBaseUrl}/${locale}/confirmation/${orderId}`;

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const ticket of tickets) {
    // Per-ticket skip when already sent (and not forcing). The legacy
    // `pdf_url: 'sent:<iso>'` sentinel is also honoured so existing rows
    // from before this column existed don't get duplicates on first run
    // after the migration.
    const alreadySent =
      ticket.email_sent_at != null ||
      (typeof ticket.pdf_url === "string" && ticket.pdf_url.startsWith("sent:"));
    if (alreadySent && !options.forceResend) {
      skipped++;
      continue;
    }

    const tier = tierMap.get(ticket.tier_id);
    const tierName = tier
      ? ((tier[`name_${locale}` as keyof typeof tier] as string) ||
        tier.name_en)
      : "Ticket";

    const legalName = companyInfo
      ? [companyInfo.legal_name, companyInfo.legal_form]
          .filter(Boolean)
          .join(" ")
      : undefined;

    const recipientEmail = options.overrideEmail || ticket.attendee_email;

    try {
      const result = await sendTicketEmail({
        attendeeName: ticket.attendee_name,
        attendeeEmail: recipientEmail,
        eventTitle,
        eventType: event.event_type,
        startsAt: new Date(event.starts_at),
        endsAt: new Date(event.ends_at),
        venueName: event.venue_name ?? "",
        venueAddress: event.venue_address ?? "",
        city: event.city ?? "",
        timezone: event.timezone,
        tierName,
        ticketToken: ticket.ticket_token,
        locale,
        orderUrl,
        brandName: companyInfo?.brand_name ?? undefined,
        legalName,
        legalForm: companyInfo?.legal_form ?? undefined,
        supportEmail: companyInfo?.support_email ?? undefined,
        primaryColor: companyInfo?.primary_color ?? undefined,
        logoUrl: companyInfo?.logo_light_url ?? undefined,
        // Sender block — DBC Germany UG registered address (Düsseldorf), NOT
        // the event venue. Used on the invitation letter PDF.
        senderLine1: companyInfo?.registered_address ?? undefined,
        senderPostalCode: companyInfo?.registered_postal_code ?? undefined,
        senderCity: companyInfo?.registered_city ?? undefined,
        senderCountry: companyInfo?.registered_country ?? undefined,
        senderPhone: companyInfo?.phone ?? undefined,
        // Bank details (footer block on the invitation letter PDF).
        accountHolder: companyInfo?.account_holder ?? undefined,
        iban: companyInfo?.iban ?? undefined,
        bic: companyInfo?.bic ?? undefined,
        bankName: companyInfo?.bank_name ?? undefined,
        isInvitation:
          order.acquisition_type === "invited" ||
          order.acquisition_type === "assigned",
      });

      // Stamp the per-ticket idempotency token + Resend message ID. Both
      // happen in one update so a crash between can't leave them out of
      // sync. `pdf_url` keeps the old "sent:<iso>" sentinel for any code
      // that still reads it, but new code should use email_sent_at.
      const nowIso = new Date().toISOString();
      await supabase
        .from("tickets")
        .update({
          email_sent_at: nowIso,
          pdf_url: `sent:${nowIso}`,
          email_message_id: result?.id ?? null,
        })
        .eq("id", ticket.id);
      sent++;
    } catch (err) {
      failed++;
      captureServerError(err, {
        scope: "send_tickets_for_order",
        data: {
          order_id: orderId,
          ticket_id: ticket.id,
          event_id: order.event_id,
        },
      });
      // ticket.id is enough for forensics; attendee_email kept out of the
      // log to keep Vercel runtime logs PII-clean. (Sentry already gets the
      // structured event via captureServerError above with PII scrubbing.)
      console.error(
        `Failed to send ticket ${ticket.id}:`,
        err instanceof Error ? err.message : err
      );
      // Continue with other tickets — don't fail the whole batch.
    }
  }

  // Stamp order.email_sent_at only when EVERY ticket has its own stamp.
  // A partial-success leaves it NULL so a retry (Stripe webhook redelivery,
  // manual resend, or future cron) can pick up only the un-sent rows.
  if (failed === 0) {
    const { count: stillUnsent } = await supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("order_id", orderId)
      .is("email_sent_at", null);

    if ((stillUnsent ?? 0) === 0) {
      await supabase
        .from("orders")
        .update({ email_sent_at: new Date().toISOString() })
        .eq("id", orderId);
    }
  }

  return { sent, skipped, failed };
}
