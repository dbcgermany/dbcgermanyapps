import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthorisedCronRequest } from "@dbc/supabase/server";
import { sendTicketsForOrder } from "@dbc/email";

/**
 * P1.5 — Recovery sweeper. The Stripe webhook fires fulfilment inside an
 * `after()` block which is fire-and-forget; if `sendTicketsForOrder()`
 * throws inside that block (PDF render error, Resend outage, etc.),
 * Stripe is already 200'd and won't retry. The order sits at status=paid
 * with `email_sent_at IS NULL` forever and the buyer never gets their PDF.
 *
 * This cron runs every 5 minutes, picks up any paid order older than 5 min
 * with no `email_sent_at` stamp, and re-runs the ticket-send. The
 * per-ticket idempotency stamps on `tickets.email_sent_at` mean a partial
 * success won't re-deliver tickets that already went out — only the
 * missing ones.
 */
export async function GET(request: Request) {
  if (!isAuthorisedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 5 minute grace period: don't compete with the in-flight after() handler.
  const cutoffIso = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { data: stuck, error } = await supabase
    .from("orders")
    .select("id")
    .eq("status", "paid")
    .is("email_sent_at", null)
    .lt("updated_at", cutoffIso)
    .order("updated_at", { ascending: true })
    .limit(50);

  if (error) {
    console.error("[finish-stuck-orders] find failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let recovered = 0;
  let failed = 0;
  const failures: { order_id: string; error: string }[] = [];

  for (const order of stuck ?? []) {
    try {
      await sendTicketsForOrder(supabase, order.id);
      recovered += 1;
    } catch (err) {
      failed += 1;
      const msg = err instanceof Error ? err.message : String(err);
      failures.push({ order_id: order.id, error: msg });
      console.error(
        `[finish-stuck-orders] resend failed for ${order.id}:`,
        msg
      );
    }
  }

  if (recovered > 0 || failed > 0) {
    await supabase.from("audit_log").insert({
      action: "finish_stuck_orders",
      entity_type: "orders",
      entity_id: null,
      details: {
        scanned: stuck?.length ?? 0,
        recovered,
        failed,
        failures,
      },
    });
  }

  return NextResponse.json({
    ok: true,
    scanned: stuck?.length ?? 0,
    recovered,
    failed,
  });
}
