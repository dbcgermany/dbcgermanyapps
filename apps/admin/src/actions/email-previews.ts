"use server";

import { requireRole, createServerClient } from "@dbc/supabase/server";
import {
  sendTicketEmail,
  sendOrderReceipt,
  sendTransferConfirmation,
  sendRefundConfirmation,
  sendWaitlistNotification,
  sendPaymentReminder,
  sendPasswordReset,
  sendStaffInvite,
  sendStaffCredentials,
  sendStaffEmailChanged,
  sendStaffPaused,
  sendNewsletterEmail,
  sendNewsletterConfirm,
  sendStaffMessage,
  sendChapterDelegateInvite,
  sendChapterDelegateOutcome,
  sendTeamFriendCodeRedeemed,
  sendAskSpeakersEmail,
  sendContactFormConfirm,
  sendJobApplicationConfirm,
  sendIncubationApplicationConfirm,
  sendPreEventReminder,
  sendAftercareSequence,
  sendAdminAlert,
} from "@dbc/email";
import {
  PREVIEW_CONTACT,
  PREVIEW_TICKET,
  PREVIEW_BRAND,
  PREVIEW_ASK_SPEAKERS,
  buildPreviewEventFixture,
  previewNewsletterBody,
  previewNewsletterSubject,
  previewStaffMessage,
  previewAftercare,
  previewAdminAlert,
} from "@dbc/email";

export type PreviewLocale = "en" | "de" | "fr";

export interface PreviewResult {
  template: string;
  sent: boolean;
  error?: string;
}

export interface SendAllPreviewsResult {
  targetEmail: string;
  locale: PreviewLocale;
  eventSlug: string;
  eventTitle: string;
  results: PreviewResult[];
  totalSent: number;
  totalFailed: number;
}

const TICKETS_BASE_URL =
  process.env.NEXT_PUBLIC_TICKETS_URL ?? "https://tickets.dbc-germany.com";
const ADMIN_BASE_URL =
  process.env.NEXT_PUBLIC_ADMIN_URL ?? "https://admin.dbc-germany.com";
const SITE_BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://dbc-germany.com";

/**
 * Sends every distinct email template to `targetEmail` in the chosen locale.
 * The event fields (slug, title, dates, venue, tier, URLs) come from the
 * next upcoming published event in the database — so previews auto-update
 * for every future event without code changes. No production rows are
 * written; only reads. Gated to super_admin.
 */
export async function sendAllTemplatePreviews(input: {
  targetEmail: string;
  locale: PreviewLocale;
}): Promise<{ success: true; data: SendAllPreviewsResult } | { error: string }> {
  const user = await requireRole("super_admin");

  const email = input.targetEmail.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Invalid email address." };
  }
  if (!["en", "de", "fr"].includes(input.locale)) {
    return { error: "Invalid locale." };
  }

  const locale = input.locale;
  const supabase = await createServerClient();

  // Pick the next upcoming published event (or the most recently ended one
  // if none upcoming). Pull the cheapest public+counts-as-sold tier on that
  // event for tier-named templates.
  const nowIso = new Date().toISOString();
  const { data: upcomingEvent } = await supabase
    .from("events")
    .select(
      "id, slug, title_en, title_de, title_fr, event_type, starts_at, ends_at, city, venue_name, venue_address, timezone"
    )
    .eq("is_published", true)
    .gte("ends_at", nowIso)
    .order("starts_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  let eventRow = upcomingEvent;
  if (!eventRow) {
    const { data: lastEvent } = await supabase
      .from("events")
      .select(
        "id, slug, title_en, title_de, title_fr, event_type, starts_at, ends_at, city, venue_name, venue_address, timezone"
      )
      .eq("is_published", true)
      .order("starts_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    eventRow = lastEvent;
  }
  if (!eventRow) {
    return {
      error:
        "No published event in the database — create at least one event so previews can point at it.",
    };
  }

  const { data: tierRow } = await supabase
    .from("ticket_tiers")
    .select("name_en, name_de, name_fr, price_cents")
    .eq("event_id", eventRow.id)
    .eq("is_public", true)
    .eq("counts_as_sold", true)
    .order("price_cents", { ascending: true })
    .limit(1)
    .maybeSingle();

  // Fall back to a synthetic Standard tier if the event has no public tiers
  // yet (early-config phase). The preview still renders; the fictional price
  // just won't match a real tier on the event.
  const tier = tierRow ?? {
    name_en: "Standard",
    name_de: "Standard",
    name_fr: "Standard",
    price_cents: 9900,
  };

  const fx = buildPreviewEventFixture(eventRow, tier, locale, {
    ticketsBase: TICKETS_BASE_URL,
    adminBase: ADMIN_BASE_URL,
    siteBase: SITE_BASE_URL,
  });

  const results: PreviewResult[] = [];

  // Resend's free-tier rate limit is 5 req/s. With 30 templates fired back
  // to back the last few hit "Too many requests". Sleep 250ms between sends
  // (~4 req/s) to stay safely under the cap. Skip the gap before the first
  // send so the action's wall-clock latency is roughly 30 × 250ms = 7.5s.
  let isFirst = true;

  async function run(template: string, fn: () => Promise<unknown>) {
    if (!isFirst) {
      await new Promise((r) => setTimeout(r, 250));
    }
    isFirst = false;
    try {
      await fn();
      results.push({ template, sent: true });
    } catch (err) {
      results.push({
        template,
        sent: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // 1. ticket-delivery
  await run("ticket-delivery", () =>
    sendTicketEmail({
      attendeeName: PREVIEW_CONTACT.fullName,
      attendeeEmail: email,
      eventTitle: fx.event.title,
      eventType: fx.event.type,
      startsAt: fx.event.startsAt,
      endsAt: fx.event.endsAt,
      venueName: fx.event.venueName,
      venueAddress: fx.event.venueAddress,
      city: fx.event.city,
      timezone: fx.event.timezone,
      tierName: fx.tier.name,
      ticketToken: PREVIEW_TICKET.token,
      locale,
      orderUrl: fx.urls.orderUrl,
      brandName: PREVIEW_BRAND.brandName,
      legalName: PREVIEW_BRAND.legalName,
      legalForm: PREVIEW_BRAND.legalForm,
      supportEmail: PREVIEW_BRAND.supportEmail,
      primaryColor: PREVIEW_BRAND.primaryColor,
      logoUrl: PREVIEW_BRAND.logoUrl,
    })
  );

  // 2. invitation-email (formal)
  await run("invitation-email", () =>
    sendTicketEmail({
      attendeeName: PREVIEW_CONTACT.fullName,
      attendeeEmail: email,
      eventTitle: fx.event.title,
      eventType: fx.event.type,
      startsAt: fx.event.startsAt,
      endsAt: fx.event.endsAt,
      venueName: fx.event.venueName,
      venueAddress: fx.event.venueAddress,
      city: fx.event.city,
      timezone: fx.event.timezone,
      tierName: fx.tier.name,
      ticketToken: PREVIEW_TICKET.token,
      locale,
      orderUrl: fx.urls.orderUrl,
      brandName: PREVIEW_BRAND.brandName,
      legalName: PREVIEW_BRAND.legalName,
      legalForm: PREVIEW_BRAND.legalForm,
      supportEmail: PREVIEW_BRAND.supportEmail,
      primaryColor: PREVIEW_BRAND.primaryColor,
      logoUrl: PREVIEW_BRAND.logoUrl,
      senderLine1: PREVIEW_BRAND.senderLine1,
      senderPostalCode: PREVIEW_BRAND.senderPostalCode,
      senderCity: PREVIEW_BRAND.senderCity,
      senderCountry: PREVIEW_BRAND.senderCountry,
      senderPhone: PREVIEW_BRAND.senderPhone,
      isInvitation: true,
      gender: "female",
      lastName: PREVIEW_CONTACT.lastName,
    })
  );

  // 3. order-receipt
  await run("order-receipt", () =>
    sendOrderReceipt({
      to: email,
      recipientName: PREVIEW_CONTACT.fullName,
      orderShortId: fx.order.shortId,
      eventTitle: fx.event.title,
      subtotalFormatted: fx.order.subtotalFormatted,
      discountFormatted: fx.order.discountFormatted,
      totalFormatted: fx.order.totalFormatted,
      paymentMethod: fx.order.paymentMethod,
      orderUrl: fx.urls.orderUrl,
      lineItems: fx.lineItems,
      locale,
    })
  );

  // 4. transfer-confirmation
  await run("transfer-confirmation", () =>
    sendTransferConfirmation({
      to: email,
      recipientName: PREVIEW_CONTACT.fullName,
      previousHolderName: "[PREVIEW] Vanessa Bambi",
      eventTitle: fx.event.title,
      eventDate: fx.event.dateLabel,
      eventTime: `${fx.event.startsAt.toLocaleTimeString(locale, {
        hour: "2-digit",
        minute: "2-digit",
      })} – ${fx.event.endsAt.toLocaleTimeString(locale, {
        hour: "2-digit",
        minute: "2-digit",
      })}`,
      venueName: fx.event.venueName,
      tierName: fx.tier.name,
      ticketShortId: PREVIEW_TICKET.shortId,
      orderUrl: fx.urls.orderUrl,
      locale,
    })
  );

  // 5. refund-confirmation
  await run("refund-confirmation", () =>
    sendRefundConfirmation({
      to: email,
      recipientName: PREVIEW_CONTACT.fullName,
      eventTitle: fx.event.title,
      orderShortId: fx.order.shortId,
      refundAmountFormatted: fx.order.totalFormatted,
      locale,
    })
  );

  // 6. waitlist-notification
  await run("waitlist-notification", () =>
    sendWaitlistNotification({
      to: email,
      eventTitle: fx.event.title,
      tierName: fx.tier.name,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      checkoutUrl: fx.urls.checkoutUrl,
      locale,
    })
  );

  // 7. payment-reminder
  await run("payment-reminder", () =>
    sendPaymentReminder({
      to: email,
      recipientName: PREVIEW_CONTACT.fullName,
      eventTitle: fx.event.title,
      orderShortId: fx.order.shortId,
      totalFormatted: fx.order.totalFormatted,
      orderUrl: fx.urls.orderUrl,
      locale,
    })
  );

  // 8. password-reset
  await run("password-reset", () =>
    sendPasswordReset({
      to: email,
      recipientName: PREVIEW_CONTACT.fullName,
      actionLink: fx.urls.passwordResetUrl,
      locale,
    })
  );

  // 9. staff-invite
  await run("staff-invite", () =>
    sendStaffInvite({
      to: email,
      recipientName: PREVIEW_CONTACT.fullName,
      role: "admin",
      actionLink: fx.urls.staffInviteUrl,
      locale,
    })
  );

  // 10. staff-credentials (created)
  await run("staff-credentials-created", () =>
    sendStaffCredentials({
      to: email,
      recipientName: PREVIEW_CONTACT.fullName,
      email,
      temporaryPassword: "PreviewTemp2026!",
      loginUrl: fx.urls.loginUrl,
      locale,
      reason: "created",
    })
  );

  // 11. staff-credentials (reset)
  await run("staff-credentials-reset", () =>
    sendStaffCredentials({
      to: email,
      recipientName: PREVIEW_CONTACT.fullName,
      email,
      temporaryPassword: "ResetTemp2026!",
      loginUrl: fx.urls.loginUrl,
      locale,
      reason: "reset",
    })
  );

  // 12. staff-email-changed (new address)
  await run("staff-email-changed-new", () =>
    sendStaffEmailChanged({
      to: email,
      recipientName: PREVIEW_CONTACT.fullName,
      oldEmail: "old.preview@dbc-germany.test",
      newEmail: email,
      loginUrl: fx.urls.loginUrl,
      locale,
      side: "new",
    })
  );

  // 13. staff-email-changed (old address)
  await run("staff-email-changed-old", () =>
    sendStaffEmailChanged({
      to: email,
      recipientName: PREVIEW_CONTACT.fullName,
      oldEmail: email,
      newEmail: "new.preview@dbc-germany.test",
      loginUrl: fx.urls.loginUrl,
      locale,
      side: "old",
    })
  );

  // 14. staff-paused
  await run("staff-paused", () =>
    sendStaffPaused({
      to: email,
      recipientName: PREVIEW_CONTACT.fullName,
      locale,
      state: "paused",
    })
  );

  // 15. staff-unpaused
  await run("staff-unpaused", () =>
    sendStaffPaused({
      to: email,
      recipientName: PREVIEW_CONTACT.fullName,
      locale,
      state: "unpaused",
    })
  );

  // 16. newsletter
  await run("newsletter", () =>
    sendNewsletterEmail({
      to: email,
      subject: previewNewsletterSubject(locale),
      preheader: "[PREVIEW]",
      body: previewNewsletterBody(locale),
      unsubscribeUrl: fx.urls.unsubscribeUrl,
      locale,
      upcomingEvent: fx.upcomingEvent,
    })
  );

  // 17. newsletter-confirm
  await run("newsletter-confirm", () =>
    sendNewsletterConfirm({
      to: email,
      confirmUrl: fx.urls.confirmUrl,
      locale,
    })
  );

  // 18. staff-message
  await run("staff-message", () => {
    const msg = previewStaffMessage(locale);
    return sendStaffMessage({
      to: email,
      subject: msg.subject,
      body: msg.body,
      senderName: "DBC Germany Preview",
      senderEmail: PREVIEW_BRAND.supportEmail,
      locale,
    });
  });

  // 19. chapter-delegate-ambassador-invite
  await run("chapter-delegate-ambassador-invite", () =>
    sendChapterDelegateInvite({
      to: email,
      recipientName: PREVIEW_CONTACT.fullName,
      eventTitle: fx.event.title,
      eventDateLabel: fx.event.dateLabel,
      eventCity: fx.event.city,
      registrationUrl: fx.urls.registrationUrl,
      locale,
      kind: "ambassador",
    })
  );

  // 20. chapter-delegate-team-member-invite
  await run("chapter-delegate-team-member-invite", () =>
    sendChapterDelegateInvite({
      to: email,
      recipientName: PREVIEW_CONTACT.fullName,
      eventTitle: fx.event.title,
      eventDateLabel: fx.event.dateLabel,
      eventCity: fx.event.city,
      registrationUrl: fx.urls.registrationUrl,
      locale,
      kind: "team_member",
    })
  );

  // 20.a chapter-delegate-outcome (rejected)
  await run("chapter-delegate-rejected", () =>
    sendChapterDelegateOutcome({
      to: email,
      recipientName: PREVIEW_CONTACT.fullName,
      eventTitle: fx.event.title,
      outcome: "rejected",
      note: "[PREVIEW] We couldn't verify your chapter — please contact your Ambassador.",
      locale,
    })
  );

  // 20.b chapter-delegate-outcome (revoked)
  await run("chapter-delegate-revoked", () =>
    sendChapterDelegateOutcome({
      to: email,
      recipientName: PREVIEW_CONTACT.fullName,
      eventTitle: fx.event.title,
      outcome: "revoked",
      locale,
    })
  );

  // 20.c team-friend-code-redeemed
  await run("team-friend-code-redeemed", () =>
    sendTeamFriendCodeRedeemed({
      to: email,
      recipientName: PREVIEW_CONTACT.fullName,
      eventTitle: fx.event.title,
      redeemerName: "[PREVIEW] Friend Müller",
      redeemerEmail: "friend.preview@dbc-germany.test",
      codeTail: "X8K2J9",
      locale,
    })
  );

  // 21. ask-speakers
  await run("ask-speakers", () =>
    sendAskSpeakersEmail({
      to: email,
      recipientName: PREVIEW_CONTACT.fullName,
      eventTitle: fx.event.title,
      ticketToken: PREVIEW_TICKET.token,
      speakers: PREVIEW_ASK_SPEAKERS,
      locale,
      ticketsBaseUrl: fx.urls.ticketsBase,
    })
  );

  // 22. contact-form-confirm
  await run("contact-form-confirm", () =>
    sendContactFormConfirm({
      to: email,
      name: PREVIEW_CONTACT.fullName,
      locale,
    })
  );

  // 23. job-application-confirm
  await run("job-application-confirm", () =>
    sendJobApplicationConfirm({
      to: email,
      applicantName: PREVIEW_CONTACT.fullName,
      jobTitle: "[PREVIEW] Community Manager",
      locale,
    })
  );

  // 24. incubation-confirm
  await run("incubation-confirm", () =>
    sendIncubationApplicationConfirm({
      to: email,
      applicantName: PREVIEW_CONTACT.fullName,
      locale,
    })
  );

  // 25. pre-event-reminder
  await run("pre-event-reminder", () =>
    sendPreEventReminder({
      to: email,
      attendeeName: PREVIEW_CONTACT.fullName,
      eventTitle: fx.event.title,
      eventDate: fx.event.dateLabel,
      eventTime: `${fx.event.startsAt.toLocaleTimeString(locale, {
        hour: "2-digit",
        minute: "2-digit",
      })} – ${fx.event.endsAt.toLocaleTimeString(locale, {
        hour: "2-digit",
        minute: "2-digit",
      })}`,
      venueName: fx.event.venueName,
      venueAddress: fx.event.venueAddress,
      ticketShortId: PREVIEW_TICKET.shortId,
      orderUrl: fx.urls.orderUrl,
      locale,
    })
  );

  // 26. aftercare-sequence
  await run("aftercare-sequence", () => {
    const ac = previewAftercare(locale);
    return sendAftercareSequence({
      to: email,
      subject: ac.subject,
      body: ac.body,
      eventTitle: fx.event.title,
      locale,
    });
  });

  // 27. admin-alert
  await run("admin-alert", () => {
    const a = previewAdminAlert(locale);
    return sendAdminAlert({
      to: email,
      subject: a.subject,
      headline: a.headline,
      body: a.body,
      details: {
        Order: fx.order.shortId,
        Amount: fx.order.totalFormatted,
        Event: fx.event.title,
      },
      dashboardUrl: fx.urls.dashboardUrl,
      severity: "info",
      locale,
    });
  });

  const totalSent = results.filter((r) => r.sent).length;
  const totalFailed = results.length - totalSent;

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "send_all_email_previews",
    entity_type: "email_templates",
    entity_id: null,
    details: {
      target_email: email,
      locale,
      event_slug: eventRow.slug,
      event_title: eventRow.title_en,
      total: results.length,
      sent: totalSent,
      failed: totalFailed,
      failures: results
        .filter((r) => !r.sent)
        .map((r) => ({ template: r.template, error: r.error })),
    },
  });

  return {
    success: true,
    data: {
      targetEmail: email,
      locale,
      eventSlug: eventRow.slug,
      eventTitle: eventRow.title_en ?? eventRow.slug,
      results,
      totalSent,
      totalFailed,
    },
  };
}
