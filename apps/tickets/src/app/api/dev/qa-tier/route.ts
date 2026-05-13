import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe";

function authorised(req: Request): boolean {
  // Dual gate: ALLOW_QA_TIER=1 AND Bearer matches QA_TIER_ADMIN_TOKEN.
  // Workflow: set both env vars right before running the acceptance test,
  // unset both immediately after. Token rotated each test cycle.
  if (process.env.ALLOW_QA_TIER !== "1") return false;
  const expected = process.env.QA_TIER_ADMIN_TOKEN;
  if (!expected) return false;
  const got = req.headers.get("authorization");
  return got === `Bearer ${expected}`;
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// POST /api/dev/qa-tier { event_slug }
//   creates a hidden 1-cent tier, syncs to Stripe, returns { tier_id, ... }.
export async function POST(req: Request) {
  if (!authorised(req))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const eventSlug = body?.event_slug as string | undefined;
  if (!eventSlug) {
    return NextResponse.json({ error: "event_slug required" }, { status: 400 });
  }
  const sb = getSupabase();
  const { data: event } = await sb
    .from("events")
    .select("id, slug")
    .eq("slug", eventSlug)
    .single();
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const tierName = "QA Test Tier";
  const tierSlug = `qa-${Date.now()}`;
  const { data: tier, error } = await sb
    .from("ticket_tiers")
    .insert({
      event_id: event.id,
      slug: tierSlug,
      name_en: tierName,
      name_de: tierName,
      name_fr: tierName,
      description_en: "Internal acceptance test — do not publish.",
      description_de: "Internal acceptance test — do not publish.",
      description_fr: "Internal acceptance test — do not publish.",
      price_cents: 1,
      currency: "EUR",
      max_quantity: 5,
      is_public: false,
      sort_order: 9999,
    })
    .select("id, event_id, name_en, description_en, price_cents")
    .single();
  if (error || !tier) {
    return NextResponse.json(
      { error: error?.message ?? "Insert failed" },
      { status: 500 }
    );
  }

  const stripe = getStripe();
  const product = await stripe.products.create({
    name: tier.name_en,
    description: tier.description_en ?? undefined,
    active: false,
    metadata: { tier_id: tier.id, event_id: tier.event_id, qa: "true" },
  });
  const price = await stripe.prices.create({
    product: product.id,
    currency: "eur",
    unit_amount: 1,
    metadata: { tier_id: tier.id, event_id: tier.event_id, qa: "true" },
  });
  await sb
    .from("ticket_tiers")
    .update({ stripe_product_id: product.id, stripe_price_id: price.id })
    .eq("id", tier.id);

  return NextResponse.json({
    tier_id: tier.id,
    tier_slug: tierSlug,
    stripe_product_id: product.id,
    stripe_price_id: price.id,
    event_id: event.id,
    event_slug: event.slug,
  });
}

// DELETE /api/dev/qa-tier { tier_id }
//   archives Stripe Product + Price, deletes the tier row.
export async function DELETE(req: Request) {
  if (!authorised(req))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const tierId = body?.tier_id as string | undefined;
  if (!tierId) {
    return NextResponse.json({ error: "tier_id required" }, { status: 400 });
  }
  const sb = getSupabase();
  const { data: tier } = await sb
    .from("ticket_tiers")
    .select("stripe_product_id, stripe_price_id")
    .eq("id", tierId)
    .single();
  const stripe = getStripe();
  if (tier?.stripe_price_id) {
    try {
      await stripe.prices.update(tier.stripe_price_id, { active: false });
    } catch {
      // best-effort
    }
  }
  if (tier?.stripe_product_id) {
    try {
      await stripe.products.update(tier.stripe_product_id, { active: false });
    } catch {
      // best-effort
    }
  }
  await sb.from("ticket_tiers").delete().eq("id", tierId);
  return NextResponse.json({ deleted: true });
}
