import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Daily cron: materialise KPI data into `kpi_snapshots` for every event that
 * had activity (orders, tickets, check-ins, or analytics events) since
 * yesterday midnight UTC.
 *
 * Idempotent via `UNIQUE (event_id, snapshot_date)` + `ON CONFLICT UPDATE`.
 *
 * Schedule: `0 2 * * *` (02:00 UTC daily).
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

  // Snapshot date is "yesterday" (the day that just finished), UTC.
  const now = new Date();
  const snapshotDay = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1)
  );
  const dayStart = snapshotDay.toISOString();
  const dayEnd = new Date(snapshotDay.getTime() + 86400000).toISOString();
  const snapshotDate = dayStart.slice(0, 10); // YYYY-MM-DD

  // 1. Every event that exists (we write one snapshot per event per day so
  //    the reports page can aggregate consistently). Skip events older than
  //    90 days past their end — no new activity expected.
  const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString();
  const { data: events } = await supabase
    .from("events")
    .select("id")
    .gte("ends_at", ninetyDaysAgo);

  if (!events || events.length === 0) {
    return NextResponse.json({ snapshots: 0 });
  }

  let written = 0;

  for (const event of events) {
    // Tickets sold IN THIS DAY (tickets created_at within the window).
    const { count: ticketsSold } = await supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("event_id", event.id)
      .gte("created_at", dayStart)
      .lt("created_at", dayEnd);

    // Revenue: paid orders created today.
    const { data: paidOrders } = await supabase
      .from("orders")
      .select("total_cents")
      .eq("event_id", event.id)
      .eq("status", "paid")
      .gte("created_at", dayStart)
      .lt("created_at", dayEnd);

    const revenueCents = (paidOrders ?? []).reduce(
      (sum, o) => sum + (o.total_cents ?? 0),
      0
    );

    // Check-ins today.
    const { count: checkIns } = await supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("event_id", event.id)
      .gte("checked_in_at", dayStart)
      .lt("checked_in_at", dayEnd);

    // Unique visitors: distinct session_id from analytics_events that touched
    // this event today. Best-effort — the analytics_events table may be empty.
    const { data: sessions } = await supabase
      .from("analytics_events")
      .select("session_id")
      .eq("properties->>event_id", event.id)
      .gte("created_at", dayStart)
      .lt("created_at", dayEnd);

    const uniqueVisitors = new Set(
      (sessions ?? []).map((s) => s.session_id).filter(Boolean)
    ).size;

    const { error } = await supabase
      .from("kpi_snapshots")
      .upsert(
        {
          event_id: event.id,
          snapshot_date: snapshotDate,
          tickets_sold: ticketsSold ?? 0,
          revenue_cents: revenueCents,
          check_ins: checkIns ?? 0,
          unique_visitors: uniqueVisitors,
        },
        { onConflict: "event_id,snapshot_date" }
      );

    if (error) {
      console.error(
        `Failed to upsert kpi_snapshot for event ${event.id}:`,
        error
      );
    } else {
      written += 1;
    }
  }

  return NextResponse.json({ snapshots: written, date: snapshotDate });
}
