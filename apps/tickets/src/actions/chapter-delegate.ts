"use server";

import { headers } from "next/headers";
import { createServerClient, notifyAdmins } from "@dbc/supabase/server";
import { DBC_CHAPTER_COUNTRY_CODES } from "@dbc/ui";

// Honeypot field — bots fill anything labelled "website". Real users never see it.
const HONEYPOT_FIELD = "website";

const RATE_WINDOW_SECONDS = 60;
const RATE_MAX_PER_EMAIL = 3;
const RATE_MAX_PER_IP = 6;

const CHAPTER_SET = new Set<string>(DBC_CHAPTER_COUNTRY_CODES);

export interface ChapterDelegateInput {
  eventSlug: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  chapterCountry: string;
  chapterLeadName?: string;
  chapterLeadEmail?: string;
  bringsCompanion: boolean;
  companionFirstName?: string;
  companionLastName?: string;
  companionEmail?: string;
  consent: boolean;
  locale: string;
  honeypot?: string;
  turnstileToken?: string;
}

// Cloudflare Turnstile sitewide verification — same endpoint the checkout
// uses. Optional: if TURNSTILE_SECRET_KEY isn't configured we skip verify.
async function verifyTurnstile(token: string | undefined, ip: string | null) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // dev / unconfigured — let it through
  if (!token) return false;
  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret,
          response: token,
          ...(ip ? { remoteip: ip } : {}),
        }),
      }
    );
    const data = (await res.json()) as { success?: boolean };
    return !!data.success;
  } catch {
    return false;
  }
}

export async function submitChapterDelegateRegistration(
  input: ChapterDelegateInput
): Promise<{ success?: true; error?: string }> {
  // 1. Honeypot — silently succeed so bots think the form worked.
  if (input.honeypot && input.honeypot.trim().length > 0) {
    return { success: true };
  }

  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const email = input.email.trim().toLowerCase();
  const position = input.position.trim();
  const chapter = input.chapterCountry.trim().toUpperCase();
  const leadName = input.chapterLeadName?.trim() || null;
  const leadEmail = input.chapterLeadEmail?.trim().toLowerCase() || null;

  if (!firstName || !lastName || !email || !position) {
    return { error: "Please fill in name, email and position." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }
  if (!CHAPTER_SET.has(chapter)) {
    return { error: "Please pick a chapter from the list." };
  }
  if (!input.consent) {
    return { error: "Please confirm your team membership to continue." };
  }
  if (leadEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leadEmail)) {
    return { error: "Chapter lead email looks invalid." };
  }

  let companionPayload: {
    firstName: string;
    lastName: string;
    email: string;
  } | null = null;
  if (input.bringsCompanion) {
    const cfn = input.companionFirstName?.trim() ?? "";
    const cln = input.companionLastName?.trim() ?? "";
    const cem = input.companionEmail?.trim().toLowerCase() ?? "";
    if (!cfn || !cln || !cem) {
      return {
        error: "Please complete the companion's details, or untick the +1.",
      };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cem)) {
      return { error: "Companion email looks invalid." };
    }
    if (cem === email) {
      return { error: "Companion email must differ from yours." };
    }
    companionPayload = { firstName: cfn, lastName: cln, email: cem };
  }

  const supabase = await createServerClient();
  const hdrs = await headers();
  const ipRaw =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    hdrs.get("x-real-ip") ??
    null;
  const ua = hdrs.get("user-agent") ?? null;

  // 2. Turnstile.
  const turnstileOk = await verifyTurnstile(input.turnstileToken, ipRaw);
  if (!turnstileOk) {
    return { error: "Bot check failed. Refresh the page and try again." };
  }

  // 3. Rate limit (email + IP).
  const since = new Date(Date.now() - RATE_WINDOW_SECONDS * 1000).toISOString();
  const { count: emailHits } = await supabase
    .from("abuse_events")
    .select("id", { count: "exact", head: true })
    .eq("scope", "chapter_delegate")
    .eq("key", email)
    .gte("occurred_at", since);
  if ((emailHits ?? 0) >= RATE_MAX_PER_EMAIL) {
    return {
      error:
        "Please wait a minute before submitting another registration with the same email.",
    };
  }
  if (ipRaw) {
    const { count: ipHits } = await supabase
      .from("abuse_events")
      .select("id", { count: "exact", head: true })
      .eq("scope", "chapter_delegate")
      .eq("ip", ipRaw)
      .gte("occurred_at", since);
    if ((ipHits ?? 0) >= RATE_MAX_PER_IP) {
      return { error: "Too many requests. Please try again in a minute." };
    }
  }
  await supabase
    .from("abuse_events")
    .insert({ scope: "chapter_delegate", key: email, ip: ipRaw });

  // 4. Resolve the event by slug and confirm the program is enabled.
  const { data: event } = await supabase
    .from("events")
    .select(
      "id, title_en, title_de, title_fr, starts_at, ends_at, chapter_delegate_program_enabled"
    )
    .eq("slug", input.eventSlug)
    .single();
  if (!event) return { error: "Event not found." };
  if (!event.chapter_delegate_program_enabled) {
    return {
      error: "Chapter delegate registration is closed for this event.",
    };
  }

  // 5. Upsert contacts (delegate + optional companion) via the existing RPC.
  //    Both rows go in; tickets are only issued once an admin approves.
  const { data: delegateContactId } = await supabase.rpc(
    "upsert_contact_from_checkout",
    {
      p_email: email,
      p_first_name: firstName,
      p_last_name: lastName,
      p_phone: null,
      p_country: chapter,
      p_extra_category_slugs: ["invited_guests"],
    }
  );
  if (!delegateContactId) {
    return { error: "Couldn't save your contact details." };
  }

  let companionContactId: string | null = null;
  if (companionPayload) {
    const { data: companionId } = await supabase.rpc(
      "upsert_contact_from_checkout",
      {
        p_email: companionPayload.email,
        p_first_name: companionPayload.firstName,
        p_last_name: companionPayload.lastName,
        p_phone: null,
        p_country: chapter,
        p_extra_category_slugs: ["invited_guests"],
      }
    );
    companionContactId = companionId ?? null;
  }

  // 6. Insert involvement rows in pending_approval status.
  const submissionMetadata = {
    user_agent: ua,
    locale: input.locale,
    chapter_lead_name: leadName,
    chapter_lead_email: leadEmail,
    brings_companion: !!companionPayload,
  };

  const { data: delegateInvolvement, error: insertDelegateErr } = await supabase
    .from("contact_event_involvements")
    .insert({
      contact_id: delegateContactId,
      event_id: event.id,
      role: "chapter_delegate",
      status: "pending_approval",
      chapter_country: chapter,
      chapter_position: position,
      companion_contact_id: companionContactId,
      submission_ip: ipRaw,
      submission_metadata: submissionMetadata,
      chapter_lead_email: leadEmail,
      chapter_lead_name: leadName,
    })
    .select("id")
    .single();
  if (insertDelegateErr || !delegateInvolvement) {
    return {
      error:
        "Couldn't save your registration. Please try again or contact us.",
    };
  }

  if (companionContactId) {
    await supabase.from("contact_event_involvements").insert({
      contact_id: companionContactId,
      event_id: event.id,
      role: "delegate_companion",
      status: "pending_approval",
      chapter_country: chapter,
      submission_ip: ipRaw,
      submission_metadata: { delegate_involvement_id: delegateInvolvement.id },
    });
  }

  // 7. Notify Germany admin.
  try {
    await notifyAdmins(supabase, {
      // Reuses the generic "new_application" notification channel so admins
      // get a ping in-app + email without us inventing a new notification
      // type. Body makes the chapter-delegate context explicit.
      type: "new_application",
      title: `New chapter delegate: ${firstName} ${lastName} (${chapter})`,
      body: `Position: ${position}\nEmail: ${email}\nCompanion: ${
        companionPayload
          ? `${companionPayload.firstName} ${companionPayload.lastName} <${companionPayload.email}>`
          : "—"
      }\nChapter lead: ${leadEmail ?? "—"}\n\nReview at /admin/${input.locale}/chapter-delegates`,
      data: {
        kind: "chapter_delegate_pending",
        involvement_id: delegateInvolvement.id,
        event_id: event.id,
        chapter,
      },
    });
  } catch (err) {
    console.error("[chapter-delegate] notifyAdmins failed:", err);
  }

  return { success: true };
}
