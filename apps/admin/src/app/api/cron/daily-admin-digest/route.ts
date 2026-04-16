import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { dashboardDigestPrompt, setKeyResolver } from "@dbc/ai";

/**
 * Daily admin digest — AI-written KPI summary for admins.
 *
 * Computes yesterday vs day-before deltas for the next upcoming event,
 * asks Claude for a 30-second natural-language digest, and stores it in
 * the `admin_digests` table (new) for the dashboard to surface.
 *
 * Schedule: 06:00 UTC daily (see apps/admin/vercel.json).
 *
 * Required env: CRON_SECRET, ANTHROPIC_API_KEY, Supabase service role.
 *
 * This is the first AI+cron reference implementation. Follow this shape when
 * adding: event-reminders, abandoned-checkout-recovery, post-event-survey,
 * weekly-kpi-report, legal-readiness-check, contact-stale-reminder, etc.
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

  // Let @dbc/ai fall back to the DB-managed key if the env var isn't set.
  // Super admins rotate the key via admin Settings → API keys & secrets.
  setKeyResolver(async () => {
    const { data } = await supabase
      .from("app_secrets")
      .select("value")
      .eq("key", "ANTHROPIC_API_KEY")
      .maybeSingle();
    return data?.value ?? null;
  });

  const now = new Date();
  const today = new Date(now);
  today.setUTCHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const dayBefore = new Date(yesterday);
  dayBefore.setUTCDate(dayBefore.getUTCDate() - 1);

  // Pick the next upcoming event as the focus
  const { data: event } = await supabase
    .from("events")
    .select("id, title_en, starts_at")
    .gte("starts_at", now.toISOString())
    .order("starts_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!event) {
    return NextResponse.json({ skipped: true, reason: "no upcoming event" });
  }
  const eventId = event.id;

  const capacityRow = await supabase
    .from("ticket_tiers")
    .select("max_quantity")
    .eq("event_id", eventId);
  const capacity = (capacityRow.data ?? []).reduce(
    (s, t) => s + (t.max_quantity ?? 0),
    0
  );

  async function periodStats(fromIso: string, toIso: string) {
    const [orders, refunds, checkIns] = await Promise.all([
      supabase
        .from("orders")
        .select("total_cents, status")
        .eq("event_id", eventId)
        .gte("created_at", fromIso)
        .lt("created_at", toIso)
        .in("status", ["paid", "comped"]),
      supabase
        .from("orders")
        .select("total_cents")
        .eq("event_id", eventId)
        .gte("created_at", fromIso)
        .lt("created_at", toIso)
        .eq("status", "refunded"),
      supabase
        .from("tickets")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId)
        .gte("checked_in_at", fromIso)
        .lt("checked_in_at", toIso),
    ]);

    return {
      revenueCents:
        (orders.data ?? []).reduce((s, o) => s + (o.total_cents ?? 0), 0) ?? 0,
      ticketsSold: orders.data?.length ?? 0,
      refundCents:
        (refunds.data ?? []).reduce((s, o) => s + (o.total_cents ?? 0), 0) ?? 0,
      checkInCount: checkIns.count ?? 0,
    };
  }

  const [current, prior] = await Promise.all([
    periodStats(yesterday.toISOString(), today.toISOString()),
    periodStats(dayBefore.toISOString(), yesterday.toISOString()),
  ]);

  const daysUntilEvent = Math.max(
    0,
    Math.ceil(
      (new Date(event.starts_at).getTime() - now.getTime()) / 86400000
    )
  );

  let digest;
  try {
    digest = await dashboardDigestPrompt({
      eventTitle: event.title_en,
      asOf: yesterday.toISOString().slice(0, 10),
      currentPeriod: current,
      priorPeriod: prior,
      capacity,
      daysUntilEvent,
    });
  } catch (err) {
    console.error("Digest generation failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "digest failed" },
      { status: 500 }
    );
  }

  // Persist to admin_digests (create this table in Supabase — see docs/kpis.md
  // Phase A notes). For now, emit via notifyAdmins-style pattern or just log.
  await supabase.from("notifications").insert({
    type: "daily_digest",
    title: `Daily digest — ${event.title_en}`,
    body: digest.summary,
    data: {
      event_id: event.id,
      as_of: yesterday.toISOString(),
      highlights: digest.highlights,
      risks: digest.risks,
    },
  });

  return NextResponse.json({ digest, event: event.id });
}
