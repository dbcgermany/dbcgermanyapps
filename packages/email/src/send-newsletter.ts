import { render } from "@react-email/components";
import React from "react";
import { createEmailClient } from "./client";
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
  const fromName = input.fromName ?? "DBC Germany";
  const fromEmail = input.fromEmail ?? "newsletter@dbc-germany.com";
  const res = await resend.emails.send({
    from: `${fromName} <${fromEmail}>`,
    to: input.to,
    subject: input.subject,
    html,
    replyTo: input.replyTo,
    headers: {
      "List-Unsubscribe": `<${input.unsubscribeUrl}>`,
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
    from: "DBC Germany <newsletter@dbc-germany.com>",
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
  const res = await resend.emails.send({
    from: `${input.senderName} <${input.senderEmail}>`,
    to: input.to,
    subject: input.subject,
    replyTo: input.replyTo ?? input.senderEmail,
    html,
  });
  if (res.error) throw new Error(`Resend: ${res.error.message}`);
  return { id: res.data?.id ?? "" };
}
