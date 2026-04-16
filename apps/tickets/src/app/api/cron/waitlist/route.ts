import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWaitlistNotification } from "@dbc/email";

/**
 * Cron endpoint that notifies waitlist entries when tier inventory becomes available.
 *
 * Logic:
 *  1. Find all active (future) events with waitlist entries that haven't been notified.
 *  2. For each (event, tier) group, check if the tier has any inventory available.
 *  3. Notify the oldest waitlist entries first (FIFO), up to the available quantity.
 *  4. Set notified_at + expires_at (24h window to purchase).
 *
 * Does NOT reserve inventory — the notified user must still race through checkout.
 * This is intentional: reserving would lock inventory without a purchase commitment.
 *
 * Schedule: every hour. `0 * * * *`
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

  // Get waitlist entries not yet notified, grouped by tier
  const { data: entries } = await supabase
    .from("waitlist_entries")
    .select("id, event_id, tier_id, email, created_at")
    .is("notified_at", null)
    .eq("purchased", false)
    .order("created_at", { ascending: true });

  if (!entries || entries.length === 0) {
    return NextResponse.json({ notified: 0 });
  }

  // Group by tier_id
  const byTier = new Map<string, typeof entries>();
  for (const entry of entries) {
    if (!byTier.has(entry.tier_id)) byTier.set(entry.tier_id, []);
    byTier.get(entry.tier_id)!.push(entry);
  }

  // Fetch tier availability
  const tierIds = [...byTier.keys()];
  const { data: tiers } = await supabase
    .from("ticket_tiers")
    .select("id, event_id, max_quantity, quantity_sold, name_en")
    .in("id", tierIds);

  // Fetch events for titles + future check
  const eventIds = [...new Set((tiers ?? []).map((t) => t.event_id))];
  const { data: events } = await supabase
    .from("events")
    .select("id, slug, title_en, title_de, title_fr, ends_at")
    .in("id", eventIds);

  const eventMap = new Map((events ?? []).map((e) => [e.id, e]));

  const ticketsBaseUrl =
    process.env.NEXT_PUBLIC_TICKETS_URL ?? "https://tickets.dbc-germany.com";

  // Resolve the locale and tier name for a given buyer email. We fall back
  // to EN when we don't know the buyer's preferred language.
  async function resolveBuyerLocale(
    email: string
  ): Promise<"en" | "de" | "fr"> {
    const { data } = await supabase
      .from("orders")
      .select("locale")
      .eq("recipient_email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const loc = data?.locale;
    return loc === "de" || loc === "fr" ? loc : "en";
  }

  let totalNotified = 0;
  const now = Date.now();
  const expiresAt = new Date(now + 24 * 3600 * 1000);
  const expiresAtIso = expiresAt.toISOString();

  // Pull all full tier records to get trilingual names.
  const { data: tiersFull } = await supabase
    .from("ticket_tiers")
    .select("id, name_en, name_de, name_fr")
    .in("id", tierIds);
  const tierNameMap = new Map(
    (tiersFull ?? []).map((t) => [t.id, t])
  );

  for (const tier of tiers ?? []) {
    const event = eventMap.get(tier.event_id);
    if (!event || new Date(event.ends_at).getTime() < now) continue;

    const available =
      tier.max_quantity === null
        ? Number.MAX_SAFE_INTEGER
        : tier.max_quantity - tier.quantity_sold;

    if (available <= 0) continue;

    const tierEntries = byTier.get(tier.id) ?? [];
    const toNotify = tierEntries.slice(0, available);

    for (const entry of toNotify) {
      try {
        const locale = await resolveBuyerLocale(entry.email);
        const eventTitle =
          (event[`title_${locale}` as keyof typeof event] as string) ||
          event.title_en;
        const tierNameRow = tierNameMap.get(tier.id);
        const tierName = tierNameRow
          ? ((tierNameRow[
              `name_${locale}` as keyof typeof tierNameRow
            ] as string) || tierNameRow.name_en)
          : tier.name_en;

        await sendWaitlistNotification({
          to: entry.email,
          eventTitle,
          tierName,
          expiresAt: expiresAt.toLocaleString(locale, {
            dateStyle: "full",
            timeStyle: "short",
          }),
          checkoutUrl: `${ticketsBaseUrl}/${locale}/checkout/${event.slug}`,
          locale,
        });

        await supabase
          .from("waitlist_entries")
          .update({
            notified_at: new Date().toISOString(),
            expires_at: expiresAtIso,
          })
          .eq("id", entry.id);

        totalNotified += 1;
      } catch (err) {
        console.error(`Failed to notify waitlist entry ${entry.id}:`, err);
      }
    }
  }

  return NextResponse.json({ notified: totalNotified });
}
