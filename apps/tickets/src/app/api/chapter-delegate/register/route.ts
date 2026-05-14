import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createServerClient, notifyAdmins } from "@dbc/supabase/server";
import { captureServerError } from "@/lib/observe";

// Hardcoded list of ISO-3166 alpha-2 codes for the countries DBC has a
// chapter in. Mirrors packages/ui/src/chapter-select.tsx
// DBC_CHAPTER_COUNTRY_CODES exactly, but inlined here because importing
// the @dbc/ui constant via a "use client" boundary into this route
// handler broke Turbopack's page-data collection
// ("function is not iterable" on new Set(undefined)). The select on the
// public form is the authoritative source of valid options — this is just
// the server-side validation gate to reject hand-crafted POSTs. Update
// both lists in lockstep when a chapter is added.
const DBC_CHAPTER_COUNTRY_CODES = [
  "DE", "FR", "CA", "BE", "GA", "CD", "SN", "US", "GB", "NO", "ZA", "CI",
] as const;

// ---------------------------------------------------------------------------
// Why this exists as a regular route handler (and not a server action):
//
// Across two production deploys of this app on 2026-05-14/15, Next.js server
// actions kept producing "Server action not found." (HTTP 404) for the
// chapter-delegate form even with NEXT_SERVER_ACTIONS_ENCRYPTION_KEY pinned.
// Root cause: each build's action-ID map is keyed off both the encryption
// key AND the build, so a tab that loaded against build N still references
// an action ID build N+1 doesn't know about — and Vercel's rolling deploys
// guarantee that during the transition window, page-loads and form-submits
// can land on different builds. The user kept hitting the static error
// screen every time their team tried to register.
//
// A plain HTTP POST to a route handler has no opaque action ID — the URL
// is the contract, the contract is stable across deploys, the form works.
// This is a DELIBERATE divergence from the SSOT for this one form because
// reliability beats consistency when an event team needs to register today.
//
// The logic below is intentionally inline (NOT imported from the
// "use server" actions/chapter-delegate.ts file) — importing a "use server"
// module from a regular route handler breaks the Turbopack build at
// page-data collection time.
// ---------------------------------------------------------------------------

const CHAPTER_SET = new Set<string>(DBC_CHAPTER_COUNTRY_CODES);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface RegisterInput {
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
}

export async function POST(request: Request) {
  let input: RegisterInput;
  try {
    input = (await request.json()) as RegisterInput;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  try {
    // Silent honeypot — bots fill any field labelled "website".
    if (input.honeypot && input.honeypot.trim().length > 0) {
      return NextResponse.json({ success: true });
    }

    const firstName = (input.firstName || "").trim();
    const lastName = (input.lastName || "").trim();
    const email = (input.email || "").trim().toLowerCase();
    const position = (input.position || "").trim();
    const chapter = (input.chapterCountry || "").trim().toUpperCase();
    const leadName = input.chapterLeadName?.trim() || null;
    const leadEmail = input.chapterLeadEmail?.trim().toLowerCase() || null;

    if (!firstName || !lastName || !email || !position) {
      return NextResponse.json({
        error: "Please fill in name, email and position.",
      });
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({
        error: "Please enter a valid email address.",
      });
    }
    if (!CHAPTER_SET.has(chapter)) {
      return NextResponse.json({
        error: "Please pick a branch from the list.",
      });
    }
    if (!input.consent) {
      return NextResponse.json({
        error: "Please confirm your team membership to continue.",
      });
    }
    if (leadEmail && !EMAIL_RE.test(leadEmail)) {
      return NextResponse.json({
        error: "Branch Ambassador email looks invalid.",
      });
    }

    let companionPayload:
      | { firstName: string; lastName: string; email: string }
      | null = null;
    if (input.bringsCompanion) {
      const cfn = input.companionFirstName?.trim() ?? "";
      const cln = input.companionLastName?.trim() ?? "";
      const cem = input.companionEmail?.trim().toLowerCase() ?? "";
      if (!cfn || !cln || !cem) {
        return NextResponse.json({
          error: "Please complete the companion's details, or untick the +1.",
        });
      }
      if (!EMAIL_RE.test(cem)) {
        return NextResponse.json({ error: "Companion email looks invalid." });
      }
      if (cem === email) {
        return NextResponse.json({
          error: "Companion email must differ from yours.",
        });
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

    // Resolve event by slug.
    const { data: event } = await supabase
      .from("events")
      .select(
        "id, title_en, title_de, title_fr, starts_at, ends_at, chapter_delegate_program_enabled"
      )
      .eq("slug", input.eventSlug)
      .single();
    if (!event) {
      return NextResponse.json({ error: "Event not found." });
    }
    if (!event.chapter_delegate_program_enabled) {
      return NextResponse.json({
        error: "Branch delegate registration is closed for this event.",
      });
    }

    // Upsert delegate contact via SECURITY DEFINER RPC (bypasses RLS).
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
      captureServerError(
        delegateContactErr ??
          new Error("upsert_contact_from_checkout returned no id"),
        {
          scope: "tickets.chapter_delegate.route.upsertContact",
          data: { email, chapter },
        }
      );
      return NextResponse.json({
        error: "Couldn't save your contact details.",
      });
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
        captureServerError(companionErr, {
          scope: "tickets.chapter_delegate.route.upsertCompanion",
          data: { email: companionPayload.email, chapter },
        });
      }
      companionContactId = (companionId as string | null) ?? null;
    }

    const submissionMetadata = {
      user_agent: ua,
      locale: input.locale,
      chapter_lead_name: leadName,
      chapter_lead_email: leadEmail,
      brings_companion: !!companionPayload,
    };

    const { data: delegateInvolvement, error: insertDelegateErr } =
      await supabase
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
      captureServerError(
        insertDelegateErr ??
          new Error("contact_event_involvements insert returned no row"),
        {
          scope: "tickets.chapter_delegate.route.insertInvolvement",
          data: {
            email,
            chapter,
            eventId: event.id,
            delegateContactId,
          },
        }
      );
      return NextResponse.json({
        error:
          "Couldn't save your registration. Please try again or contact us.",
      });
    }

    if (companionContactId) {
      await supabase.from("contact_event_involvements").insert({
        contact_id: companionContactId,
        event_id: event.id,
        role: "delegate_companion",
        status: "pending_approval",
        chapter_country: chapter,
        submission_ip: ipRaw,
        submission_metadata: {
          delegate_involvement_id: delegateInvolvement.id,
        },
      });
    }

    // Fire-and-forget admin notification — the row is durable above; if email
    // dispatch blows up, the registration still counts.
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
        captureServerError(err, {
          scope: "tickets.chapter_delegate.route.notifyAdmins",
          data: {
            involvement_id: delegateInvolvement.id,
            event_id: event.id,
            chapter,
          },
        });
      }
    })();

    return NextResponse.json({ success: true });
  } catch (err) {
    captureServerError(err, {
      scope: "tickets.chapter_delegate.route.submit",
      data: {
        eventSlug: input?.eventSlug ?? null,
        chapterCountry: input?.chapterCountry ?? null,
        emailLen: input?.email?.length ?? 0,
      },
    });
    return NextResponse.json({
      error:
        "We hit an unexpected error saving your registration. Our team has been notified. Please try again, and contact us if it keeps happening.",
    });
  }
}
