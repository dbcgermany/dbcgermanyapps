import { sendTicketEmail } from "./send-ticket";
import { computeCateringUrl } from "./catering";

// Loosely-typed supabase client — both consumers already type their own
// clients more strictly; we only need the chainable from()/select()/eq()
// methods here. Avoiding a hard dependency on @supabase/supabase-js keeps
// the email package self-contained.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseLike = any;

/**
 * Generates PDF tickets and emails one to each attendee on the order.
 *
 * Single source of truth for ticket delivery — both the public checkout
 * (Stripe webhook, free-order code path) and the admin manual sales
 * (door + advance) call this. Same email template, same PDF generator,
 * same QR. Only the originating sale flow differs.
 *
 * Idempotency:
 *   - Per-ticket: each row carries `tickets.email_sent_at`. The loop only
 *     attempts rows where it's NULL (or all rows when forceResend is set).
 *   - Per-order: `orders.email_sent_at` is stamped only after every ticket
 *     has its own stamp. A partial-failure batch leaves order.email_sent_at
 *     NULL so the next caller (Stripe webhook retry, manual resend, cron,
 *     admin "Resend") re-enters the loop and only the un-sent rows fire.
 *
 * Observability is left to the caller — pass `onError` to wire your app's
 * Sentry / log scope. Returning `failed` counts lets callers react too.
 */
export async function sendTicketsForOrder(
  supabase: SupabaseLike,
  orderId: string,
  options: {
    forceResend?: boolean;
    overrideEmail?: string;
    onError?: (
      err: unknown,
      ctx: { orderId: string; ticketId: string; eventId: string }
    ) => void;
  } = {}
): Promise<{ sent: number; skipped: number; failed: number }> {
  // Fetch order — contact_id needed so we can resolve role-based catering
  // eligibility (event.catering_eligible_roles ∩ involvement.role) on top of
  // the tier-bundled catering_included flag. total_cents drives the
  // no-payment-required notice on the invitation letter.
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(
      "id, event_id, locale, email_sent_at, status, acquisition_type, contact_id, total_cents"
    )
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

  // Fetch event — catering_enabled + catering_eligible_roles drive the
  // per-ticket catering CTA the template renders downstream.
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select(
      "id, title_en, title_de, title_fr, event_type, starts_at, ends_at, venue_name, venue_address, city, timezone, catering_enabled, catering_eligible_roles"
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

  // Fetch all tiers in one query — includes is_team / purpose so the PDF
  // can render a team-specific badge and the letter can switch to the
  // team-confirmation copy variant.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ticketRows = tickets as any[];
  const tierIds = [...new Set(ticketRows.map((t) => t.tier_id as string))];
  const { data: tiers } = await supabase
    .from("ticket_tiers")
    .select(
      "id, name_en, name_de, name_fr, catering_included, is_team, purpose"
    )
    .in("id", tierIds);

  // Role-based catering eligibility: when the tier itself doesn't bundle
  // catering, the buyer may still qualify via their active involvements
  // (e.g. VIP role, sponsor, chapter_delegate). Pull once per batch.
  const eligibleRoles =
    (event.catering_enabled
      ? ((event.catering_eligible_roles as string[] | null) ?? [])
      : []) ?? [];
  let contactRoles: string[] = [];
  if (
    event.catering_enabled &&
    eligibleRoles.length > 0 &&
    order.contact_id
  ) {
    const { data: involvements } = await supabase
      .from("contact_event_involvements")
      .select("role, status")
      .eq("contact_id", order.contact_id as string)
      .eq("event_id", order.event_id);
    contactRoles = (
      (involvements ?? []) as { role: string; status: string | null }[]
    )
      .filter((i) => i.status === "active" || i.status === null)
      .map((i) => i.role);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tierMap = new Map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((tiers as any[]) ?? []).map((t: any) => [t.id as string, t])
  );

  // Fetch confirmed sponsors once per batch — same snapshot used across
  // every ticket email in this run. Empty array = the Sponsors PDF
  // attachment is suppressed downstream (no empty booklet).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sponsorRows } = await (supabase as any)
    .from("event_sponsors")
    .select(
      "id, company_name, tier, sector, description_en, description_de, description_fr, logo_url, website_url"
    )
    .eq("event_id", order.event_id)
    .in("status", ["confirmed", "active", "completed"])
    .order("sort_order", { ascending: true });
  const sponsors = (sponsorRows ?? []) as Parameters<
    typeof sendTicketEmail
  >[0]["sponsors"];

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

  // Contact identity — gender / title / last_name — drives the formal
  // salutation when an invitation letter fires (door-sale comps land here
  // too via acquisition_type='assigned'). Without this the letter falls
  // back to a name-only greeting which is fine but less formal.
  type ContactRow = {
    gender: string | null;
    title: string | null;
    last_name: string | null;
  };
  let contactIdentity: ContactRow | null = null;
  if (order.contact_id) {
    const { data } = await supabase
      .from("contacts")
      .select("gender, title, last_name")
      .eq("id", order.contact_id as string)
      .maybeSingle();
    contactIdentity = (data ?? null) as ContactRow | null;
  }
  const orderIsInvitation =
    order.acquisition_type === "invited" ||
    order.acquisition_type === "assigned";
  const orderTotalCents = (order.total_cents ?? 0) as number;

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

  for (const ticket of ticketRows) {
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

    const tier = tierMap.get(ticket.tier_id as string);
    const tierName = tier
      ? ((tier[`name_${locale}` as keyof typeof tier] as string) ||
        (tier.name_en as string))
      : "Ticket";

    const cateringUrl =
      computeCateringUrl({
        cateringEnabled: !!event.catering_enabled,
        tierCateringIncluded: !!tier?.catering_included,
        eligibleRoles,
        contactRoles,
        ticketToken: ticket.ticket_token,
        locale,
        ticketsBaseUrl,
      }) ?? undefined;

    const legalName = companyInfo
      ? [companyInfo.legal_name, companyInfo.legal_form]
          .filter(Boolean)
          .join(" ")
      : undefined;

    const recipientEmail = options.overrideEmail || ticket.attendee_email;

    // Transfer surface: only shown if the 7-day cutoff is still in the
    // future. Past that, the transfer page itself shows the blocked screen
    // — no point pointing the buyer at a dead end from the email.
    const cutoffDate = new Date(
      new Date(event.starts_at).getTime() - 7 * 24 * 60 * 60 * 1000
    );
    const transferIsOpen = cutoffDate.getTime() > Date.now();
    const transferUrl = transferIsOpen
      ? `${ticketsBaseUrl}/${locale}/transfer/${ticket.id}`
      : undefined;
    const transferCutoffDate = transferIsOpen
      ? cutoffDate.toLocaleDateString(locale, {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : undefined;

    // Google Wallet button — link points at the per-ticket redirect endpoint
    // which short-circuits with a 503 if the env vars aren't set. We always
    // include the URL when env is configured; rendering condition lives in
    // the email template (`googleWalletUrl` falsy = button hidden).
    const googleWalletUrl =
      process.env.GOOGLE_WALLET_ISSUER_ID &&
      process.env.GOOGLE_WALLET_SERVICE_ACCOUNT &&
      process.env.GOOGLE_WALLET_PRIVATE_KEY
        ? `${ticketsBaseUrl}/api/passes/${ticket.ticket_token}/google`
        : undefined;

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
        senderLine1: companyInfo?.registered_address ?? undefined,
        senderPostalCode: companyInfo?.registered_postal_code ?? undefined,
        senderCity: companyInfo?.registered_city ?? undefined,
        senderCountry: companyInfo?.registered_country ?? undefined,
        senderPhone: companyInfo?.phone ?? undefined,
        accountHolder: companyInfo?.account_holder ?? undefined,
        iban: companyInfo?.iban ?? undefined,
        bic: companyInfo?.bic ?? undefined,
        bankName: companyInfo?.bank_name ?? undefined,
        isInvitation: orderIsInvitation,
        gender: (contactIdentity?.gender as
          | "female"
          | "male"
          | "diverse"
          | null
          | undefined) ?? null,
        title: contactIdentity?.title ?? null,
        lastName: contactIdentity?.last_name ?? null,
        tierIsTeam: !!tier?.is_team,
        tierPurpose: (tier?.purpose as string | null | undefined) ?? null,
        noPaymentRequired: orderIsInvitation && orderTotalCents === 0,
        transferUrl,
        transferCutoffDate,
        // Every paid public-tier ticket also gets the Briefing Pack.
        // (Invitations skip it inside sendTicketEmail by themselves.)
        includeBriefingPack: true,
        // Confirmed sponsors snapshot for this event — empty array means
        // sendTicketEmail will suppress the Sponsors PDF attachment.
        sponsors,
        googleWalletUrl,
        cateringUrl,
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
      options.onError?.(err, {
        orderId,
        ticketId: ticket.id,
        eventId: order.event_id,
      });
      console.error(
        `Failed to send ticket ${ticket.id}:`,
        err instanceof Error ? err.message : err
      );
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
