import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthorisedCronRequest } from "@dbc/supabase/server";
import { sendAskSpeakersPromptForOrder } from "@/lib/send-ask-speakers-prompt";

/**
 * Cron endpoint that dispatches the "ask a speaker a question" prompt.
 *
 * Send window per order:
 *   - Lower bound: order.created_at + 24h (don't pile this on top of the
 *     ticket-delivery email; give the buyer a day to settle in).
 *   - Upper bound: event.starts_at - 48h (speakers need time to prep).
 *
 * Orders that fall outside this window at cron time are either:
 *   - Already handled by the Stripe-webhook late-purchase branch
 *     (event 48-72h away at purchase time), or
 *   - Intentionally skipped (purchase within 48h of event).
 *
 * Schedule: daily 10:30 UTC (12:30 Berlin) — 30 min after `email-sequences`
 * to avoid Resend rate collisions.
 */
export async function GET(request: Request) {
  if (!isAuthorisedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = Date.now();
  const lowerBoundIso = new Date(now - 24 * 3_600_000).toISOString();
  const upperBoundIso = new Date(now + 48 * 3_600_000).toISOString();

  // 1. Orders past their 24h purchase delay, paid/comped, prompt not sent.
  const { data: candidates, error } = await supabase
    .from("orders")
    .select("id, event_id")
    .in("status", ["paid", "comped"])
    .is("ask_speaker_email_sent_at", null)
    .lte("created_at", lowerBoundIso)
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!candidates || candidates.length === 0) {
    return NextResponse.json({ ok: true, dispatched: 0 });
  }

  // 2. Filter to events that are still ≥ 48h away.
  const eventIds = [...new Set(candidates.map((o) => o.event_id))];
  const { data: events } = await supabase
    .from("events")
    .select("id")
    .in("id", eventIds)
    .gte("starts_at", upperBoundIso);

  const eligibleEventIds = new Set((events ?? []).map((e) => e.id));
  const due = candidates.filter((o) => eligibleEventIds.has(o.event_id));

  if (due.length === 0) {
    return NextResponse.json({ ok: true, dispatched: 0 });
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const order of due) {
    try {
      const result = await sendAskSpeakersPromptForOrder(supabase, order.id);
      if (result.sent) sent += 1;
      else skipped += 1;
    } catch (err) {
      failed += 1;
      console.error(
        "[ask-speakers-prompts] send failed for order",
        order.id,
        (err as Error)?.message ?? err
      );
    }
  }

  return NextResponse.json({
    ok: failed === 0,
    dispatched: due.length,
    sent,
    skipped,
    failed,
  });
}
