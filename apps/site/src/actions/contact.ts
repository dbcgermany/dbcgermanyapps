"use server";

import { createEmailClient } from "@dbc/email";
import { createServerClient } from "@dbc/supabase/server";

const CONTACT_DEST =
  process.env.CONTACT_DEST_EMAIL ?? "info@dbc-germany.com";

// Simple in-memory cooldown per email to slow down spam. Doesn't survive
// cold starts, but it's cheap defense-in-depth alongside Turnstile-less
// public forms.
const SUBMIT_WINDOW_MS = 60_000;
const lastSubmittedAt = new Map<string, number>();

export interface ContactFormInput {
  name: string;
  email: string;
  topic: string;
  message: string;
  locale: string;
}

export async function sendContactMessage(
  input: ContactFormInput
): Promise<{ success?: true; error?: string }> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const topic = (input.topic || "general").trim();
  const message = input.message.trim();

  if (!name || !email || !message) {
    return { error: "Please fill in name, email and message." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  if (message.length > 5000) {
    return { error: "Message is too long (max 5000 characters)." };
  }

  const now = Date.now();
  const previous = lastSubmittedAt.get(email) ?? 0;
  if (now - previous < SUBMIT_WINDOW_MS) {
    return {
      error:
        "Please wait a minute before sending another message from the same address.",
    };
  }
  lastSubmittedAt.set(email, now);

  // Persist to Supabase analytics_events so the team sees inbound inquiries
  // even if email delivery fails.
  try {
    const supabase = await createServerClient();
    await supabase.from("analytics_events").insert({
      event_name: "site_contact_message",
      properties: { name, email, topic, locale: input.locale },
    });
  } catch (err) {
    console.error("analytics_events insert failed:", err);
  }

  // Only attempt to send the email when Resend is configured.
  if (!process.env.RESEND_API_KEY) {
    console.log(
      `[contact] email sending skipped (no RESEND_API_KEY) — payload:`,
      { name, email, topic, locale: input.locale, message }
    );
    return { success: true };
  }

  try {
    const resend = createEmailClient();
    const from =
      process.env.RESEND_FROM_ADDRESS ??
      "DBC Germany <info@dbc-germany.com>";
    const { error } = await resend.emails.send({
      from,
      to: CONTACT_DEST,
      replyTo: email,
      subject: `[dbc-germany.com · ${topic}] ${name}`,
      text:
        `New message from the DBC Germany marketing site.\n\n` +
        `Name: ${name}\n` +
        `Email: ${email}\n` +
        `Topic: ${topic}\n` +
        `Locale: ${input.locale}\n` +
        `\n---\n\n${message}\n`,
    });
    if (error) {
      console.error("Resend error on contact form:", error);
      return { error: "Message failed to send. Try again shortly." };
    }
  } catch (err) {
    console.error("Contact form send failed:", err);
    return { error: "Message failed to send. Try again shortly." };
  }

  return { success: true };
}
