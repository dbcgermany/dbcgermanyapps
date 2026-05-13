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
import { StaffCredentialsEmail } from "./templates/staff-credentials";
import { StaffEmailChangedEmail } from "./templates/staff-email-changed";
import { StaffPausedEmail } from "./templates/staff-paused";
import { ChapterDelegateAmbassadorInviteEmail } from "./templates/chapter-delegate-ambassador-invite";
import { ChapterDelegateTeamMemberInviteEmail } from "./templates/chapter-delegate-team-member-invite";
import {
  ChapterDelegateOutcomeEmail,
  chapterDelegateOutcomeSubject,
  type ChapterDelegateOutcome,
} from "./templates/chapter-delegate-outcome";
import { PaymentReminderEmail } from "./templates/payment-reminder";
import { TeamFriendCodeRedeemedEmail } from "./templates/team-friend-code-redeemed";

type Locale = "en" | "de" | "fr";

import { fromAddressFor, replyToAddressFor } from "./client";

/**
 * Email-role routing for transactional templates:
 *   - ticket-related (transfer confirmations, order receipts) → `tickets@`
 *   - everything else (waitlist, aftercare, admin alerts)     → `noreply@`
 *
 * Reply-to mirrors the same scope split via replyToAddressFor — tickets
 * replies land on `sales@`, everything else on `info@`. The apex Google
 * Workspace inboxes (info@, sales@, marketing@, …) are reply-to targets
 * only; this code never sends FROM them.
 */
function transactionalFrom() {
  return fromAddressFor("transactional"); // noreply@
}
function ticketsFrom() {
  return fromAddressFor("tickets");
}
function transactionalReplyTo() {
  return replyToAddressFor("transactional"); // info@
}
function ticketsReplyTo() {
  return replyToAddressFor("tickets"); // sales@
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
    replyTo: ticketsReplyTo(),
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
    replyTo: transactionalReplyTo(),
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
    replyTo: ticketsReplyTo(),
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
    replyTo: transactionalReplyTo(),
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
    replyTo: transactionalReplyTo(),
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
    replyTo: transactionalReplyTo(),
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
    replyTo: transactionalReplyTo(),
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
    replyTo: ticketsReplyTo(),
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
    replyTo: transactionalReplyTo(),
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
    replyTo: transactionalReplyTo(),
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
    replyTo: transactionalReplyTo(),
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
    replyTo: transactionalReplyTo(),
    to: input.to,
    subject: STAFF_INVITE_SUBJECT[input.locale],
    html,
  });
  if (res.error) throw new Error(`Resend: ${res.error.message}`);
  return { id: res.data?.id ?? "" };
}

// ---------------------------------------------------------------------------
// Staff credentials (used by create-without-invite + reset-password flows)
// ---------------------------------------------------------------------------

export interface SendStaffCredentialsInput {
  to: string;
  recipientName: string;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
  locale: Locale;
  reason: "created" | "reset";
}

const STAFF_CREDENTIALS_SUBJECT = {
  created: {
    en: "Your DBC Germany admin access",
    de: "Dein DBC Germany Admin-Zugang",
    fr: "Votre accès admin DBC Germany",
  },
  reset: {
    en: "Your DBC Germany password was reset",
    de: "Dein DBC Germany Passwort wurde zurückgesetzt",
    fr: "Votre mot de passe DBC Germany a été réinitialisé",
  },
};

export async function sendStaffCredentials(input: SendStaffCredentialsInput) {
  const html = await render(
    React.createElement(StaffCredentialsEmail, {
      recipientName: input.recipientName,
      email: input.email,
      temporaryPassword: input.temporaryPassword,
      loginUrl: input.loginUrl,
      locale: input.locale,
      reason: input.reason,
    })
  );
  const resend = createEmailClient();
  const res = await resend.emails.send({
    from: transactionalFrom(),
    replyTo: transactionalReplyTo(),
    to: input.to,
    subject: STAFF_CREDENTIALS_SUBJECT[input.reason][input.locale],
    html,
  });
  if (res.error) throw new Error(`Resend: ${res.error.message}`);
  return { id: res.data?.id ?? "" };
}

// ---------------------------------------------------------------------------
// Staff email-change notice (sent to BOTH old and new addresses)
// ---------------------------------------------------------------------------

export interface SendStaffEmailChangedInput {
  to: string;
  recipientName: string;
  oldEmail: string;
  newEmail: string;
  loginUrl: string;
  locale: Locale;
  side: "new" | "old";
}

const STAFF_EMAIL_CHANGED_SUBJECT = {
  new: {
    en: "Your DBC Germany login email",
    de: "Deine DBC Germany Login-E-Mail",
    fr: "Votre adresse de connexion DBC Germany",
  },
  old: {
    en: "Your DBC Germany login email was changed",
    de: "Deine DBC Germany Login-E-Mail wurde geändert",
    fr: "Votre adresse de connexion DBC Germany a changé",
  },
};

export async function sendStaffEmailChanged(input: SendStaffEmailChangedInput) {
  const html = await render(
    React.createElement(StaffEmailChangedEmail, {
      recipientName: input.recipientName,
      oldEmail: input.oldEmail,
      newEmail: input.newEmail,
      loginUrl: input.loginUrl,
      locale: input.locale,
      side: input.side,
    })
  );
  const resend = createEmailClient();
  const res = await resend.emails.send({
    from: transactionalFrom(),
    replyTo: transactionalReplyTo(),
    to: input.to,
    subject: STAFF_EMAIL_CHANGED_SUBJECT[input.side][input.locale],
    html,
  });
  if (res.error) throw new Error(`Resend: ${res.error.message}`);
  return { id: res.data?.id ?? "" };
}

// ---------------------------------------------------------------------------
// Staff paused / unpaused notice
// ---------------------------------------------------------------------------

export interface SendStaffPausedInput {
  to: string;
  recipientName: string;
  locale: Locale;
  state: "paused" | "unpaused";
}

const STAFF_PAUSED_SUBJECT = {
  paused: {
    en: "Your DBC Germany access has been paused",
    de: "Dein DBC Germany Zugang wurde pausiert",
    fr: "Votre accès DBC Germany a été suspendu",
  },
  unpaused: {
    en: "Your DBC Germany access has been restored",
    de: "Dein DBC Germany Zugang wurde wiederhergestellt",
    fr: "Votre accès DBC Germany a été rétabli",
  },
};

export async function sendStaffPaused(input: SendStaffPausedInput) {
  const html = await render(
    React.createElement(StaffPausedEmail, {
      recipientName: input.recipientName,
      locale: input.locale,
      state: input.state,
    })
  );
  const resend = createEmailClient();
  const res = await resend.emails.send({
    from: transactionalFrom(),
    replyTo: transactionalReplyTo(),
    to: input.to,
    subject: STAFF_PAUSED_SUBJECT[input.state][input.locale],
    html,
  });
  if (res.error) throw new Error(`Resend: ${res.error.message}`);
  return { id: res.data?.id ?? "" };
}

// ---------------------------------------------------------------------------
// Chapter-delegate outcome — rejection or revocation notice
// ---------------------------------------------------------------------------

export interface SendChapterDelegateOutcomeInput {
  to: string;
  ccLeadEmail?: string | null;
  recipientName: string;
  eventTitle: string;
  outcome: ChapterDelegateOutcome;
  note?: string | null;
  locale: Locale;
}

export async function sendChapterDelegateOutcome(
  input: SendChapterDelegateOutcomeInput
) {
  const html = await render(
    React.createElement(ChapterDelegateOutcomeEmail, {
      recipientName: input.recipientName,
      eventTitle: input.eventTitle,
      outcome: input.outcome,
      note: input.note ?? null,
      locale: input.locale,
    })
  );
  const subject = chapterDelegateOutcomeSubject(
    input.outcome,
    input.locale,
    input.eventTitle
  );
  const resend = createEmailClient();
  const cc = input.ccLeadEmail ? [input.ccLeadEmail] : undefined;
  const res = await resend.emails.send({
    from: transactionalFrom(),
    replyTo: transactionalReplyTo(),
    to: input.to,
    cc,
    subject,
    html,
  });
  if (res.error) throw new Error(`Resend: ${res.error.message}`);
  return { id: res.data?.id ?? "" };
}

// ---------------------------------------------------------------------------
// Team-friend code redeemed — notify the issuing team member
// ---------------------------------------------------------------------------

export interface SendTeamFriendCodeRedeemedInput {
  to: string;
  recipientName: string;
  eventTitle: string;
  redeemerName: string;
  redeemerEmail: string;
  codeTail: string;
  locale: Locale;
}

const TEAM_FRIEND_REDEEMED_SUBJECT = {
  en: "Your DBC invite code was used for {event}",
  de: "Dein DBC-Einladungscode wurde für {event} verwendet",
  fr: "Votre code d'invitation DBC a été utilisé pour {event}",
};

export async function sendTeamFriendCodeRedeemed(
  input: SendTeamFriendCodeRedeemedInput
) {
  const html = await render(
    React.createElement(TeamFriendCodeRedeemedEmail, {
      recipientName: input.recipientName,
      eventTitle: input.eventTitle,
      redeemerName: input.redeemerName,
      redeemerEmail: input.redeemerEmail,
      codeTail: input.codeTail,
      locale: input.locale,
    })
  );
  const subject = TEAM_FRIEND_REDEEMED_SUBJECT[input.locale].replace(
    "{event}",
    input.eventTitle
  );
  const resend = createEmailClient();
  const res = await resend.emails.send({
    from: transactionalFrom(),
    replyTo: transactionalReplyTo(),
    to: input.to,
    subject,
    html,
  });
  if (res.error) throw new Error(`Resend: ${res.error.message}`);
  return { id: res.data?.id ?? "" };
}

// ---------------------------------------------------------------------------
// Payment Reminder — pending bank_transfer order, 3+ days old
// ---------------------------------------------------------------------------

export interface SendPaymentReminderInput {
  to: string;
  recipientName: string;
  eventTitle: string;
  orderShortId: string;
  totalFormatted: string;
  orderUrl: string;
  locale: Locale;
}

const PAYMENT_REMINDER_SUBJECT = {
  en: "Payment reminder — DBC Germany",
  de: "Zahlungserinnerung — DBC Germany",
  fr: "Rappel de paiement — DBC Germany",
};

export async function sendPaymentReminder(input: SendPaymentReminderInput) {
  const html = await render(
    React.createElement(PaymentReminderEmail, {
      recipientName: input.recipientName,
      eventTitle: input.eventTitle,
      orderShortId: input.orderShortId,
      totalFormatted: input.totalFormatted,
      orderUrl: input.orderUrl,
      locale: input.locale,
    })
  );
  const resend = createEmailClient();
  const res = await resend.emails.send({
    from: ticketsFrom(),
    replyTo: ticketsReplyTo(),
    to: input.to,
    subject: PAYMENT_REMINDER_SUBJECT[input.locale],
    html,
  });
  if (res.error) throw new Error(`Resend: ${res.error.message}`);
  return { id: res.data?.id ?? "" };
}

// ---------------------------------------------------------------------------
// Chapter-delegate outreach — single-recipient + batch send for both the
// ambassador-targeted and team-member-targeted invite templates. The admin
// outreach panel calls the bulk variant; both share the same audience+locale
// matrix so subject lines and templates stay co-located here.
// ---------------------------------------------------------------------------

export type ChapterDelegateInviteKind = "ambassador" | "team_member";

export interface SendChapterDelegateInviteInput {
  to: string;
  recipientName: string;
  eventTitle: string;
  eventDateLabel: string;
  eventCity: string;
  registrationUrl: string;
  locale: Locale;
  kind: ChapterDelegateInviteKind;
}

const CHAPTER_DELEGATE_INVITE_SUBJECT: Record<
  ChapterDelegateInviteKind,
  Record<Locale, string>
> = {
  ambassador: {
    en: "Please forward — branch delegate registration for {event}",
    de: "Bitte weiterleiten — Niederlassungs-Delegierten-Anmeldung für {event}",
    fr: "À transférer — inscription délégué·e de succursale pour {event}",
  },
  team_member: {
    en: "Your invitation: {event} — please register",
    de: "Deine Einladung: {event} — bitte registrieren",
    fr: "Votre invitation : {event} — merci de vous inscrire",
  },
};

async function renderChapterDelegateInvite(
  input: SendChapterDelegateInviteInput
) {
  const Component =
    input.kind === "ambassador"
      ? ChapterDelegateAmbassadorInviteEmail
      : ChapterDelegateTeamMemberInviteEmail;
  return render(
    React.createElement(Component, {
      recipientName: input.recipientName,
      eventTitle: input.eventTitle,
      eventDateLabel: input.eventDateLabel,
      eventCity: input.eventCity,
      registrationUrl: input.registrationUrl,
      locale: input.locale,
    })
  );
}

export async function sendChapterDelegateInvite(
  input: SendChapterDelegateInviteInput
) {
  const html = await renderChapterDelegateInvite(input);
  const resend = createEmailClient();
  const subject = CHAPTER_DELEGATE_INVITE_SUBJECT[input.kind][input.locale]
    .replace("{event}", input.eventTitle);
  const res = await resend.emails.send({
    from: transactionalFrom(),
    replyTo: transactionalReplyTo(),
    to: input.to,
    subject,
    html,
  });
  if (res.error) throw new Error(`Resend: ${res.error.message}`);
  return { id: res.data?.id ?? "" };
}

export interface SendChapterDelegateInvitesBatchResult {
  sent: number;
  failed: number;
  errors: { email: string; error: string }[];
}

/**
 * Send the same template+locale to many recipients. Uses Resend's batch
 * endpoint (max 100 per call) so 1 admin click → 1 API call. Falls back to
 * per-recipient send if the batch endpoint errors so a single bad recipient
 * doesn't block the rest. Each `recipients[i].name` becomes the greeting.
 */
export async function sendChapterDelegateInvitesBatch(input: {
  recipients: { email: string; name: string }[];
  eventTitle: string;
  eventDateLabel: string;
  eventCity: string;
  registrationUrl: string;
  locale: Locale;
  kind: ChapterDelegateInviteKind;
}): Promise<SendChapterDelegateInvitesBatchResult> {
  const resend = createEmailClient();
  const subjectTemplate =
    CHAPTER_DELEGATE_INVITE_SUBJECT[input.kind][input.locale];
  const subject = subjectTemplate.replace("{event}", input.eventTitle);
  const result: SendChapterDelegateInvitesBatchResult = {
    sent: 0,
    failed: 0,
    errors: [],
  };

  // Resend batch caps at 100; chunk if larger.
  const CHUNK = 100;
  for (let i = 0; i < input.recipients.length; i += CHUNK) {
    const slice = input.recipients.slice(i, i + CHUNK);

    // Pre-render all HTMLs in parallel so we don't serialise React renders.
    const rendered = await Promise.all(
      slice.map((r) =>
        renderChapterDelegateInvite({
          to: r.email,
          recipientName: r.name,
          eventTitle: input.eventTitle,
          eventDateLabel: input.eventDateLabel,
          eventCity: input.eventCity,
          registrationUrl: input.registrationUrl,
          locale: input.locale,
          kind: input.kind,
        })
      )
    );
    const payload = slice.map((r, idx) => ({
      from: transactionalFrom(),
      replyTo: transactionalReplyTo(),
      to: [r.email],
      subject,
      html: rendered[idx],
    }));

    const batchRes = await resend.batch.send(payload);
    if (batchRes.error) {
      // Fall back per-recipient so one rejected address doesn't kill the batch.
      console.error(
        "[sendChapterDelegateInvitesBatch] batch failed, falling back:",
        batchRes.error
      );
      for (let j = 0; j < slice.length; j++) {
        try {
          await resend.emails.send(payload[j]);
          result.sent += 1;
        } catch (err) {
          result.failed += 1;
          result.errors.push({
            email: slice[j].email,
            error: err instanceof Error ? err.message : "unknown",
          });
        }
      }
    } else {
      result.sent += slice.length;
    }
  }

  return result;
}
