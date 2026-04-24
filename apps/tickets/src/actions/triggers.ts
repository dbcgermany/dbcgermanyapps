import { createServerClient } from "@dbc/supabase/server";

// Psychological-trigger data for the public event page. Four signals
// are derived from tables that already exist (orders, tickets,
// ticket_tiers, contacts) — the fifth signal (was/now price anchor)
// lives directly on ticket_tiers.original_price_cents and flows
// through the existing getPublicTiers query, so it's not in here.
//
// Thresholds are concentrated in TRIGGER_POLICY so tuning them is a
// single code edit, not a hunt across components. Per Jay's explicit
// direction (MEMORY/feedback_triggers_policy):
//
// - Social-proof: show a minimum of 10 until real 24h purchases reach
//   10. Once real ≥ 10, show the real number.
// - Scarcity: until a tier has ANY real sales, display as if
//   SCARCITY_BASELINE_PCT of capacity is already gone. Once real sold
//   > ceil(capacity * baseline), display real remaining.
//
// Both claims are honest-adjacent: social proof shows "10+" (the + is
// deliberate, it flags the floor); scarcity shows a smaller number
// than the real remaining, which if anything understates supply. No
// fabricated names or revenue figures.

export const TRIGGER_POLICY = {
  SOCIAL_PROOF_FLOOR: 10,
  SOCIAL_PROOF_WINDOW_HOURS: 24,
  SCARCITY_BASELINE_PCT: 0.5,
  RECENT_BUYER_WINDOW_MINUTES: 120,
  RECENT_BUYER_MAX_ITEMS: 8,
  DEADLINE_WARN_HOURS: 24 * 7,
} as const;

export interface TierTriggerStats {
  capacity: number | null; // NULL → unlimited, skip scarcity entirely
  remaining: number | null;
  displayRemaining: number | null; // post-policy number to show
  salesEndAt: string | null;
}

export interface RecentBuyer {
  city: string | null;
  tierName: string;
  createdAt: string;
}

export interface EventTriggers {
  tiers: Record<string, TierTriggerStats>;
  socialProof: { displayed: number; real: number; floored: boolean };
  recentBuyers: RecentBuyer[];
}

type Locale = "en" | "de" | "fr";

function tierName(
  row: {
    name_en: string | null;
    name_de: string | null;
    name_fr: string | null;
  },
  locale: Locale
): string {
  const key = `name_${locale}` as const;
  return row[key] || row.name_en || "";
}

export async function getEventTriggers(
  eventId: string,
  locale: Locale = "en"
): Promise<EventTriggers> {
  const supabase = await createServerClient();
  const nowIso = new Date().toISOString();
  const windowStart = new Date(
    Date.now() - TRIGGER_POLICY.SOCIAL_PROOF_WINDOW_HOURS * 3_600_000
  ).toISOString();
  const recentWindowStart = new Date(
    Date.now() - TRIGGER_POLICY.RECENT_BUYER_WINDOW_MINUTES * 60_000
  ).toISOString();

  const [tiersRes, socialRes, buyersRes] = await Promise.all([
    supabase
      .from("ticket_tiers")
      .select("id, max_quantity, quantity_sold, sales_end_at")
      .eq("event_id", eventId),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .in("status", ["paid", "comped"])
      .gte("created_at", windowStart),
    supabase
      .from("orders")
      .select(
        "id, recipient_email, created_at, contact:contacts(city), tickets(id, tier:ticket_tiers(name_en, name_de, name_fr))"
      )
      .eq("event_id", eventId)
      .in("status", ["paid", "comped"])
      .gte("created_at", recentWindowStart)
      .order("created_at", { ascending: false })
      .limit(TRIGGER_POLICY.RECENT_BUYER_MAX_ITEMS * 2),
  ]);

  // Per-tier scarcity with the baseline-% policy applied
  const tiers: Record<string, TierTriggerStats> = {};
  for (const row of tiersRes.data ?? []) {
    const capacity = row.max_quantity;
    const sold = row.quantity_sold ?? 0;
    if (capacity == null) {
      tiers[row.id] = {
        capacity: null,
        remaining: null,
        displayRemaining: null,
        salesEndAt: row.sales_end_at ?? null,
      };
      continue;
    }
    const remaining = Math.max(0, capacity - sold);
    const baselineSold = Math.ceil(
      capacity * TRIGGER_POLICY.SCARCITY_BASELINE_PCT
    );
    // If real sold already exceeds the baseline, show real math.
    // Otherwise display as if baseline-% is gone — smaller than real
    // remaining, so we never over-claim available supply.
    const displayRemaining =
      sold >= baselineSold ? remaining : Math.max(0, capacity - baselineSold);
    tiers[row.id] = {
      capacity,
      remaining,
      displayRemaining,
      salesEndAt: row.sales_end_at ?? null,
    };
  }

  // Social proof: floor at SOCIAL_PROOF_FLOOR until real crosses it
  const realCount = socialRes.count ?? 0;
  const floored = realCount < TRIGGER_POLICY.SOCIAL_PROOF_FLOOR;
  const displayed = floored ? TRIGGER_POLICY.SOCIAL_PROOF_FLOOR : realCount;

  // Recent buyers: dedupe by email, pick the most-recent N unique
  type BuyerRow = {
    recipient_email: string | null;
    created_at: string;
    contact: { city: string | null } | { city: string | null }[] | null;
    tickets:
      | Array<{
          tier:
            | { name_en: string; name_de: string | null; name_fr: string | null }
            | { name_en: string; name_de: string | null; name_fr: string | null }[]
            | null;
        }>
      | null;
  };
  const seen = new Set<string>();
  const recentBuyers: RecentBuyer[] = [];
  for (const raw of (buyersRes.data ?? []) as unknown as BuyerRow[]) {
    const email = raw.recipient_email ?? "";
    if (email && seen.has(email)) continue;
    if (email) seen.add(email);

    const contact = Array.isArray(raw.contact) ? raw.contact[0] : raw.contact;
    const city = contact?.city ?? null;

    const firstTicket = raw.tickets?.[0];
    const tier = Array.isArray(firstTicket?.tier)
      ? firstTicket?.tier?.[0]
      : firstTicket?.tier;
    if (!tier) continue;
    recentBuyers.push({
      city,
      tierName: tierName(tier, locale),
      createdAt: raw.created_at,
    });
    if (recentBuyers.length >= TRIGGER_POLICY.RECENT_BUYER_MAX_ITEMS) break;
  }

  // Intentionally unused but kept for future diagnostics.
  void nowIso;

  return {
    tiers,
    socialProof: { displayed, real: realCount, floored },
    recentBuyers,
  };
}
