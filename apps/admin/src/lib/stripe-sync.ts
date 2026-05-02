import "server-only";
import Stripe from "stripe";

let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-03-25.dahlia",
    });
  }
  return _stripe;
}

export interface TierForSync {
  id: string;
  event_id: string;
  name_en: string;
  description_en: string | null;
  price_cents: number;
  currency: string;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  stripe_price_archived_ids: string[];
  is_public: boolean;
}

export interface TierSyncResult {
  stripe_product_id: string;
  stripe_price_id: string;
  archived_price_ids: string[];
}

export async function syncTierToStripe(
  tier: TierForSync
): Promise<TierSyncResult> {
  const stripe = getStripe();
  const archived = [...(tier.stripe_price_archived_ids ?? [])];
  const currency = (tier.currency || "EUR").toLowerCase();

  let productId = tier.stripe_product_id;
  if (!productId) {
    const product = await stripe.products.create({
      name: tier.name_en,
      description: tier.description_en ?? undefined,
      active: tier.is_public,
      metadata: { tier_id: tier.id, event_id: tier.event_id },
    });
    productId = product.id;
  } else {
    await stripe.products.update(productId, {
      name: tier.name_en,
      description: tier.description_en ?? undefined,
      active: tier.is_public,
      metadata: { tier_id: tier.id, event_id: tier.event_id },
    });
  }

  let priceId = tier.stripe_price_id;
  let needsNewPrice = !priceId;
  if (priceId) {
    try {
      const existing = await stripe.prices.retrieve(priceId);
      if (
        existing.unit_amount !== tier.price_cents ||
        existing.currency !== currency ||
        !existing.active
      ) {
        needsNewPrice = true;
      }
    } catch {
      needsNewPrice = true;
    }
  }

  if (needsNewPrice) {
    if (priceId) {
      try {
        await stripe.prices.update(priceId, { active: false });
      } catch (err) {
        console.warn(`[stripe-sync] archive price ${priceId}:`, err);
      }
      if (!archived.includes(priceId)) archived.push(priceId);
    }
    const created = await stripe.prices.create({
      product: productId,
      currency,
      unit_amount: tier.price_cents,
      metadata: { tier_id: tier.id, event_id: tier.event_id },
    });
    priceId = created.id;
  }

  return {
    stripe_product_id: productId,
    stripe_price_id: priceId!,
    archived_price_ids: archived,
  };
}

export async function archiveTierInStripe(
  productId: string | null,
  priceId: string | null
): Promise<void> {
  const stripe = getStripe();
  if (priceId) {
    try {
      await stripe.prices.update(priceId, { active: false });
    } catch (err) {
      console.warn(`[stripe-sync] archive price ${priceId}:`, err);
    }
  }
  if (productId) {
    try {
      await stripe.products.update(productId, { active: false });
    } catch (err) {
      console.warn(`[stripe-sync] archive product ${productId}:`, err);
    }
  }
}

export interface CouponForSync {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  max_uses: number | null;
  valid_until: string | null;
  is_active: boolean;
  stripe_coupon_id: string | null;
  stripe_promotion_code_id: string | null;
  event_id: string | null;
}

export interface CouponSyncResult {
  stripe_coupon_id: string;
  stripe_promotion_code_id: string;
}

export async function syncCouponToStripe(
  coupon: CouponForSync
): Promise<CouponSyncResult> {
  const stripe = getStripe();

  let needsNewCoupon = !coupon.stripe_coupon_id;
  if (coupon.stripe_coupon_id) {
    try {
      const existing = await stripe.coupons.retrieve(coupon.stripe_coupon_id);
      const matches =
        coupon.discount_type === "percentage"
          ? existing.percent_off === coupon.discount_value
          : existing.amount_off === coupon.discount_value &&
            existing.currency === "eur";
      if (!matches) needsNewCoupon = true;
    } catch {
      needsNewCoupon = true;
    }
  }

  let stripeCouponId = coupon.stripe_coupon_id ?? "";
  if (needsNewCoupon) {
    if (stripeCouponId) {
      try {
        await stripe.coupons.del(stripeCouponId);
      } catch {
        // best-effort
      }
    }
    const params: Stripe.CouponCreateParams = {
      duration: "once",
      max_redemptions: coupon.max_uses ?? undefined,
      redeem_by: coupon.valid_until
        ? Math.floor(new Date(coupon.valid_until).getTime() / 1000)
        : undefined,
      name: coupon.code,
      metadata: { coupon_id: coupon.id, event_id: coupon.event_id ?? "" },
    };
    if (coupon.discount_type === "percentage") {
      params.percent_off = coupon.discount_value;
    } else {
      params.amount_off = coupon.discount_value;
      params.currency = "eur";
    }
    const created = await stripe.coupons.create(params);
    stripeCouponId = created.id;
  }

  let needsNewPC = !coupon.stripe_promotion_code_id || needsNewCoupon;
  let promotionCodeId = coupon.stripe_promotion_code_id ?? "";
  if (!needsNewPC && promotionCodeId) {
    try {
      const existing = await stripe.promotionCodes.retrieve(promotionCodeId);
      if (existing.code.toUpperCase() !== coupon.code.toUpperCase()) {
        needsNewPC = true;
      } else if (existing.active !== coupon.is_active) {
        await stripe.promotionCodes.update(promotionCodeId, {
          active: coupon.is_active,
        });
      }
    } catch {
      needsNewPC = true;
    }
  }

  if (needsNewPC) {
    if (promotionCodeId) {
      try {
        await stripe.promotionCodes.update(promotionCodeId, { active: false });
      } catch {
        // best-effort
      }
    }
    const created = await stripe.promotionCodes.create({
      promotion: { type: "coupon", coupon: stripeCouponId },
      code: coupon.code,
      active: coupon.is_active,
      max_redemptions: coupon.max_uses ?? undefined,
      expires_at: coupon.valid_until
        ? Math.floor(new Date(coupon.valid_until).getTime() / 1000)
        : undefined,
      metadata: { coupon_id: coupon.id, event_id: coupon.event_id ?? "" },
    });
    promotionCodeId = created.id;
  }

  return {
    stripe_coupon_id: stripeCouponId,
    stripe_promotion_code_id: promotionCodeId,
  };
}

export async function archiveCouponInStripe(
  stripeCouponId: string | null,
  stripePromotionCodeId: string | null
): Promise<void> {
  const stripe = getStripe();
  if (stripePromotionCodeId) {
    try {
      await stripe.promotionCodes.update(stripePromotionCodeId, {
        active: false,
      });
    } catch {
      // best-effort
    }
  }
  if (stripeCouponId) {
    try {
      await stripe.coupons.del(stripeCouponId);
    } catch {
      // best-effort
    }
  }
}

export async function bestEffortSync<T>(
  fn: () => Promise<T>,
  ctx: string
): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[stripe-sync:${ctx}]`, err);
    return null;
  }
}
