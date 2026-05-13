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
  PREVIEW_EVENT,
  PREVIEW_CONTACT,
  PREVIEW_TIER,
  PREVIEW_TICKET,
  PREVIEW_ORDER,
  PREVIEW_URLS,
  PREVIEW_BRAND,
  PREVIEW_LINE_ITEMS,
  PREVIEW_UPCOMING_EVENT,
  PREVIEW_ASK_SPEAKERS,
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
  results: PreviewResult[];
  totalSent: number;
  totalFailed: number;
}

/**
 * Sends every distinct email template to `targetEmail` in the chosen locale,
 * using fixture data only — no production rows are read or written. Gated to
 * super_admin because a misclick on the email field would spam 24 fixture
 * mails. Per-template try/catch so one bad template doesn't kill the run.
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
  const results: PreviewResult[] = [];

  async function run(template: string, fn: () => Promise<unknown>) {
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

  // 1. ticket-delivery (standard, no invitation flag)
  await run("ticket-delivery", () =>
    sendTicketEmail({
      attendeeName: PREVIEW_CONTACT.fullName,
      attendeeEmail: email,
      eventTitle: PREVIEW_EVENT.title,
      eventType: PREVIEW_EVENT.type,
      startsAt: PREVIEW_EVENT.startsAt,
      endsAt: PREVIEW_EVENT.endsAt,
      venueName: PREVIEW_EVENT.venueName,
      venueAddress: PREVIEW_EVENT.venueAddress,
      city: PREVIEW_EVENT.city,
      timezone: PREVIEW_EVENT.timezone,
      tierName: PREVIEW_TIER.name,
      ticketToken: PREVIEW_TICKET.token,
      locale,
      orderUrl: PREVIEW_URLS.orderUrl,
      brandName: PREVIEW_BRAND.brandName,
      legalName: PREVIEW_BRAND.legalName,
      legalForm: PREVIEW_BRAND.legalForm,
      supportEmail: PREVIEW_BRAND.supportEmail,
      primaryColor: PREVIEW_BRAND.primaryColor,
      logoUrl: PREVIEW_BRAND.logoUrl,
    })
  );

  // 2. invitation-email (formal invitation via sendTicketEmail w/ isInvitation)
  await run("invitation-email", () =>
    sendTicketEmail({
      attendeeName: PREVIEW_CONTACT.fullName,
      attendeeEmail: email,
      eventTitle: PREVIEW_EVENT.title,
      eventType: PREVIEW_EVENT.type,
      startsAt: PREVIEW_EVENT.startsAt,
      endsAt: PREVIEW_EVENT.endsAt,
      venueName: PREVIEW_EVENT.venueName,
      venueAddress: PREVIEW_EVENT.venueAddress,
      city: PREVIEW_EVENT.city,
      timezone: PREVIEW_EVENT.timezone,
      tierName: PREVIEW_TIER.name,
      ticketToken: PREVIEW_TICKET.token,
      locale,
      orderUrl: PREVIEW_URLS.orderUrl,
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
      orderShortId: PREVIEW_ORDER.shortId,
      eventTitle: PREVIEW_EVENT.title,
      subtotalFormatted: PREVIEW_ORDER.subtotalFormatted,
      discountFormatted: PREVIEW_ORDER.discountFormatted,
      totalFormatted: PREVIEW_ORDER.totalFormatted,
      paymentMethod: PREVIEW_ORDER.paymentMethod,
      orderUrl: PREVIEW_URLS.orderUrl,
      lineItems: PREVIEW_LINE_ITEMS,
      locale,
    })
  );

  // 4. transfer-confirmation
  await run("transfer-confirmation", () =>
    sendTransferConfirmation({
      to: email,
      recipientName: PREVIEW_CONTACT.fullName,
      previousHolderName: "[PREVIEW] Vanessa Bambi",
      eventTitle: PREVIEW_EVENT.title,
      eventDate: PREVIEW_EVENT.dateLabel,
      eventTime: "17:00 – 23:00",
      venueName: PREVIEW_EVENT.venueName,
      tierName: PREVIEW_TIER.name,
      ticketShortId: PREVIEW_TICKET.shortId,
      orderUrl: PREVIEW_URLS.orderUrl,
      locale,
    })
  );

  // 5. refund-confirmation
  await run("refund-confirmation", () =>
    sendRefundConfirmation({
      to: email,
      recipientName: PREVIEW_CONTACT.fullName,
      eventTitle: PREVIEW_EVENT.title,
      orderShortId: PREVIEW_ORDER.shortId,
      refundAmountFormatted: PREVIEW_ORDER.totalFormatted,
      locale,
    })
  );

  // 6. waitlist-notification
  await run("waitlist-notification", () =>
    sendWaitlistNotification({
      to: email,
      eventTitle: PREVIEW_EVENT.title,
      tierName: PREVIEW_TIER.name,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      checkoutUrl: PREVIEW_URLS.checkoutUrl,
      locale,
    })
  );

  // 7. payment-reminder
  await run("payment-reminder", () =>
    sendPaymentReminder({
      to: email,
      recipientName: PREVIEW_CONTACT.fullName,
      eventTitle: PREVIEW_EVENT.title,
      orderShortId: PREVIEW_ORDER.shortId,
      totalFormatted: PREVIEW_ORDER.totalFormatted,
      orderUrl: PREVIEW_URLS.orderUrl,
      locale,
    })
  );

  // 8. password-reset
  await run("password-reset", () =>
    sendPasswordReset({
      to: email,
      recipientName: PREVIEW_CONTACT.fullName,
      actionLink: PREVIEW_URLS.passwordResetUrl,
      locale,
    })
  );

  // 9. staff-invite
  await run("staff-invite", () =>
    sendStaffInvite({
      to: email,
      recipientName: PREVIEW_CONTACT.fullName,
      role: "admin",
      actionLink: PREVIEW_URLS.staffInviteUrl,
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
      loginUrl: PREVIEW_URLS.loginUrl,
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
      loginUrl: PREVIEW_URLS.loginUrl,
      locale,
      reason: "reset",
    })
  );

  // 12. staff-email-changed (new address — confirmation to new)
  await run("staff-email-changed-new", () =>
    sendStaffEmailChanged({
      to: email,
      recipientName: PREVIEW_CONTACT.fullName,
      oldEmail: "old.preview@dbc-germany.test",
      newEmail: email,
      loginUrl: PREVIEW_URLS.loginUrl,
      locale,
      side: "new",
    })
  );

  // 13. staff-email-changed (old address — warning to old)
  await run("staff-email-changed-old", () =>
    sendStaffEmailChanged({
      to: email,
      recipientName: PREVIEW_CONTACT.fullName,
      oldEmail: email,
      newEmail: "new.preview@dbc-germany.test",
      loginUrl: PREVIEW_URLS.loginUrl,
      locale,
      side: "old",
    })
  );

  // 14. staff-paused (paused)
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
      unsubscribeUrl: PREVIEW_URLS.unsubscribeUrl,
      locale,
      upcomingEvent: PREVIEW_UPCOMING_EVENT,
    })
  );

  // 17. newsletter-confirm
  await run("newsletter-confirm", () =>
    sendNewsletterConfirm({
      to: email,
      confirmUrl: PREVIEW_URLS.confirmUrl,
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
      eventTitle: PREVIEW_EVENT.title,
      eventDateLabel: PREVIEW_EVENT.dateLabel,
      eventCity: PREVIEW_EVENT.city,
      registrationUrl: PREVIEW_URLS.registrationUrl,
      locale,
      kind: "ambassador",
    })
  );

  // 20. chapter-delegate-team-member-invite
  await run("chapter-delegate-team-member-invite", () =>
    sendChapterDelegateInvite({
      to: email,
      recipientName: PREVIEW_CONTACT.fullName,
      eventTitle: PREVIEW_EVENT.title,
      eventDateLabel: PREVIEW_EVENT.dateLabel,
      eventCity: PREVIEW_EVENT.city,
      registrationUrl: PREVIEW_URLS.registrationUrl,
      locale,
      kind: "team_member",
    })
  );

  // 20.a chapter-delegate-outcome (rejected with note)
  await run("chapter-delegate-rejected", () =>
    sendChapterDelegateOutcome({
      to: email,
      recipientName: PREVIEW_CONTACT.fullName,
      eventTitle: PREVIEW_EVENT.title,
      outcome: "rejected",
      note: "[PREVIEW] We couldn't verify your chapter — please contact your Ambassador.",
      locale,
    })
  );

  // 20.b chapter-delegate-outcome (revoked, no note)
  await run("chapter-delegate-revoked", () =>
    sendChapterDelegateOutcome({
      to: email,
      recipientName: PREVIEW_CONTACT.fullName,
      eventTitle: PREVIEW_EVENT.title,
      outcome: "revoked",
      locale,
    })
  );

  // 20.c team-friend-code-redeemed
  await run("team-friend-code-redeemed", () =>
    sendTeamFriendCodeRedeemed({
      to: email,
      recipientName: PREVIEW_CONTACT.fullName,
      eventTitle: PREVIEW_EVENT.title,
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
      eventTitle: PREVIEW_EVENT.title,
      ticketToken: PREVIEW_TICKET.token,
      speakers: PREVIEW_ASK_SPEAKERS,
      locale,
      ticketsBaseUrl: PREVIEW_URLS.ticketsBase,
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
      eventTitle: PREVIEW_EVENT.title,
      eventDate: PREVIEW_EVENT.dateLabel,
      eventTime: "17:00 – 23:00",
      venueName: PREVIEW_EVENT.venueName,
      venueAddress: PREVIEW_EVENT.venueAddress,
      ticketShortId: PREVIEW_TICKET.shortId,
      orderUrl: PREVIEW_URLS.orderUrl,
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
      eventTitle: PREVIEW_EVENT.title,
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
        Order: PREVIEW_ORDER.shortId,
        Amount: PREVIEW_ORDER.totalFormatted,
        Event: PREVIEW_EVENT.title,
      },
      dashboardUrl: PREVIEW_URLS.dashboardUrl,
      severity: "info",
      locale,
    });
  });

  const totalSent = results.filter((r) => r.sent).length;
  const totalFailed = results.length - totalSent;

  // Audit log
  const supabase = await createServerClient();
  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "send_all_email_previews",
    entity_type: "email_templates",
    entity_id: null,
    details: {
      target_email: email,
      locale,
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
      results,
      totalSent,
      totalFailed,
    },
  };
}
