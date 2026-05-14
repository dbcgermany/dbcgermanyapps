import { render } from "@react-email/components";
import React from "react";
import { createEmailClient, fromAddressFor, DEFAULT_FROM } from "./client";
import { NewsletterEmail, type UpcomingEvent } from "./templates/newsletter";
import {
  NewsletterConfirmEmail,
  NEWSLETTER_CONFIRM_SUBJECT,
} from "./templates/newsletter-confirm";
import { StaffMessageEmail } from "./templates/staff-message";

type Locale = "en" | "de" | "fr";

export type { UpcomingEvent };

export interface SendNewsletterInput {
  to: string;
  subject: string;
  preheader?: string;
  body: string;
  unsubscribeUrl: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  locale: Locale;
  /** When set, renders the branded event announcement card at the top. */
  upcomingEvent?: UpcomingEvent;
}

export async function sendNewsletterEmail(input: SendNewsletterInput) {
  const html = await render(
    React.createElement(NewsletterEmail, {
      subject: input.subject,
      preheader: input.preheader,
      body: input.body,
      unsubscribeUrl: input.unsubscribeUrl,
      locale: input.locale,
      upcomingEvent: input.upcomingEvent,
    })
  );

  const resend = createEmailClient();
  // Prefer explicit from fields on the call, then the newsletter env var,
  // then the shared Resend onboarding sender.
  const from =
    input.fromName && input.fromEmail
      ? `${input.fromName} <${input.fromEmail}>`
      : fromAddressFor("newsletter");
  // List-Unsubscribe with both HTTP AND mailto (per RFC 8058). Gmail + Apple
  // Mail honour both; having the mailto fallback bumps inbox placement.
  const unsubscribeMailto =
    process.env.RESEND_UNSUBSCRIBE_MAILTO ?? "unsubscribe@dbc-germany.com";
  const res = await resend.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    html,
    replyTo: input.replyTo,
    headers: {
      "List-Unsubscribe": `<${input.unsubscribeUrl}>, <mailto:${unsubscribeMailto}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });
  if (res.error) throw new Error(`Resend: ${res.error.message}`);
  return { id: res.data?.id ?? "" };
}

export interface SendNewsletterConfirmInput {
  to: string;
  confirmUrl: string;
  locale: Locale;
}

export async function sendNewsletterConfirm(input: SendNewsletterConfirmInput) {
  const html = await render(
    React.createElement(NewsletterConfirmEmail, {
      confirmUrl: input.confirmUrl,
      locale: input.locale,
    })
  );
  const subject = NEWSLETTER_CONFIRM_SUBJECT[input.locale];
  const resend = createEmailClient();
  const res = await resend.emails.send({
    from: fromAddressFor("newsletter"),
    to: input.to,
    subject,
    html,
  });
  if (res.error) throw new Error(`Resend: ${res.error.message}`);
  return { id: res.data?.id ?? "" };
}

export interface SendStaffMessageInput {
  to: string;
  subject: string;
  body: string;
  senderName: string;
  senderEmail: string;
  replyTo?: string;
  /**
   * Override the From address itself (not just the display name). Useful for
   * outreach templates that want the recipient to see the department mailbox
   * directly in the From header (e.g. `sponsors@dbc-germany.com`) instead of
   * the generic staff sender. Any address on a Resend-verified domain works.
   */
  fromAddress?: string;
  /**
   * Optional department / role suffix shown after the sender name in the
   * From display, e.g. "Jay Kalala · Sponsorships". Without it the recipient
   * just sees the name, which can feel ambiguous for cold outreach.
   */
  fromDepartment?: string;
  locale: Locale;
}

export async function sendStaffMessage(input: SendStaffMessageInput) {
  const html = await render(
    React.createElement(StaffMessageEmail, {
      subject: input.subject,
      body: input.body,
      senderName: input.senderName,
      locale: input.locale,
    })
  );
  const resend = createEmailClient();
  // Resolve the bare sending address. Caller can override (outreach templates
  // pass the per-template pool inbox like sponsors@dbc-germany.com so the
  // From and Reply-To match — that combo is what gets through Gmail's spam
  // heuristic cleanly). Without an override we fall back through the staff
  // env → generic Resend env → DEFAULT_FROM chain.
  const overrideBare = input.fromAddress?.trim();
  const staffEnv =
    process.env.RESEND_STAFF_FROM_ADDRESS ?? process.env.RESEND_FROM_ADDRESS;
  const bareAddress = overrideBare
    ? overrideBare
    : staffEnv
      ? staffEnv.replace(/^[^<]*<|>$/g, "")
      : DEFAULT_FROM.replace(/^[^<]*<|>$/g, "");
  const displayName = input.fromDepartment
    ? `${input.senderName} · ${input.fromDepartment}`
    : input.senderName;
  const from = `${displayName} <${bareAddress}>`;
  const res = await resend.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    replyTo: input.replyTo ?? input.senderEmail,
    html,
  });
  if (res.error) throw new Error(`Resend: ${res.error.message}`);
  return { id: res.data?.id ?? "" };
}
