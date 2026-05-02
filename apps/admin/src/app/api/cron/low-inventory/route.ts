import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthorisedCronRequest, notifyAdmins } from "@dbc/supabase/server";

// Fires a `low_inventory` admin notification when an active tier crosses its
// per-tier low-stock threshold (low_stock_threshold_pct % of max_quantity).
// Idempotent via an audit_log lookup — we never send the same (tier_id,
// bucket) twice. Sub-buckets at 100/50/25% of the threshold re-trigger as
// inventory continues to drop.
// Runs every 30 min; the scale of this query is tiny (one row per active
// tier across all events), so even a 5-min cadence would be fine later.

const DEFAULT_THRESHOLD_PCT = 20;

export async function GET(req: Request) {
  if (!isAuthorisedCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Find all currently-active tiers for published, upcoming events.
  const nowIso = new Date().toISOString();
  const { data: tiers, error } = await supabase
    .from("ticket_tiers")
    .select(
      "id, event_id, name_en, max_quantity, quantity_sold, low_stock_threshold_pct, sales_end_at, events!inner(id, slug, title_en, starts_at, is_published)"
    )
    .eq("is_public", true)
    .gte("events.starts_at", nowIso)
    .eq("events.is_published", true);

  if (error || !tiers) {
    console.error("[cron/low-inventory] fetch failed:", error);
    return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
  }

  let fired = 0;
  type TierRow = {
    id: string;
    event_id: string;
    name_en: string;
    max_quantity: number | null;
    quantity_sold: number;
    low_stock_threshold_pct: number | null;
    sales_end_at: string | null;
    // Supabase types the nested relation as an array; inner-join guarantees
    // one element at runtime, so we normalise via first-element access below.
    events: { slug: string; title_en: string } | { slug: string; title_en: string }[];
  };
  for (const raw of tiers as unknown as TierRow[]) {
    const ev = Array.isArray(raw.events) ? raw.events[0] : raw.events;
    if (!ev) continue;
    const t = { ...raw, events: ev };
    if (t.max_quantity === null) continue;
    if (t.sales_end_at && new Date(t.sales_end_at) <= new Date()) continue;

    const pct = t.low_stock_threshold_pct ?? DEFAULT_THRESHOLD_PCT;
    const triggerSeats = Math.max(1, Math.ceil((t.max_quantity * pct) / 100));
    const left = t.max_quantity - t.quantity_sold;
    if (left > triggerSeats || left <= 0) continue;

    // Sub-buckets at 100/50/25% of the per-tier threshold so admins get
    // re-notified as inventory keeps dropping.
    const ratio = left / triggerSeats;
    const bucket =
      ratio <= 0.25 ? "low_25" : ratio <= 0.5 ? "low_50" : "low_100";
    const { count } = await supabase
      .from("audit_log")
      .select("id", { count: "exact", head: true })
      .eq("action", "notify_low_inventory")
      .eq("entity_id", t.id)
      .filter("details->>bucket", "eq", bucket);
    if ((count ?? 0) > 0) continue;

    await notifyAdmins(supabase, {
      type: "low_inventory",
      title: `Only ${left} seat${left === 1 ? "" : "s"} left · ${t.name_en}`,
      body: `${t.events.title_en} — ${t.name_en} dropped to ${left}/${t.max_quantity} (${pct}% threshold).`,
      data: {
        tier_id: t.id,
        event_id: t.event_id,
        event_slug: t.events.slug,
        seats_left: left,
        threshold_pct: pct,
        bucket,
      },
    });

    await supabase.from("audit_log").insert({
      action: "notify_low_inventory",
      entity_type: "ticket_tiers",
      entity_id: t.id,
      details: { bucket, seats_left: left, threshold_pct: pct },
    });

    fired += 1;
  }

  return NextResponse.json({ ok: true, fired });
}
