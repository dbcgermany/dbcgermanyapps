"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { revalidatePath } from "next/cache";

const COUPON_COLUMNS =
  "id, event_id, code, discount_type, discount_value, max_uses, times_used, valid_from, valid_until, applicable_tier_ids, is_active, created_at" as const;

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

  revalidatePath(`/${locale}/events/${eventId}/coupons`);
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
    .select("is_active, code")
    .eq("id", couponId)
    .single();

  if (!coupon) return { error: "Coupon not found" };

  const { error } = await supabase
    .from("coupons")
    .update({ is_active: !coupon.is_active })
    .eq("id", couponId);

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: coupon.is_active ? "deactivate_coupon" : "activate_coupon",
    entity_type: "coupons",
    entity_id: couponId,
    details: { code: coupon.code },
  });

  revalidatePath(`/${locale}/events/${eventId}/coupons`);
  return { success: true };
}
