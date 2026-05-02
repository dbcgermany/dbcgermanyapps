"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import {
  bestEffortSync,
  syncCouponToStripe,
  syncTierToStripe,
} from "@/lib/stripe-sync";

interface BackfillBucket {
  ok: number;
  fail: number;
  skipped: number;
}

export async function backfillStripeIds(): Promise<{
  tiers: BackfillBucket;
  coupons: BackfillBucket;
}> {
  await requireRole("admin");
  const supabase = await createServerClient();

  const tiers: BackfillBucket = { ok: 0, fail: 0, skipped: 0 };
  const { data: tierRows } = await supabase
    .from("ticket_tiers")
    .select(
      "id, event_id, name_en, description_en, price_cents, currency, stripe_product_id, stripe_price_id, stripe_price_archived_ids, is_public"
    );
  for (const tier of tierRows ?? []) {
    if (tier.stripe_price_id) {
      tiers.skipped++;
      continue;
    }
    const synced = await bestEffortSync(
      () => syncTierToStripe(tier),
      `backfill:tier:${tier.id}`
    );
    if (synced) {
      await supabase
        .from("ticket_tiers")
        .update({
          stripe_product_id: synced.stripe_product_id,
          stripe_price_id: synced.stripe_price_id,
          stripe_price_archived_ids: synced.archived_price_ids,
        })
        .eq("id", tier.id);
      tiers.ok++;
    } else {
      tiers.fail++;
    }
  }

  const coupons: BackfillBucket = { ok: 0, fail: 0, skipped: 0 };
  const { data: couponRows } = await supabase
    .from("coupons")
    .select(
      "id, code, discount_type, discount_value, max_uses, valid_until, is_active, stripe_coupon_id, stripe_promotion_code_id, event_id"
    );
  for (const coupon of couponRows ?? []) {
    if (coupon.stripe_promotion_code_id) {
      coupons.skipped++;
      continue;
    }
    const synced = await bestEffortSync(
      () => syncCouponToStripe(coupon),
      `backfill:coupon:${coupon.id}`
    );
    if (synced) {
      await supabase
        .from("coupons")
        .update({
          stripe_coupon_id: synced.stripe_coupon_id,
          stripe_promotion_code_id: synced.stripe_promotion_code_id,
        })
        .eq("id", coupon.id);
      coupons.ok++;
    } else {
      coupons.fail++;
    }
  }

  return { tiers, coupons };
}
