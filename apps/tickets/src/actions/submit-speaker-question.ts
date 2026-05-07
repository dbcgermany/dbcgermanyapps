"use server";

import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { notifyAdmins } from "@dbc/supabase/server";
import { captureServerError } from "@/lib/observe";

// Self-service "ask a speaker a question" submission. The route is
// gated by `tickets.ticket_token` (UUID v4 — same bearer model as the
// PDF download route). We rate-limit aggressively to keep this from
// becoming a spam vector for anyone with a leaked link.
//
// Per-ticket lifetime cap: 3 questions total. Per-ticket-per-window:
// 3 / hour, 10 / 24h via abuse_events (mirrors resend-confirmation).
const SUBMIT_WINDOW_SHORT_SECONDS = 60 * 60;
const SUBMIT_WINDOW_LONG_SECONDS = 24 * 60 * 60;
const SUBMIT_MAX_SHORT = 3;
const SUBMIT_MAX_LONG = 10;
const PER_TICKET_LIFETIME_CAP = 3;

const TOKEN_RE = /^[0-9a-fA-F-]{32,40}$/;
const UUID_RE = /^[0-9a-fA-F-]{32,40}$/;

interface SubmitInput {
  ticketToken: string;
  speakerId: string;
  question: string;
}

interface SubmitResult {
  ok?: true;
  error?: string;
  remaining?: number;
}

export async function submitSpeakerQuestion(
  input: SubmitInput
): Promise<SubmitResult> {
  if (!input.ticketToken || !TOKEN_RE.test(input.ticketToken)) {
    return { error: "Invalid ticket." };
  }
  if (!input.speakerId || !UUID_RE.test(input.speakerId)) {
    return { error: "Invalid speaker." };
  }
  const question = (input.question ?? "").trim();
  if (question.length < 10 || question.length > 2000) {
    return { error: "Question must be between 10 and 2000 characters." };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: ticket } = await supabase
    .from("tickets")
    .select("id, order_id, event_id, attendee_name, attendee_email")
    .eq("ticket_token", input.ticketToken)
    .maybeSingle();

  if (!ticket) {
    return { error: "Ticket not found." };
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, locale")
    .eq("id", ticket.order_id)
    .maybeSingle();

  if (!order || (order.status !== "paid" && order.status !== "comped")) {
    return { error: "Order not paid yet." };
  }

  const { data: event } = await supabase
    .from("events")
    .select("id, ends_at")
    .eq("id", ticket.event_id)
    .maybeSingle();

  if (!event) {
    return { error: "Event not found." };
  }
  if (new Date(event.ends_at).getTime() <= Date.now()) {
    return { error: "Submissions are closed for this event." };
  }

  // The composite FK on speaker_questions → event_speakers is the DB
  // belt; this is the suspenders so we return a clean error before
  // burning a Resend / abuse_events row on a junk submission.
  const { data: link } = await supabase
    .from("event_speakers")
    .select("speaker_id")
    .eq("event_id", ticket.event_id)
    .eq("speaker_id", input.speakerId)
    .maybeSingle();
  if (!link) {
    return { error: "Speaker is not on this event." };
  }

  const { count: lifetimeCount } = await supabase
    .from("speaker_questions")
    .select("id", { count: "exact", head: true })
    .eq("ticket_id", ticket.id);
  if ((lifetimeCount ?? 0) >= PER_TICKET_LIFETIME_CAP) {
    return {
      error: `You can submit up to ${PER_TICKET_LIFETIME_CAP} questions per ticket.`,
      remaining: 0,
    };
  }

  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    hdrs.get("x-real-ip") ??
    null;

  const sinceShort = new Date(
    Date.now() - SUBMIT_WINDOW_SHORT_SECONDS * 1000
  ).toISOString();
  const sinceLong = new Date(
    Date.now() - SUBMIT_WINDOW_LONG_SECONDS * 1000
  ).toISOString();

  const { count: shortHits } = await supabase
    .from("abuse_events")
    .select("id", { count: "exact", head: true })
    .eq("scope", "speaker_question")
    .eq("key", ticket.id)
    .gte("occurred_at", sinceShort);
  if ((shortHits ?? 0) >= SUBMIT_MAX_SHORT) {
    return { error: "Please wait a moment before submitting another question." };
  }

  const { count: longHits } = await supabase
    .from("abuse_events")
    .select("id", { count: "exact", head: true })
    .eq("scope", "speaker_question")
    .eq("key", ticket.id)
    .gte("occurred_at", sinceLong);
  if ((longHits ?? 0) >= SUBMIT_MAX_LONG) {
    return {
      error:
        "You've submitted multiple questions today. Please come back tomorrow if you have more.",
    };
  }

  await supabase
    .from("abuse_events")
    .insert({ scope: "speaker_question", key: ticket.id, ip });

  const locale = (order.locale as "en" | "de" | "fr") ?? "en";

  try {
    const { data: inserted, error: insertError } = await supabase
      .from("speaker_questions")
      .insert({
        event_id: ticket.event_id,
        speaker_id: input.speakerId,
        ticket_id: ticket.id,
        order_id: ticket.order_id,
        attendee_name: ticket.attendee_name ?? "",
        attendee_email: ticket.attendee_email ?? "",
        locale,
        question,
      })
      .select("id")
      .single();
    if (insertError || !inserted) {
      throw insertError ?? new Error("Failed to insert question.");
    }

    await supabase.from("audit_log").insert({
      action: "speaker_question_submitted",
      entity_type: "speaker_questions",
      entity_id: inserted.id,
      details: {
        event_id: ticket.event_id,
        speaker_id: input.speakerId,
        ticket_id: ticket.id,
      },
    });

    // Notify admins (in-app only by default — see NOTIFICATION_DEFAULTS).
    try {
      const { data: speaker } = await supabase
        .from("speakers")
        .select("first_name, last_name")
        .eq("id", input.speakerId)
        .maybeSingle();
      const speakerName = speaker
        ? `${speaker.first_name} ${speaker.last_name}`.trim()
        : "a speaker";
      await notifyAdmins(supabase, {
        type: "speaker_question",
        title: `New question for ${speakerName}`,
        body:
          question.length > 120 ? `${question.slice(0, 117)}…` : question,
        data: {
          event_id: ticket.event_id,
          speaker_id: input.speakerId,
          question_id: inserted.id,
          admin_href: `/en/events/${ticket.event_id}/questions`,
        },
      });
    } catch (err) {
      // Non-fatal — the question is already saved.
      console.error(
        "[submit-speaker-question] notifyAdmins failed:",
        (err as Error)?.message ?? err
      );
    }

    return { ok: true, remaining: PER_TICKET_LIFETIME_CAP - ((lifetimeCount ?? 0) + 1) };
  } catch (err) {
    captureServerError(err, {
      scope: "submit_speaker_question",
      data: { ticket_id: ticket.id, event_id: ticket.event_id },
    });
    return {
      error: "Could not submit your question right now. Please try again.",
    };
  }
}
