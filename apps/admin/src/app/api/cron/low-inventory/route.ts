import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { notifyAdmins } from "@dbc/supabase/server";

const CRON_SECRET = process.env.CRON_SECRET;

// Fires a `low_inventory` admin notification the FIRST time an active tier
// drops below LOW_INVENTORY_THRESHOLD remaining seats. Idempotent via an
// audit_log lookup — we never send the same (tier_id, threshold) twice.
// Runs every 30 min; the scale of this query is tiny (one row per active
// tier across all events), so even a 5-min cadence would be fine later.

const LOW_INVENTORY_THRESHOLD = 20;

export async function GET(req: Request) {
  if (
    CRON_SECRET &&
    req.headers.get("authorization") !== `Bearer ${CRON_SECRET}`
  ) {
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
      "id, event_id, name_en, max_quantity, quantity_sold, sales_end_at, events!inner(id, slug, title_en, starts_at, is_published)"
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
    const left = t.max_quantity - t.quantity_sold;
    if (left > LOW_INVENTORY_THRESHOLD || left <= 0) continue;
    if (t.sales_end_at && new Date(t.sales_end_at) <= new Date()) continue;

    // Idempotent check — did we already notify for this tier's current
    // low-inventory state? Re-trigger only if inventory dropped further
    // (separate buckets: <=20, <=10, <=5).
    const bucket =
      left <= 5 ? "low_5" : left <= 10 ? "low_10" : "low_20";
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
      body: `${t.events.title_en} — ${t.name_en} dropped to ${left}/${t.max_quantity}.`,
      data: {
        tier_id: t.id,
        event_id: t.event_id,
        event_slug: t.events.slug,
        seats_left: left,
        bucket,
      },
    });

    await supabase.from("audit_log").insert({
      action: "notify_low_inventory",
      entity_type: "ticket_tiers",
      entity_id: t.id,
      details: { bucket, seats_left: left },
    });

    fired += 1;
  }

  return NextResponse.json({ ok: true, fired });
}
