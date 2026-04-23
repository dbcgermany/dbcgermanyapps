import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { notifyAdmins } from "@dbc/supabase/server";

const CRON_SECRET = process.env.CRON_SECRET;

// Fires admin event-reminder notifications at 30 / 7 / 1 days before any
// published upcoming event. Runs daily. Idempotent via an audit_log row
// per (event_id, days_out).

const DAYS_OUT = [30, 7, 1] as const;

function dayDiff(a: Date, b: Date): number {
  const MS = 24 * 60 * 60 * 1000;
  return Math.round((a.getTime() - b.getTime()) / MS);
}

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

  const now = new Date();
  const horizonDays = Math.max(...DAYS_OUT) + 1;
  const horizon = new Date(now.getTime() + horizonDays * 86400000).toISOString();

  const { data: events } = await supabase
    .from("events")
    .select("id, slug, title_en, starts_at, is_published")
    .eq("is_published", true)
    .gte("starts_at", now.toISOString())
    .lte("starts_at", horizon);

  let fired = 0;
  for (const e of events ?? []) {
    const days = dayDiff(new Date(e.starts_at), now);
    const match = DAYS_OUT.find((d) => days === d);
    if (!match) continue;

    const { count: already } = await supabase
      .from("audit_log")
      .select("id", { count: "exact", head: true })
      .eq("action", "notify_admin_event_reminder")
      .eq("entity_id", e.id)
      .filter("details->>days_out", "eq", String(match));
    if ((already ?? 0) > 0) continue;

    const when =
      match === 1
        ? "tomorrow"
        : match === 7
          ? "in one week"
          : "in one month";
    await notifyAdmins(supabase, {
      type: "admin_event_reminder",
      title: `${e.title_en} · ${when}`,
      body: `Event starts ${new Date(e.starts_at).toLocaleString("en", { dateStyle: "full", timeStyle: "short" })}.`,
      data: { event_id: e.id, event_slug: e.slug, days_out: match },
    });

    await supabase.from("audit_log").insert({
      action: "notify_admin_event_reminder",
      entity_type: "events",
      entity_id: e.id,
      details: { days_out: String(match) },
    });

    fired += 1;
  }

  return NextResponse.json({ ok: true, fired });
}
