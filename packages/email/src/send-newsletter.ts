import { render } from "@react-email/components";
import React from "react";
import { createEmailClient, fromAddressFor, DEFAULT_FROM } from "./client";
import { NewsletterEmail } from "./templates/newsletter";
import {
  NewsletterConfirmEmail,
  NEWSLETTER_CONFIRM_SUBJECT,
} from "./templates/newsletter-confirm";
import { StaffMessageEmail } from "./templates/staff-message";

type Locale = "en" | "de" | "fr";

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
}

export async function sendNewsletterEmail(input: SendNewsletterInput) {
  const html = await render(
    React.createElement(NewsletterEmail, {
      subject: input.subject,
      preheader: input.preheader,
      body: input.body,
      unsubscribeUrl: input.unsubscribeUrl,
      locale: input.locale,
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
  // During onboarding we can't send from arbitrary @dbc-germany.com addresses,
  // so fall back to the shared Resend sender with the staff member's name in
  // the display portion and reply-to pointing at their real mailbox.
  const staffFrom =
    process.env.RESEND_STAFF_FROM_ADDRESS ?? process.env.RESEND_FROM_ADDRESS;
  const from = staffFrom
    ? `${input.senderName} <${staffFrom.replace(/^[^<]*<|>$/g, "")}>`
    : `${input.senderName} <${DEFAULT_FROM.replace(/^[^<]*<|>$/g, "")}>`;
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
