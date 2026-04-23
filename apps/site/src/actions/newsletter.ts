"use server";

import { createServerClient, notifyAdmins } from "@dbc/supabase/server";
import { sendNewsletterConfirm } from "@dbc/email";
import { headers } from "next/headers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://dbc-germany.com";

type Locale = "en" | "de" | "fr";

function normalizeLocale(input: string | null | undefined): Locale {
  if (input === "de" || input === "fr") return input;
  return "en";
}

export async function subscribeToNewsletter(input: {
  email: string;
  firstName?: string;
  locale: string;
  interestSlugs?: string[];
  source?: string;
}) {
  const email = input.email.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  const locale = normalizeLocale(input.locale);
  const supabase = await createServerClient();

  const hdrs = await headers();
  const ipRaw =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    hdrs.get("x-real-ip") ??
    null;

  // Reuse the shared RPC so the contact row and tag links are populated
  // consistently with checkout / invitation flows.
  const { data: contactId, error: upsertError } = await supabase.rpc(
    "upsert_contact_from_checkout",
    {
      p_email: email,
      p_first_name: input.firstName?.trim() || null,
      p_last_name: null,
      p_country: null,
      p_auto_category_slug: null,
      p_extra_category_slugs: (input.interestSlugs ?? []).filter(Boolean),
    }
  );
  if (upsertError || !contactId) {
    console.error("Newsletter signup upsert failed:", upsertError);
    return { error: "Could not save your subscription. Please try again." };
  }

  // If already fully consented, treat as idempotent success.
  const { data: contact } = await supabase
    .from("contacts")
    .select("id, marketing_consent, unsubscribed_at, marketing_consent_token, unsubscribe_token")
    .eq("id", contactId as string)
    .single();

  if (contact?.marketing_consent && !contact.unsubscribed_at) {
    return { success: true, alreadySubscribed: true };
  }

  // (Re-)issue a confirmation token. If they previously unsubscribed and are
  // resubscribing, clear the old flag so the confirm step can flip it on.
  const token = crypto.randomUUID();
  await supabase
    .from("contacts")
    .update({
      marketing_consent: false,
      marketing_consent_token: token,
      marketing_consent_requested_at: new Date().toISOString(),
      marketing_consent_source: input.source ?? "public_signup",
      marketing_consent_ip: ipRaw,
      unsubscribed_at: null,
    })
    .eq("id", contactId as string);

  const confirmUrl = `${SITE_URL}/${locale}/newsletter/confirm?token=${token}`;
  try {
    await sendNewsletterConfirm({ to: email, confirmUrl, locale });
  } catch (err) {
    console.error("Failed to send newsletter confirm email:", err);
    return { error: "Could not send confirmation email. Please try again." };
  }

  await supabase.from("audit_log").insert({
    user_id: null,
    action: "newsletter_signup_requested",
    entity_type: "contacts",
    entity_id: contactId as string,
    details: {
      email,
      locale,
      source: input.source ?? "public_signup",
      interests: input.interestSlugs ?? [],
    },
  });

  return { success: true };
}

export async function confirmNewsletterSubscription(token: string) {
  if (!token || token.length < 10) {
    return { error: "Invalid confirmation link." };
  }
  const supabase = await createServerClient();

  const { data: contact } = await supabase
    .from("contacts")
    .select("id, marketing_consent, unsubscribed_at")
    .eq("marketing_consent_token", token)
    .maybeSingle();

  if (!contact) {
    // Token may have been consumed already — treat as idempotent success
    // if we can't find it, but don't leak whether the email exists.
    return { success: true, idempotent: true };
  }

  await supabase
    .from("contacts")
    .update({
      marketing_consent: true,
      marketing_consent_confirmed_at: new Date().toISOString(),
      marketing_consent_token: null,
      unsubscribed_at: null,
    })
    .eq("id", contact.id);

  // Off by default in NOTIFICATION_DEFAULTS — admins who care opt in via
  // the Preferences tab. Gives ops visibility into newsletter growth
  // milestones without spamming everyone for every confirm.
  try {
    const { data: c } = await supabase
      .from("contacts")
      .select("first_name, last_name, email")
      .eq("id", contact.id)
      .single();
    const name =
      [c?.first_name, c?.last_name].filter(Boolean).join(" ").trim() ||
      c?.email ||
      "New subscriber";
    await notifyAdmins(supabase, {
      type: "newsletter_subscriber",
      title: `${name} confirmed newsletter subscription`,
      body: c?.email ?? "",
      data: { contact_id: contact.id },
    });
  } catch (err) {
    console.error("newsletter_subscriber notification failed:", err);
  }

  return { success: true };
}

export async function unsubscribeFromNewsletter(input: {
  token: string;
  newsletterSendId?: string | null;
}) {
  const token = input.token?.trim();
  if (!token) return { error: "Invalid unsubscribe link." };

  const supabase = await createServerClient();
  const { data: contact } = await supabase
    .from("contacts")
    .select("id, unsubscribed_at")
    .eq("unsubscribe_token", token)
    .maybeSingle();

  if (!contact) {
    // Token not found — idempotent "already unsubscribed".
    return { success: true, idempotent: true };
  }

  const nowIso = new Date().toISOString();

  if (!contact.unsubscribed_at) {
    await supabase
      .from("contacts")
      .update({
        unsubscribed_at: nowIso,
        marketing_consent: false,
      })
      .eq("id", contact.id);
  }

  if (input.newsletterSendId) {
    const { data: send } = await supabase
      .from("newsletter_sends")
      .select("id, newsletter_id, unsubscribed_at")
      .eq("id", input.newsletterSendId)
      .maybeSingle();
    if (send && !send.unsubscribed_at) {
      await supabase
        .from("newsletter_sends")
        .update({ status: "unsubscribed", unsubscribed_at: nowIso })
        .eq("id", send.id);
      const { data: newsletter } = await supabase
        .from("newsletters")
        .select("unsubscribes_count")
        .eq("id", send.newsletter_id)
        .single();
      await supabase
        .from("newsletters")
        .update({
          unsubscribes_count: (newsletter?.unsubscribes_count ?? 0) + 1,
        })
        .eq("id", send.newsletter_id);
    }
  }

  return { success: true };
}
