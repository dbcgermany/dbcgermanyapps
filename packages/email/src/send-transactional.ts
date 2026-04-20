import { render } from "@react-email/components";
import React from "react";
import { createEmailClient } from "./client";
import { TransferConfirmationEmail } from "./templates/transfer-confirmation";
import { WaitlistNotificationEmail } from "./templates/waitlist-notification";
import { OrderReceiptEmail } from "./templates/order-receipt";
import { AftercareSequenceEmail } from "./templates/aftercare-sequence";
import { AdminAlertEmail } from "./templates/admin-alert";
import { JobApplicationConfirmEmail } from "./templates/job-application-confirm";
import { IncubationApplicationConfirmEmail } from "./templates/incubation-confirm";
import { RefundConfirmationEmail } from "./templates/refund-confirmation";
import { ContactFormConfirmEmail } from "./templates/contact-form-confirm";
import { PreEventReminderEmail } from "./templates/pre-event-reminder";
import { PasswordResetEmail } from "./templates/password-reset";
import { StaffInviteEmail } from "./templates/staff-invite";

type Locale = "en" | "de" | "fr";

import { fromAddressFor } from "./client";

/**
 * Email-role routing for transactional templates:
 *   - ticket-related (transfer confirmations, order receipts) → `tickets@`
 *   - everything else (waitlist, aftercare, admin alerts)     → `noreply@`
 *
 * The apex-level @dbc-germany.com inboxes (info@, sales@, marketing@, …)
 * stay on Google Workspace — this code never sends from them.
 */
function transactionalFrom() {
  return fromAddressFor("transactional"); // noreply@
}
function ticketsFrom() {
  return fromAddressFor("tickets");
}

export interface SendTransferConfirmationInput {
  to: string;
  recipientName: string;
  previousHolderName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  venueName: string;
  tierName: string;
  ticketShortId: string;
  orderUrl: string;
  locale: Locale;
}

const TRANSFER_SUBJECT = {
  en: "Your ticket for {event} has been transferred",
  de: "Ihr Ticket f\u00FCr {event} wurde \u00FCbertragen",
  fr: "Votre billet pour {event} a \u00E9t\u00E9 transf\u00E9r\u00E9",
};

export async function sendTransferConfirmation(
  input: SendTransferConfirmationInput
) {
  const html = await render(
    React.createElement(TransferConfirmationEmail, {
      recipientName: input.recipientName,
      recipientEmail: input.to,
      previousHolderName: input.previousHolderName,
      eventTitle: input.eventTitle,
      eventDate: input.eventDate,
      eventTime: input.eventTime,
      venueName: input.venueName,
      tierName: input.tierName,
      ticketShortId: input.ticketShortId,
      orderUrl: input.orderUrl,
      locale: input.locale,
    })
  );
  const subject = TRANSFER_SUBJECT[input.locale].replace(
    "{event}",
    input.eventTitle
  );
  const resend = createEmailClient();
  const res = await resend.emails.send({
    from: ticketsFrom(),
    to: input.to,
    subject,
    html,
  });
  if (res.error) throw new Error(`Resend: ${res.error.message}`);
  return { id: res.data?.id ?? "" };
}

export interface SendWaitlistNotificationInput {
  to: string;
  eventTitle: string;
  tierName: string;
  expiresAt: string;
  checkoutUrl: string;
  locale: Locale;
}

const WAITLIST_SUBJECT = {
  en: "A ticket just opened up for {event}",
  de: "Ein Ticket f\u00FCr {event} ist freigeworden",
  fr: "Un billet vient de se lib\u00E9rer pour {event}",
};

export async function sendWaitlistNotification(
  input: SendWaitlistNotificationInput
) {
  const html = await render(
    React.createElement(WaitlistNotificationEmail, {
      recipientEmail: input.to,
      eventTitle: input.eventTitle,
      tierName: input.tierName,
      expiresAt: input.expiresAt,
      checkoutUrl: input.checkoutUrl,
      locale: input.locale,
    })
  );
  const subject = WAITLIST_SUBJECT[input.locale].replace(
    "{event}",
    input.eventTitle
  );
  const resend = createEmailClient();
  const res = await resend.emails.send({
    from: transactionalFrom(),
    to: input.to,
    subject,
    html,
  });
  if (res.error) throw new Error(`Resend: ${res.error.message}`);
  return { id: res.data?.id ?? "" };
}

export interface SendOrderReceiptInput {
  to: string;
  recipientName: string;
  orderShortId: string;
  eventTitle: string;
  subtotalFormatted: string;
  discountFormatted: string | null;
  totalFormatted: string;
  paymentMethod: string | null;
  orderUrl: string;
  lineItems: Array<{ description: string; amount: string }>;
  locale: Locale;
}

const RECEIPT_SUBJECT = {
  en: "Receipt for your {event} order",
  de: "Quittung f\u00FCr Ihre Bestellung \u2013 {event}",
  fr: "Re\u00E7u pour votre commande \u2013 {event}",
};

export async function sendOrderReceipt(input: SendOrderReceiptInput) {
  const html = await render(
    React.createElement(OrderReceiptEmail, {
      recipientName: input.recipientName,
      orderShortId: input.orderShortId,
      eventTitle: input.eventTitle,
      subtotalFormatted: input.subtotalFormatted,
      discountFormatted: input.discountFormatted,
      totalFormatted: input.totalFormatted,
      paymentMethod: input.paymentMethod,
      orderUrl: input.orderUrl,
      lineItems: input.lineItems,
      locale: input.locale,
    })
  );
  const subject = RECEIPT_SUBJECT[input.locale].replace(
    "{event}",
    input.eventTitle
  );
  const resend = createEmailClient();
  const res = await resend.emails.send({
    from: ticketsFrom(),
    to: input.to,
    subject,
    html,
  });
  if (res.error) throw new Error(`Resend: ${res.error.message}`);
  return { id: res.data?.id ?? "" };
}

export interface SendAftercareSequenceInput {
  to: string;
  subject: string;
  body: string;
  eventTitle: string;
  galleryUrl?: string | null;
  locale: Locale;
}

export async function sendAftercareSequence(input: SendAftercareSequenceInput) {
  const html = await render(
    React.createElement(AftercareSequenceEmail, {
      subject: input.subject,
      body: input.body,
      eventTitle: input.eventTitle,
      galleryUrl: input.galleryUrl ?? null,
      locale: input.locale,
    })
  );
  const resend = createEmailClient();
  const res = await resend.emails.send({
    from: transactionalFrom(),
    to: input.to,
    subject: input.subject,
    html,
  });
  if (res.error) throw new Error(`Resend: ${res.error.message}`);
  return { id: res.data?.id ?? "" };
}

export interface SendAdminAlertInput {
  to: string | string[];
  subject: string;
  headline: string;
  body: string;
  details?: Record<string, string>;
  dashboardUrl?: string;
  severity?: "info" | "warning" | "critical";
  locale: Locale;
}

export async function sendAdminAlert(input: SendAdminAlertInput) {
  const html = await render(
    React.createElement(AdminAlertEmail, {
      subject: input.subject,
      headline: input.headline,
      body: input.body,
      details: input.details,
      dashboardUrl: input.dashboardUrl,
      severity: input.severity,
      locale: input.locale,
    })
  );
  const resend = createEmailClient();
  const res = await resend.emails.send({
    from: transactionalFrom(),
    to: input.to,
    subject: input.subject,
    html,
  });
  if (res.error) throw new Error(`Resend: ${res.error.message}`);
  return { id: res.data?.id ?? "" };
}

// ---------------------------------------------------------------------------
// Job Application Confirmation
// ---------------------------------------------------------------------------

export interface SendJobApplicationConfirmInput {
  to: string;
  applicantName: string;
  jobTitle: string;
  locale: Locale;
}

const JOB_APP_SUBJECT = {
  en: "Thank you for your application",
  de: "Vielen Dank f\u00FCr Ihre Bewerbung",
  fr: "Merci pour votre candidature",
};

export async function sendJobApplicationConfirm(
  input: SendJobApplicationConfirmInput
) {
  const html = await render(
    React.createElement(JobApplicationConfirmEmail, {
      applicantName: input.applicantName,
      jobTitle: input.jobTitle,
      locale: input.locale,
    })
  );
  const resend = createEmailClient();
  const res = await resend.emails.send({
    from: transactionalFrom(),
    to: input.to,
    subject: JOB_APP_SUBJECT[input.locale],
    html,
  });
  if (res.error) throw new Error(`Resend: ${res.error.message}`);
  return { id: res.data?.id ?? "" };
}

// ---------------------------------------------------------------------------
// Incubation Application Confirmation
// ---------------------------------------------------------------------------

export interface SendIncubationApplicationConfirmInput {
  to: string;
  applicantName: string;
  locale: Locale;
}

const INCUBATION_APP_SUBJECT = {
  en: "We received your DBC application",
  de: "Wir haben deine DBC-Bewerbung erhalten",
  fr: "Nous avons bien re\u00e7u ta candidature DBC",
};

export async function sendIncubationApplicationConfirm(
  input: SendIncubationApplicationConfirmInput
) {
  const html = await render(
    React.createElement(IncubationApplicationConfirmEmail, {
      applicantName: input.applicantName,
      locale: input.locale,
    })
  );
  const resend = createEmailClient();
  const res = await resend.emails.send({
    from: transactionalFrom(),
    to: input.to,
    subject: INCUBATION_APP_SUBJECT[input.locale],
    html,
  });
  if (res.error) throw new Error(`Resend: ${res.error.message}`);
  return { id: res.data?.id ?? "" };
}

// ---------------------------------------------------------------------------
// Refund Confirmation
// ---------------------------------------------------------------------------

export interface SendRefundConfirmationInput {
  to: string;
  recipientName: string;
  eventTitle: string;
  orderShortId: string;
  refundAmountFormatted: string;
  locale: Locale;
}

const REFUND_SUBJECT = {
  en: "Your refund has been processed",
  de: "Ihre R\u00FCckerstattung wurde bearbeitet",
  fr: "Votre remboursement a \u00E9t\u00E9 trait\u00E9",
};

export async function sendRefundConfirmation(
  input: SendRefundConfirmationInput
) {
  const html = await render(
    React.createElement(RefundConfirmationEmail, {
      recipientName: input.recipientName,
      eventTitle: input.eventTitle,
      orderShortId: input.orderShortId,
      refundAmountFormatted: input.refundAmountFormatted,
      locale: input.locale,
    })
  );
  const resend = createEmailClient();
  const res = await resend.emails.send({
    from: ticketsFrom(),
    to: input.to,
    subject: REFUND_SUBJECT[input.locale],
    html,
  });
  if (res.error) throw new Error(`Resend: ${res.error.message}`);
  return { id: res.data?.id ?? "" };
}

// ---------------------------------------------------------------------------
// Contact Form Confirmation
// ---------------------------------------------------------------------------

export interface SendContactFormConfirmInput {
  to: string;
  name: string;
  locale: Locale;
}

const CONTACT_SUBJECT = {
  en: "We received your message",
  de: "Wir haben Ihre Nachricht erhalten",
  fr: "Nous avons re\u00E7u votre message",
};

export async function sendContactFormConfirm(
  input: SendContactFormConfirmInput
) {
  const html = await render(
    React.createElement(ContactFormConfirmEmail, {
      name: input.name,
      locale: input.locale,
    })
  );
  const resend = createEmailClient();
  const res = await resend.emails.send({
    from: transactionalFrom(),
    to: input.to,
    subject: CONTACT_SUBJECT[input.locale],
    html,
  });
  if (res.error) throw new Error(`Resend: ${res.error.message}`);
  return { id: res.data?.id ?? "" };
}

// ---------------------------------------------------------------------------
// Pre-Event Reminder
// ---------------------------------------------------------------------------

export interface SendPreEventReminderInput {
  to: string;
  attendeeName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  venueName: string;
  venueAddress: string;
  ticketShortId: string;
  orderUrl: string;
  locale: Locale;
}

const REMINDER_SUBJECT = {
  en: "Reminder: {event} is coming up!",
  de: "Erinnerung: {event} steht bevor!",
  fr: "Rappel\u00A0: {event} approche\u00A0!",
};

export async function sendPreEventReminder(
  input: SendPreEventReminderInput
) {
  const html = await render(
    React.createElement(PreEventReminderEmail, {
      attendeeName: input.attendeeName,
      eventTitle: input.eventTitle,
      eventDate: input.eventDate,
      eventTime: input.eventTime,
      venueName: input.venueName,
      venueAddress: input.venueAddress,
      ticketShortId: input.ticketShortId,
      orderUrl: input.orderUrl,
      locale: input.locale,
    })
  );
  const subject = REMINDER_SUBJECT[input.locale].replace(
    "{event}",
    input.eventTitle
  );
  const resend = createEmailClient();
  const res = await resend.emails.send({
    from: transactionalFrom(),
    to: input.to,
    subject,
    html,
  });
  if (res.error) throw new Error(`Resend: ${res.error.message}`);
  return { id: res.data?.id ?? "" };
}

// ---------------------------------------------------------------------------
// Password Reset (uses Resend, not Supabase SMTP)
// ---------------------------------------------------------------------------

export interface SendPasswordResetInput {
  to: string;
  recipientName?: string;
  actionLink: string;
  locale: Locale;
}

const PASSWORD_RESET_SUBJECT = {
  en: "Reset your password \u2014 DBC Germany",
  de: "Passwort zur\u00FCcksetzen \u2014 DBC Germany",
  fr: "R\u00E9initialiser votre mot de passe \u2014 DBC Germany",
};

export async function sendPasswordReset(input: SendPasswordResetInput) {
  const html = await render(
    React.createElement(PasswordResetEmail, {
      recipientName: input.recipientName,
      actionLink: input.actionLink,
      locale: input.locale,
    })
  );
  const resend = createEmailClient();
  const res = await resend.emails.send({
    from: transactionalFrom(),
    to: input.to,
    subject: PASSWORD_RESET_SUBJECT[input.locale],
    html,
  });
  if (res.error) throw new Error(`Resend: ${res.error.message}`);
  return { id: res.data?.id ?? "" };
}

// ---------------------------------------------------------------------------
// Staff Invitation (branded; replaces Supabase default SMTP invite email)
// ---------------------------------------------------------------------------

export interface SendStaffInviteInput {
  to: string;
  recipientName: string;
  role: string;
  actionLink: string;
  locale: Locale;
}

const STAFF_INVITE_SUBJECT = {
  en: "Welcome to DBC Germany \u2014 set your password",
  de: "Willkommen bei DBC Germany \u2014 Passwort festlegen",
  fr: "Bienvenue chez DBC Germany \u2014 d\u00E9finissez votre mot de passe",
};

export async function sendStaffInvite(input: SendStaffInviteInput) {
  const html = await render(
    React.createElement(StaffInviteEmail, {
      recipientName: input.recipientName,
      role: input.role,
      actionLink: input.actionLink,
      locale: input.locale,
    })
  );
  const resend = createEmailClient();
  const res = await resend.emails.send({
    from: transactionalFrom(),
    to: input.to,
    subject: STAFF_INVITE_SUBJECT[input.locale],
    html,
  });
  if (res.error) throw new Error(`Resend: ${res.error.message}`);
  return { id: res.data?.id ?? "" };
}
