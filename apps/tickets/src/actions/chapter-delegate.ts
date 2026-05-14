"use server";

import { headers } from "next/headers";
import { createServerClient, notifyAdmins } from "@dbc/supabase/server";
import { DBC_CHAPTER_COUNTRY_CODES } from "@dbc/ui";
import { captureServerError } from "@/lib/observe";

// Anti-bot policy for this form: honeypot only. User decision — this is an
// internal-team registration form, not a high-value target. Rate-limiting
// against abuse_events (inet column, separate insert path) and Cloudflare
// Turnstile verification both used to live here and were each one more
// surface that could throw and break the whole submission for a real
// branch teammate. The honeypot field below (`<input name="website">`
// hidden via CSS) catches automated submissions; everything else is a
// silent drop with no extra round-trips.

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
  /**
   * Kept on the input shape so the existing client form can still pass it
   * during the deploy transition; the server intentionally ignores it.
   * Cloudflare Turnstile is not configured on the tickets Vercel project
   * (no TURNSTILE_SECRET_KEY), so verifying was always a no-op.
   */
  turnstileToken?: string;
}

export async function submitChapterDelegateRegistration(
  input: ChapterDelegateInput
): Promise<{ success?: true; error?: string }> {
  try {
    return await submitChapterDelegateRegistrationImpl(input);
  } catch (err) {
    // Defensive shell — every prior throw in this action surfaced as
    // /[locale]/error.tsx ("Something went wrong"), giving the operator
    // no way to triage and no row landing in admin. Catch every uncaught
    // exception, capture the real cause to Sentry with the input shape,
    // and return a structured banner so the form renders inline.
    captureServerError(err, {
      scope: "tickets.chapter_delegate.submit",
      data: {
        eventSlug: input?.eventSlug ?? null,
        chapterCountry: input?.chapterCountry ?? null,
        emailLen: input?.email?.length ?? 0,
        bringsCompanion: !!input?.bringsCompanion,
      },
    });
    return {
      error:
        "We hit an unexpected error saving your registration. Our team has been notified. Please try again, and contact us if it keeps happening.",
    };
  }
}

async function submitChapterDelegateRegistrationImpl(
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
    return { error: "Please pick a branch from the list." };
  }
  if (!input.consent) {
    return { error: "Please confirm your team membership to continue." };
  }
  if (leadEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leadEmail)) {
    return { error: "Branch Ambassador email looks invalid." };
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

  // turnstileToken intentionally not verified server-side — see comment on
  // ChapterDelegateInput.turnstileToken. Honeypot above is the active defence.
  void input.turnstileToken;

  // 2. Resolve the event by slug and confirm the program is enabled.
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
      error: "Branch delegate registration is closed for this event.",
    };
  }

  // 5. Upsert contacts (delegate + optional companion) via the existing RPC.
  //    Both rows go in; tickets are only issued once an admin approves.
  //    Note: the RPC signature is (p_email, p_first_name, p_last_name,
  //    p_country, p_birthday, p_gender, p_occupation, p_auto_category_slug,
  //    p_extra_category_slugs) — there is no p_phone. Phone goes onto the
  //    contact later via a separate update if needed.
  const { data: delegateContactId, error: delegateContactErr } =
    await supabase.rpc("upsert_contact_from_checkout", {
      p_email: email,
      p_first_name: firstName,
      p_last_name: lastName,
      p_country: chapter,
      p_extra_category_slugs: ["invited_guests"],
      p_locale: input.locale,
    });
  if (delegateContactErr || !delegateContactId) {
    console.error(
      "[chapterDelegate] upsert_contact_from_checkout (delegate) failed:",
      delegateContactErr
    );
    captureServerError(delegateContactErr ?? new Error("upsert_contact_from_checkout returned no id"), {
      scope: "tickets.chapter_delegate.upsertContact",
      data: { email, chapter },
    });
    return { error: "Couldn't save your contact details." };
  }

  let companionContactId: string | null = null;
  if (companionPayload) {
    const { data: companionId, error: companionErr } = await supabase.rpc(
      "upsert_contact_from_checkout",
      {
        p_email: companionPayload.email,
        p_first_name: companionPayload.firstName,
        p_last_name: companionPayload.lastName,
        p_country: chapter,
        p_extra_category_slugs: ["invited_guests"],
        p_locale: input.locale,
      }
    );
    if (companionErr) {
      console.error(
        "[chapterDelegate] upsert_contact_from_checkout (companion) failed:",
        companionErr
      );
    }
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
    console.error(
      "[chapterDelegate] contact_event_involvements insert failed:",
      insertDelegateErr
    );
    captureServerError(insertDelegateErr ?? new Error("contact_event_involvements insert returned no row"), {
      scope: "tickets.chapter_delegate.insertInvolvement",
      data: { email, chapter, eventId: event.id, delegateContactId },
    });
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

  // 7. Notify Germany admin — fire-and-forget. The row is already saved; if
  // the notification dispatch throws (Sentry has seen RangeError on this code
  // path), it must never bubble to the action's return path and block the
  // success banner. We log + capture, then return success unconditionally.
  void (async () => {
    try {
      await notifyAdmins(supabase, {
        type: "new_application",
        title: `New chapter delegate: ${firstName} ${lastName} (${chapter})`,
        body: `Position: ${position}\nEmail: ${email}\nCompanion: ${
          companionPayload
            ? `${companionPayload.firstName} ${companionPayload.lastName} <${companionPayload.email}>`
            : "—"
        }\nBranch Ambassador: ${leadEmail ?? "—"}\n\nReview at /admin/${input.locale}/chapter-delegates`,
        data: {
          kind: "chapter_delegate_pending",
          involvement_id: delegateInvolvement.id,
          event_id: event.id,
          chapter,
        },
      });
    } catch (err) {
      console.error("[chapter-delegate] notifyAdmins failed:", err);
      captureServerError(err, {
        scope: "tickets.chapter_delegate.notifyAdmins",
        data: {
          involvement_id: delegateInvolvement.id,
          event_id: event.id,
          chapter,
        },
      });
    }
  })();

  return { success: true };
}
