"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { revalidatePath } from "next/cache";
import { pingRevalidate } from "@/lib/revalidate";
import {
  archiveCouponInStripe,
  bestEffortSync,
  syncCouponToStripe,
} from "@/lib/stripe-sync";

const COUPON_COLUMNS =
  "id, event_id, code, discount_type, discount_value, max_uses, times_used, valid_from, valid_until, applicable_tier_ids, is_active, stripe_coupon_id, stripe_promotion_code_id, created_at" as const;

async function pingCouponPaths(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  eventId: string
) {
  const { data } = await supabase
    .from("events")
    .select("slug")
    .eq("id", eventId)
    .single();
  if (!data?.slug) return;
  await pingRevalidate("tickets", [
    `/[locale]/events/${data.slug}`,
    `/[locale]/checkout/${data.slug}`,
  ]);
}

async function persistStripeIdsForCoupon(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  couponId: string,
  result: Awaited<ReturnType<typeof syncCouponToStripe>>
) {
  await supabase
    .from("coupons")
    .update({
      stripe_coupon_id: result.stripe_coupon_id,
      stripe_promotion_code_id: result.stripe_promotion_code_id,
    })
    .eq("id", couponId);
}

export async function getCoupons(eventId: string) {
  await requireRole("manager");
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("coupons")
    .select(COUPON_COLUMNS)
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function createCoupon(formData: FormData) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const eventId = formData.get("event_id") as string;
  const locale = formData.get("locale") as string;
  const code = (formData.get("code") as string).toUpperCase().trim();
  const discountType = formData.get("discount_type") as string;

  let discountValue: number;
  if (discountType === "percentage") {
    discountValue = parseInt(formData.get("discount_value") as string, 10);
    if (discountValue < 1 || discountValue > 100) {
      return { error: "Percentage must be between 1 and 100" };
    }
  } else {
    // fixed_amount: convert euros to cents
    discountValue = Math.round(
      parseFloat(formData.get("discount_value") as string) * 100
    );
  }

  const applicableTierIds = formData.getAll("applicable_tier_ids") as string[];

  const couponData = {
    event_id: eventId,
    code,
    discount_type: discountType,
    discount_value: discountValue,
    max_uses: formData.get("max_uses")
      ? parseInt(formData.get("max_uses") as string, 10)
      : null,
    valid_from: (formData.get("valid_from") as string) || null,
    valid_until: (formData.get("valid_until") as string) || null,
    applicable_tier_ids:
      applicableTierIds.length > 0 ? applicableTierIds : null,
    is_active: true,
  };

  const { data, error } = await supabase
    .from("coupons")
    .insert(couponData)
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: `Coupon code "${code}" already exists.` };
    }
    return { error: error.message };
  }

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "create_coupon",
    entity_type: "coupons",
    entity_id: data.id,
    details: { code, event_id: eventId },
  });

  const synced = await bestEffortSync(
    () =>
      syncCouponToStripe({
        id: data.id,
        code,
        discount_type: discountType as "percentage" | "fixed_amount",
        discount_value: discountValue,
        max_uses: couponData.max_uses,
        valid_until: couponData.valid_until,
        is_active: true,
        stripe_coupon_id: null,
        stripe_promotion_code_id: null,
        event_id: eventId,
      }),
    `createCoupon:${data.id}`
  );
  if (synced) await persistStripeIdsForCoupon(supabase, data.id, synced);

  revalidatePath(`/${locale}/events/${eventId}/coupons`);
  await pingCouponPaths(supabase, eventId);
  return {
    success: true,
    stripeWarning: synced ? null : "Saved locally — Stripe sync failed. Click Resync.",
  };
}

export async function updateCoupon(couponId: string, formData: FormData) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const eventId = formData.get("event_id") as string;
  const locale = formData.get("locale") as string;
  const code = (formData.get("code") as string).toUpperCase().trim();
  const discountType = formData.get("discount_type") as string;

  let discountValue: number;
  if (discountType === "percentage") {
    discountValue = parseInt(formData.get("discount_value") as string, 10);
    if (discountValue < 1 || discountValue > 100) {
      return { error: "Percentage must be between 1 and 100" };
    }
  } else {
    discountValue = Math.round(
      parseFloat(formData.get("discount_value") as string) * 100
    );
  }

  const applicableTierIds = formData.getAll("applicable_tier_ids") as string[];

  const couponData = {
    code,
    discount_type: discountType,
    discount_value: discountValue,
    max_uses: formData.get("max_uses")
      ? parseInt(formData.get("max_uses") as string, 10)
      : null,
    valid_from: (formData.get("valid_from") as string) || null,
    valid_until: (formData.get("valid_until") as string) || null,
    applicable_tier_ids:
      applicableTierIds.length > 0 ? applicableTierIds : null,
  };

  const { error } = await supabase
    .from("coupons")
    .update(couponData)
    .eq("id", couponId);

  if (error) {
    if (error.code === "23505") {
      return { error: `Coupon code "${code}" already exists.` };
    }
    return { error: error.message };
  }

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "update_coupon",
    entity_type: "coupons",
    entity_id: couponId,
    details: { code, event_id: eventId },
  });

  const { data: existing } = await supabase
    .from("coupons")
    .select(
      "id, code, discount_type, discount_value, max_uses, valid_until, is_active, stripe_coupon_id, stripe_promotion_code_id, event_id"
    )
    .eq("id", couponId)
    .single();
  let synced: Awaited<ReturnType<typeof syncCouponToStripe>> | null = null;
  if (existing) {
    synced = await bestEffortSync(
      () => syncCouponToStripe(existing),
      `updateCoupon:${couponId}`
    );
    if (synced) await persistStripeIdsForCoupon(supabase, couponId, synced);
  }

  revalidatePath(`/${locale}/events/${eventId}/coupons`);
  await pingCouponPaths(supabase, eventId);
  return {
    success: true,
    stripeWarning: synced ? null : "Saved locally — Stripe sync failed. Click Resync.",
  };
}

export async function deleteCoupon(
  couponId: string,
  eventId: string,
  locale: string
) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const { data: coupon } = await supabase
    .from("coupons")
    .select("code, times_used, stripe_coupon_id, stripe_promotion_code_id")
    .eq("id", couponId)
    .single();

  if (coupon && coupon.times_used > 0) {
    return {
      error:
        "Cannot delete a coupon that has been used. Deactivate it instead.",
    };
  }

  if (coupon) {
    await bestEffortSync(
      () =>
        archiveCouponInStripe(
          coupon.stripe_coupon_id,
          coupon.stripe_promotion_code_id
        ),
      `deleteCoupon:${couponId}`
    );
  }

  const { error } = await supabase
    .from("coupons")
    .delete()
    .eq("id", couponId);

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "delete_coupon",
    entity_type: "coupons",
    entity_id: couponId,
    details: { code: coupon?.code, event_id: eventId },
  });

  revalidatePath(`/${locale}/events/${eventId}/coupons`);
  await pingCouponPaths(supabase, eventId);
  return { success: true };
}

export async function toggleCouponActive(
  couponId: string,
  eventId: string,
  locale: string
) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const { data: coupon } = await supabase
    .from("coupons")
    .select(
      "id, is_active, code, discount_type, discount_value, max_uses, valid_until, stripe_coupon_id, stripe_promotion_code_id, event_id"
    )
    .eq("id", couponId)
    .single();

  if (!coupon) return { error: "Coupon not found" };

  const newIsActive = !coupon.is_active;
  const { error } = await supabase
    .from("coupons")
    .update({ is_active: newIsActive })
    .eq("id", couponId);

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: coupon.is_active ? "deactivate_coupon" : "activate_coupon",
    entity_type: "coupons",
    entity_id: couponId,
    details: { code: coupon.code },
  });

  const synced = await bestEffortSync(
    () => syncCouponToStripe({ ...coupon, is_active: newIsActive }),
    `toggleCoupon:${couponId}`
  );
  if (synced) await persistStripeIdsForCoupon(supabase, couponId, synced);

  revalidatePath(`/${locale}/events/${eventId}/coupons`);
  await pingCouponPaths(supabase, eventId);
  return { success: true };
}

export async function resyncCouponToStripe(couponId: string) {
  await requireRole("manager");
  const supabase = await createServerClient();
  const { data: coupon } = await supabase
    .from("coupons")
    .select(
      "id, code, discount_type, discount_value, max_uses, valid_until, is_active, stripe_coupon_id, stripe_promotion_code_id, event_id"
    )
    .eq("id", couponId)
    .single();
  if (!coupon) return { error: "Coupon not found" };
  const synced = await bestEffortSync(
    () => syncCouponToStripe(coupon),
    `resync:${couponId}`
  );
  if (!synced) return { error: "Stripe sync failed. Check logs." };
  await persistStripeIdsForCoupon(supabase, couponId, synced);
  return { success: true };
}
