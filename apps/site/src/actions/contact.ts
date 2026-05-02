"use server";

import { createEmailClient, sendContactFormConfirm } from "@dbc/email";
import { createServerClient, notifyAdmins } from "@dbc/supabase/server";
import { headers } from "next/headers";

const CONTACT_DEST =
  process.env.CONTACT_DEST_EMAIL ?? "info@dbc-germany.com";

// DB-backed rate limit (replaces the previous in-memory Map that reset on
// every Vercel cold start). Window kept generous because a real-life
// follow-up after a quick correction is reasonable.
const CONTACT_RATE_WINDOW_SECONDS = 60;
const CONTACT_RATE_MAX_PER_EMAIL_PER_WINDOW = 2;
const CONTACT_RATE_MAX_PER_IP_PER_WINDOW = 6;

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

  const supabase = await createServerClient();

  // DB-backed rate limit per email + per IP. Survives Vercel cold starts.
  const hdrs = await headers();
  const ipRaw =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    hdrs.get("x-real-ip") ??
    null;
  const since = new Date(
    Date.now() - CONTACT_RATE_WINDOW_SECONDS * 1000
  ).toISOString();
  const { count: emailHits } = await supabase
    .from("abuse_events")
    .select("id", { count: "exact", head: true })
    .eq("scope", "contact")
    .eq("key", email)
    .gte("occurred_at", since);
  if ((emailHits ?? 0) >= CONTACT_RATE_MAX_PER_EMAIL_PER_WINDOW) {
    return {
      error:
        "Please wait a minute before sending another message from the same address.",
    };
  }
  if (ipRaw) {
    const { count: ipHits } = await supabase
      .from("abuse_events")
      .select("id", { count: "exact", head: true })
      .eq("scope", "contact")
      .eq("ip", ipRaw)
      .gte("occurred_at", since);
    if ((ipHits ?? 0) >= CONTACT_RATE_MAX_PER_IP_PER_WINDOW) {
      return {
        error: "Too many requests. Please try again in a minute.",
      };
    }
  }
  await supabase.from("abuse_events").insert({
    scope: "contact",
    key: email,
    ip: ipRaw,
  });

  // Persist to Supabase analytics_events so the team sees inbound inquiries
  // even if email delivery fails.
  try {
    await supabase.from("analytics_events").insert({
      event_name: "site_contact_message",
      properties: { name, email, topic, locale: input.locale },
    });

    // In-app + email admin alert (respects per-user preferences).
    await notifyAdmins(supabase, {
      type: "contact_form_received",
      title: `New contact form message from ${name}`,
      body: `${topic ? `[${topic}] ` : ""}${message.slice(0, 240)}${message.length > 240 ? "…" : ""}`,
      data: { email, topic, locale: input.locale },
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

    // Send branded confirmation to the submitter (non-blocking)
    try {
      const locale = (input.locale === "de" || input.locale === "fr"
        ? input.locale
        : "en") as "en" | "de" | "fr";
      await sendContactFormConfirm({ to: email, name, locale });
    } catch (confirmErr) {
      console.error("Contact form confirmation email failed:", confirmErr);
    }
  } catch (err) {
    console.error("Contact form send failed:", err);
    return { error: "Message failed to send. Try again shortly." };
  }

  return { success: true };
}
