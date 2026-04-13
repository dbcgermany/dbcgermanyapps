import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Sweeper: releases inventory for pending orders whose reservation has
 * expired. Runs every 5 minutes. Race-safe — the UPDATE atomically flips
 * the order from `pending` → `cancelled`, so a simultaneous Stripe webhook
 * can't double-process. If the UPDATE returns zero rows we skip the
 * release.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1) Find candidates (pending, past their reservation window).
  const { data: candidates, error: findErr } = await supabase
    .from("orders")
    .select("id, event_id, coupon_id")
    .eq("status", "pending")
    .not("reservation_expires_at", "is", null)
    .lt("reservation_expires_at", new Date().toISOString())
    .limit(200);

  if (findErr) {
    console.error("release-reservations: find failed", findErr);
    return NextResponse.json({ error: findErr.message }, { status: 500 });
  }

  let released = 0;
  let skipped = 0;

  for (const order of candidates ?? []) {
    // 2) Atomically claim this order (only if still pending + expired).
    const { data: claimed } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        reservation_expires_at: null,
      })
      .eq("id", order.id)
      .eq("status", "pending")
      .lt("reservation_expires_at", new Date().toISOString())
      .select("id")
      .maybeSingle();

    if (!claimed) {
      skipped += 1;
      continue;
    }

    // 3) Release tier inventory — count tickets per tier, release each.
    const { data: tickets } = await supabase
      .from("tickets")
      .select("tier_id")
      .eq("order_id", order.id);

    const tierCounts: Record<string, number> = {};
    for (const ticket of tickets ?? []) {
      tierCounts[ticket.tier_id] = (tierCounts[ticket.tier_id] || 0) + 1;
    }
    for (const [tierId, qty] of Object.entries(tierCounts)) {
      await supabase.rpc("release_tickets", {
        p_tier_id: tierId,
        p_quantity: qty,
      });
    }

    // 4) Audit: mark the release.
    await supabase.from("audit_log").insert({
      action: "reservation_released",
      entity_type: "orders",
      entity_id: order.id,
      details: {
        event_id: order.event_id,
        released_tiers: tierCounts,
      },
    });

    released += 1;
  }

  return NextResponse.json({ released, skipped });
}
