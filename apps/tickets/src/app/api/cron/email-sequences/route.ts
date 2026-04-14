import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createEmailClient } from "@dbc/email";

/**
 * Cron endpoint that dispatches due post-event email sequences.
 *
 * A sequence is due when:
 *   - is_active = true
 *   - sent_at IS NULL
 *   - event.ends_at + delay_days <= now()
 *
 * Protected by CRON_SECRET (Vercel cron authorization header).
 * Schedule in vercel.json: every hour via `0 * * * *`.
 */
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch all unsent active sequences with their event end time
  const { data: sequences, error } = await supabase
    .from("event_email_sequences")
    .select(
      "id, event_id, delay_days, subject_en, subject_de, subject_fr, body_en, body_de, body_fr"
    )
    .eq("is_active", true)
    .is("sent_at", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!sequences || sequences.length === 0) {
    return NextResponse.json({ dispatched: 0 });
  }

  // Fetch events in one go
  const eventIds = [...new Set(sequences.map((s) => s.event_id))];
  const { data: events } = await supabase
    .from("events")
    .select("id, ends_at")
    .in("id", eventIds);

  const eventEndsMap = new Map(
    (events ?? []).map((e) => [e.id, new Date(e.ends_at).getTime()])
  );

  const now = Date.now();
  const dayMs = 86400000;

  // Filter to sequences whose event+delay is now in the past
  const dueSequences = sequences.filter((seq) => {
    const endsAt = eventEndsMap.get(seq.event_id);
    if (!endsAt) return false;
    return endsAt + seq.delay_days * dayMs <= now;
  });

  if (dueSequences.length === 0) {
    return NextResponse.json({ dispatched: 0 });
  }

  const resend = createEmailClient();
  const fromAddress =
    process.env.RESEND_FROM_ADDRESS ??
    "DBC Germany <hello@dbc-germany.com>";

  let totalSent = 0;
  let totalFailed = 0;

  for (const seq of dueSequences) {
    // Fetch recipients (distinct by email, with their order locale)
    const { data: orders } = await supabase
      .from("orders")
      .select("recipient_email, recipient_name, locale")
      .eq("event_id", seq.event_id)
      .in("status", ["paid", "comped"]);

    if (!orders || orders.length === 0) {
      await supabase
        .from("event_email_sequences")
        .update({ sent_at: new Date().toISOString() })
        .eq("id", seq.id);
      continue;
    }

    const seen = new Set<string>();
    for (const order of orders) {
      if (seen.has(order.recipient_email)) continue;
      seen.add(order.recipient_email);

      const recipientLocale = (order.locale as "en" | "de" | "fr") ?? "en";
      const subject =
        (seq[`subject_${recipientLocale}` as keyof typeof seq] as string) ||
        seq.subject_en;
      const bodyTemplate =
        (seq[`body_${recipientLocale}` as keyof typeof seq] as string) ||
        seq.body_en;
      const body = bodyTemplate.replace(/\{name\}/g, order.recipient_name);

      try {
        const result = await resend.emails.send({
          from: fromAddress,
          to: order.recipient_email,
          subject,
          html: `<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#111;"><p>Hi ${order.recipient_name},</p><div style="white-space:pre-wrap;line-height:1.6;">${body}</div><hr style="margin:24px 0;border:none;border-top:1px solid #e5e5e5;"/><p style="font-size:12px;color:#737373;">DBC Germany (UG i.G.)</p></div>`,
        });
        if (result.error) totalFailed += 1;
        else totalSent += 1;
      } catch (err) {
        totalFailed += 1;
        console.error("Cron email failure:", err);
      }
    }

    await supabase
      .from("event_email_sequences")
      .update({ sent_at: new Date().toISOString() })
      .eq("id", seq.id);
  }

  return NextResponse.json({
    dispatched: dueSequences.length,
    sent: totalSent,
    failed: totalFailed,
  });
}
