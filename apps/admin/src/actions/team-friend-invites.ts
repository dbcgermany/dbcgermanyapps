"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { bestEffortSync, syncCouponToStripe } from "@/lib/stripe-sync";

// Each Germany team member can issue a small batch of discounted invite
// coupons their friends use at the public checkout. Phase F (2026-05-13)
// replaced the legacy tier-based config with a flexible discount model:
//
//   events.team_invite_quota             — slot count per team member (default)
//   events.team_invite_discount_type     — 'percent' | 'fixed'
//   events.team_invite_discount_value    — 0-100 when percent, cents when fixed
//   events.team_invite_applicable_tier_ids — uuid[] of tiers the code is valid
//                                             on (empty = every public tier)
//
// Per-team-member override lives on event_team_member_quota_overrides:
//   .quota / .discount_type / .discount_value — all nullable; NULL = inherit
//
// Note: events.team_invite_discount_type uses concise 'percent'|'fixed' for
// the admin UI; the coupons table uses the longer 'percentage'|'fixed_amount'
// (its existing enum). The translation lives in DISCOUNT_TYPE_DB_MAP below.

const DISCOUNT_TYPE_DB_MAP = {
  percent: "percentage",
  fixed: "fixed_amount",
} as const;

type EventDiscountType = "percent" | "fixed";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function shortCode() {
  // 8 URL-safe chars, no ambiguous look-alikes (0/O, 1/I) for hand-typing.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (const b of randomBytes(8)) out += alphabet[b % alphabet.length];
  return out;
}

async function isAdminLike(role: string) {
  return role === "admin" || role === "super_admin";
}

// ---------------------------------------------------------------------------
// Effective config (override → event-level → defaults)
// ---------------------------------------------------------------------------

export interface EffectiveTeamInviteConfig {
  quota: number;
  discountType: EventDiscountType;
  discountValue: number;
  applicableTierIds: string[];
  isQuotaOverride: boolean;
  isDiscountOverride: boolean;
}

export async function getMyEffectiveQuota(eventId: string, profileId?: string) {
  const cfg = await getEffectiveTeamInviteConfig(eventId, profileId);
  return cfg.quota;
}

export async function getEffectiveTeamInviteConfig(
  eventId: string,
  profileId?: string
): Promise<EffectiveTeamInviteConfig> {
  const user = await requireRole("team_member");
  const targetProfileId = profileId ?? user.userId;
  if (targetProfileId !== user.userId && !(await isAdminLike(user.role))) {
    throw new Error("Forbidden");
  }
  const supabase = await createServerClient();
  const [{ data: event }, { data: override }] = await Promise.all([
    supabase
      .from("events")
      .select(
        "team_invite_quota, team_invite_discount_type, team_invite_discount_value, team_invite_applicable_tier_ids"
      )
      .eq("id", eventId)
      .maybeSingle(),
    supabase
      .from("event_team_member_quota_overrides")
      .select("quota, discount_type, discount_value")
      .eq("event_id", eventId)
      .eq("profile_id", targetProfileId)
      .maybeSingle(),
  ]);
  const eventRow = (event ?? {}) as {
    team_invite_quota?: number | null;
    team_invite_discount_type?: EventDiscountType | null;
    team_invite_discount_value?: number | null;
    team_invite_applicable_tier_ids?: string[] | null;
  };
  const overrideRow = (override ?? {}) as {
    quota?: number | null;
    discount_type?: EventDiscountType | null;
    discount_value?: number | null;
  };
  const quota =
    overrideRow.quota != null ? overrideRow.quota : eventRow.team_invite_quota ?? 3;
  const discountType: EventDiscountType =
    overrideRow.discount_type ?? eventRow.team_invite_discount_type ?? "percent";
  const discountValue =
    overrideRow.discount_value != null
      ? overrideRow.discount_value
      : eventRow.team_invite_discount_value ?? 0;
  return {
    quota,
    discountType,
    discountValue,
    applicableTierIds: eventRow.team_invite_applicable_tier_ids ?? [],
    isQuotaOverride: overrideRow.quota != null,
    isDiscountOverride:
      overrideRow.discount_type != null || overrideRow.discount_value != null,
  };
}

// ---------------------------------------------------------------------------
// Quota / discount overrides (admin)
// ---------------------------------------------------------------------------

export async function overrideTeamMemberQuota(
  eventId: string,
  profileId: string,
  quota: number
) {
  const actor = await requireRole("admin");
  const service = getServiceClient();
  const { error } = await service
    .from("event_team_member_quota_overrides")
    .upsert(
      { event_id: eventId, profile_id: profileId, quota, created_by: actor.userId },
      { onConflict: "event_id,profile_id" }
    );
  if (error) return { error: error.message };
  await service.from("audit_log").insert({
    user_id: actor.userId,
    action: "override_team_invite_quota",
    entity_type: "event_team_member_quota_overrides",
    entity_id: eventId,
    details: { profile_id: profileId, quota },
  });
  revalidatePath(`/[locale]/events/${eventId}/team-invites`, "layout");
  return { success: true };
}

export async function overrideTeamMemberDiscount(
  eventId: string,
  profileId: string,
  discountType: EventDiscountType | null,
  discountValue: number | null
) {
  const actor = await requireRole("admin");
  if (discountType !== null && !["percent", "fixed"].includes(discountType)) {
    return { error: "Invalid discount type." };
  }
  if (
    discountValue !== null &&
    (!Number.isFinite(discountValue) || discountValue < 0)
  ) {
    return { error: "Invalid discount value." };
  }
  if (discountType === "percent" && discountValue !== null && discountValue > 100) {
    return { error: "Percent discount must be 0–100." };
  }
  const service = getServiceClient();

  // Read existing override to preserve quota when partial-updating discount.
  const { data: existing } = await service
    .from("event_team_member_quota_overrides")
    .select("quota")
    .eq("event_id", eventId)
    .eq("profile_id", profileId)
    .maybeSingle();
  const quota = existing?.quota ?? 0;

  const { error } = await service
    .from("event_team_member_quota_overrides")
    .upsert(
      {
        event_id: eventId,
        profile_id: profileId,
        quota,
        discount_type: discountType,
        discount_value: discountValue,
        created_by: actor.userId,
      },
      { onConflict: "event_id,profile_id" }
    );
  if (error) return { error: error.message };

  // Re-sync this team-member's unused team-friend coupons to the new rate so
  // already-issued codes match the new discount when redeemed.
  const syncResult = await resyncTeamFriendCouponsForScope({
    eventId,
    profileId,
    actorUserId: actor.userId,
  });

  await service.from("audit_log").insert({
    user_id: actor.userId,
    action: "override_team_invite_discount",
    entity_type: "event_team_member_quota_overrides",
    entity_id: eventId,
    details: {
      profile_id: profileId,
      discount_type: discountType,
      discount_value: discountValue,
      ...syncResult,
    },
  });
  revalidatePath(`/[locale]/events/${eventId}/team-invites`, "layout");
  revalidatePath(`/[locale]/events/${eventId}`, "layout");
  return { success: true as const, ...syncResult };
}

export async function updateEventTeamInviteDiscount(
  eventId: string,
  input: {
    discountType: EventDiscountType;
    discountValue: number;
    applicableTierIds: string[];
  }
) {
  const actor = await requireRole("admin");
  if (!["percent", "fixed"].includes(input.discountType)) {
    return { error: "Invalid discount type." };
  }
  if (!Number.isFinite(input.discountValue) || input.discountValue < 0) {
    return { error: "Invalid discount value." };
  }
  if (input.discountType === "percent" && input.discountValue > 100) {
    return { error: "Percent discount must be 0–100." };
  }
  const service = getServiceClient();
  const { error } = await service
    .from("events")
    .update({
      team_invite_discount_type: input.discountType,
      team_invite_discount_value: input.discountValue,
      team_invite_applicable_tier_ids: input.applicableTierIds,
    })
    .eq("id", eventId);
  if (error) return { error: error.message };

  // Re-sync every unused team-friend coupon for this event so existing codes
  // match the new rate when redeemed. Used codes are skipped — Stripe doesn't
  // allow editing a redeemed coupon, and the friend already paid at the
  // original rate.
  const syncResult = await resyncTeamFriendCouponsForScope({
    eventId,
    actorUserId: actor.userId,
  });

  await service.from("audit_log").insert({
    user_id: actor.userId,
    action: "update_event_team_invite_discount",
    entity_type: "events",
    entity_id: eventId,
    details: {
      discount_type: input.discountType,
      discount_value: input.discountValue,
      applicable_tier_ids: input.applicableTierIds,
      ...syncResult,
    },
  });
  revalidatePath(`/[locale]/events/${eventId}/team-invites`, "layout");
  revalidatePath(`/[locale]/events/${eventId}`, "layout");
  return { success: true as const, ...syncResult };
}

// ---------------------------------------------------------------------------
// Listing (with redeemer info)
// ---------------------------------------------------------------------------

export interface TeamFriendCouponRow {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed_amount";
  discount_value: number;
  max_uses: number | null;
  times_used: number;
  is_active: boolean;
  applicable_tier_ids: string[] | null;
  created_at: string;
  redeemed_by_name: string | null;
  redeemed_by_email: string | null;
}

export async function listMyTeamFriendCoupons(
  eventId: string,
  profileId?: string
): Promise<TeamFriendCouponRow[]> {
  const user = await requireRole("team_member");
  const targetProfileId = profileId ?? user.userId;
  if (targetProfileId !== user.userId && !(await isAdminLike(user.role))) {
    throw new Error("Forbidden");
  }
  const service = getServiceClient();
  const { data: coupons, error } = await service
    .from("coupons")
    .select(
      "id, code, discount_type, discount_value, max_uses, times_used, is_active, applicable_tier_ids, created_at"
    )
    .eq("event_id", eventId)
    .eq("issued_to_profile_id", targetProfileId)
    .eq("purpose", "team_friend_invite")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  const couponList = coupons ?? [];
  if (couponList.length === 0) return [];

  // Join redeeming orders so the team member can see WHO used each used code.
  const couponIds = couponList.map((c) => c.id);
  const { data: orders } = await service
    .from("orders")
    .select("coupon_id, recipient_name, recipient_email")
    .in("coupon_id", couponIds);
  const orderByCoupon = new Map<
    string,
    { name: string | null; email: string | null }
  >();
  for (const o of orders ?? []) {
    if (!o.coupon_id) continue;
    if (!orderByCoupon.has(o.coupon_id)) {
      orderByCoupon.set(o.coupon_id, {
        name: o.recipient_name ?? null,
        email: o.recipient_email ?? null,
      });
    }
  }
  return couponList.map((c) => {
    const redeemer = orderByCoupon.get(c.id);
    return {
      ...c,
      redeemed_by_name: redeemer?.name ?? null,
      redeemed_by_email: redeemer?.email ?? null,
    } as TeamFriendCouponRow;
  });
}

// ---------------------------------------------------------------------------
// Issuance (single-shot with Stripe sync)
// ---------------------------------------------------------------------------

export async function issueTeamFriendCoupons(
  eventId: string,
  profileId?: string
) {
  const user = await requireRole("team_member");
  const targetProfileId = profileId ?? user.userId;
  if (targetProfileId !== user.userId && !(await isAdminLike(user.role))) {
    return { error: "Forbidden" };
  }
  const service = getServiceClient();

  const { data: event } = await service
    .from("events")
    .select("id, slug")
    .eq("id", eventId)
    .single();
  if (!event) return { error: "Event not found" };

  const cfg = await getEffectiveTeamInviteConfig(eventId, targetProfileId);
  if (cfg.discountValue <= 0) {
    return {
      error:
        "Team-friend invites are not configured yet. Ask an admin to set the discount in event settings.",
    };
  }

  // applicableTierIds empty = apply to every public retail tier in the event.
  let applicableTierIds = cfg.applicableTierIds;
  if (applicableTierIds.length === 0) {
    const { data: publicTiers } = await service
      .from("ticket_tiers")
      .select("id")
      .eq("event_id", eventId)
      .eq("is_public", true)
      .eq("counts_as_sold", true);
    applicableTierIds = (publicTiers ?? []).map((t) => t.id);
    if (applicableTierIds.length === 0) {
      return {
        error: "No public retail tiers exist on this event for the code to apply to.",
      };
    }
  }

  const existing = await listMyTeamFriendCoupons(eventId, targetProfileId);
  const remaining = Math.max(0, cfg.quota - existing.length);
  if (remaining === 0) {
    return {
      success: true,
      created: 0,
      message: "You already have all your invite slots.",
    };
  }

  const dbDiscountType = DISCOUNT_TYPE_DB_MAP[cfg.discountType];
  const eventSlugPart = (event.slug ?? "evt").toUpperCase().slice(0, 6);
  const codes: string[] = [];
  for (let i = 0; i < remaining; i++) {
    let code = `TF-${eventSlugPart}-${shortCode()}`;
    let attempts = 0;
    while (attempts < 5) {
      const { data: exists } = await service
        .from("coupons")
        .select("id")
        .eq("code", code)
        .maybeSingle();
      if (!exists) break;
      code = `TF-${eventSlugPart}-${shortCode()}`;
      attempts++;
    }
    const { data: inserted, error: insertErr } = await service
      .from("coupons")
      .insert({
        event_id: eventId,
        code,
        discount_type: dbDiscountType,
        discount_value: cfg.discountValue,
        max_uses: 1,
        times_used: 0,
        applicable_tier_ids: applicableTierIds,
        is_active: true,
        issued_to_profile_id: targetProfileId,
        purpose: "team_friend_invite",
      })
      .select("id")
      .single();
    if (insertErr || !inserted) {
      return {
        error: `Couldn't create coupon ${code}: ${insertErr?.message ?? "unknown"}`,
      };
    }
    codes.push(code);

    const synced = await bestEffortSync(
      () =>
        syncCouponToStripe({
          id: inserted.id,
          code,
          discount_type: dbDiscountType,
          discount_value: cfg.discountValue,
          max_uses: 1,
          valid_until: null,
          is_active: true,
          stripe_coupon_id: null,
          stripe_promotion_code_id: null,
          event_id: eventId,
        }),
      `issueTeamFriendCoupon:${inserted.id}`
    );
    if (synced) {
      await service
        .from("coupons")
        .update({
          stripe_coupon_id: synced.stripe_coupon_id,
          stripe_promotion_code_id: synced.stripe_promotion_code_id,
        })
        .eq("id", inserted.id);
    }
  }

  await service.from("audit_log").insert({
    user_id: user.userId,
    action: "issue_team_friend_coupons",
    entity_type: "coupons",
    entity_id: eventId,
    details: {
      target_profile_id: targetProfileId,
      created: codes.length,
      discount_type: cfg.discountType,
      discount_value: cfg.discountValue,
      applicable_tier_ids: applicableTierIds,
    },
  });

  revalidatePath(`/[locale]/events/${eventId}`, "layout");
  revalidatePath(`/[locale]/events/${eventId}/team-invites`, "layout");
  return { success: true, created: codes.length, codes };
}

export async function revokeTeamFriendCoupon(couponId: string) {
  const user = await requireRole("team_member");
  const service = getServiceClient();
  const { data: coupon } = await service
    .from("coupons")
    .select("id, code, event_id, issued_to_profile_id, times_used, purpose")
    .eq("id", couponId)
    .maybeSingle();
  if (!coupon) return { error: "Coupon not found" };
  if (coupon.purpose !== "team_friend_invite") {
    return { error: "Not a team-friend coupon" };
  }
  if (
    coupon.issued_to_profile_id !== user.userId &&
    !(await isAdminLike(user.role))
  ) {
    return { error: "Forbidden" };
  }
  if ((coupon.times_used ?? 0) > 0) {
    return { error: "This code has already been used and cannot be revoked." };
  }
  const { error } = await service
    .from("coupons")
    .update({ is_active: false })
    .eq("id", couponId);
  if (error) return { error: error.message };
  await service.from("audit_log").insert({
    user_id: user.userId,
    action: "revoke_team_friend_coupon",
    entity_type: "coupons",
    entity_id: couponId,
    details: { code: coupon.code, event_id: coupon.event_id },
  });
  revalidatePath(`/[locale]/events/${coupon.event_id}`, "layout");
  revalidatePath(`/[locale]/events/${coupon.event_id}/team-invites`, "layout");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Re-sync helper — used when event-level or per-member discount changes
// ---------------------------------------------------------------------------

async function resyncTeamFriendCouponsForScope(scope: {
  eventId: string;
  profileId?: string;
  actorUserId: string;
}): Promise<{ syncedCount: number; skippedUsedCount: number; errors: string[] }> {
  const service = getServiceClient();
  let q = service
    .from("coupons")
    .select(
      "id, code, event_id, max_uses, valid_until, times_used, is_active, stripe_coupon_id, stripe_promotion_code_id, issued_to_profile_id"
    )
    .eq("event_id", scope.eventId)
    .eq("purpose", "team_friend_invite");
  if (scope.profileId) q = q.eq("issued_to_profile_id", scope.profileId);
  const { data: coupons } = await q;
  const rows = coupons ?? [];
  let syncedCount = 0;
  let skippedUsedCount = 0;
  const errors: string[] = [];
  for (const c of rows) {
    if ((c.times_used ?? 0) > 0) {
      // Stripe doesn't allow editing a redeemed coupon and the friend already
      // paid at the original rate; leave as-is.
      skippedUsedCount++;
      continue;
    }
    const cfg = await getEffectiveTeamInviteConfig(
      scope.eventId,
      c.issued_to_profile_id as string
    );
    const dbDiscountType = DISCOUNT_TYPE_DB_MAP[cfg.discountType];

    // Update DB first (cheap), then Stripe (slow).
    const { error: updErr } = await service
      .from("coupons")
      .update({
        discount_type: dbDiscountType,
        discount_value: cfg.discountValue,
      })
      .eq("id", c.id);
    if (updErr) {
      errors.push(`${c.code}: ${updErr.message}`);
      continue;
    }

    const synced = await bestEffortSync(
      () =>
        syncCouponToStripe({
          id: c.id,
          code: c.code,
          discount_type: dbDiscountType,
          discount_value: cfg.discountValue,
          max_uses: c.max_uses,
          valid_until: c.valid_until,
          is_active: c.is_active,
          stripe_coupon_id: c.stripe_coupon_id,
          stripe_promotion_code_id: c.stripe_promotion_code_id,
          event_id: c.event_id,
        }),
      `resyncTeamFriendCoupon:${c.id}`
    );
    if (synced) {
      await service
        .from("coupons")
        .update({
          stripe_coupon_id: synced.stripe_coupon_id,
          stripe_promotion_code_id: synced.stripe_promotion_code_id,
        })
        .eq("id", c.id);
      syncedCount++;
    } else {
      errors.push(`${c.code}: Stripe sync failed (see logs)`);
    }
  }
  return { syncedCount, skippedUsedCount, errors };
}

// ---------------------------------------------------------------------------
// Admin matrix view (everyone's codes per event)
// ---------------------------------------------------------------------------

export type TeamMemberInviteSummary = {
  profileId: string;
  displayName: string;
  email: string;
  role: string;
  quota: number;
  isQuotaOverride: boolean;
  discountType: EventDiscountType;
  discountValue: number;
  isDiscountOverride: boolean;
  issued: number;
  used: number;
  remaining: number;
  coupons: {
    id: string;
    code: string;
    timesUsed: number;
    isActive: boolean;
  }[];
};

export async function listEventTeamInvites(
  eventId: string
): Promise<TeamMemberInviteSummary[]> {
  await requireRole("admin");
  const supabase = await createServerClient();
  const service = getServiceClient();

  const { data: event } = await service
    .from("events")
    .select(
      "team_invite_quota, team_invite_discount_type, team_invite_discount_value"
    )
    .eq("id", eventId)
    .single();
  const eventRow = (event ?? {}) as {
    team_invite_quota?: number | null;
    team_invite_discount_type?: EventDiscountType | null;
    team_invite_discount_value?: number | null;
  };
  const defaultQuota = eventRow.team_invite_quota ?? 3;
  const defaultDiscountType: EventDiscountType =
    eventRow.team_invite_discount_type ?? "percent";
  const defaultDiscountValue = eventRow.team_invite_discount_value ?? 0;

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, role")
    .in("role", ["team_member", "manager", "admin", "super_admin"])
    .order("display_name", { ascending: true });

  const { data: overrides } = await service
    .from("event_team_member_quota_overrides")
    .select("profile_id, quota, discount_type, discount_value")
    .eq("event_id", eventId);
  const overrideByProfile = new Map<
    string,
    {
      quota: number;
      discountType?: EventDiscountType | null;
      discountValue?: number | null;
    }
  >(
    (overrides ?? []).map((o) => [
      o.profile_id,
      {
        quota: o.quota,
        discountType: o.discount_type as EventDiscountType | null,
        discountValue: o.discount_value as number | null,
      },
    ])
  );

  const { data: coupons } = await service
    .from("coupons")
    .select("id, code, times_used, is_active, issued_to_profile_id")
    .eq("event_id", eventId)
    .eq("purpose", "team_friend_invite");

  const couponsByProfile = new Map<
    string,
    { id: string; code: string; timesUsed: number; isActive: boolean }[]
  >();
  for (const c of coupons ?? []) {
    const list = couponsByProfile.get(c.issued_to_profile_id ?? "") ?? [];
    list.push({
      id: c.id,
      code: c.code,
      timesUsed: c.times_used ?? 0,
      isActive: !!c.is_active,
    });
    couponsByProfile.set(c.issued_to_profile_id ?? "", list);
  }

  const summaries: TeamMemberInviteSummary[] = [];
  for (const p of profiles ?? []) {
    const { data: authUser } = await service.auth.admin.getUserById(p.id);
    const override = overrideByProfile.get(p.id);
    const quota = override?.quota ?? defaultQuota;
    const discountType =
      override?.discountType ?? defaultDiscountType;
    const discountValue =
      override?.discountValue ?? defaultDiscountValue;
    const list = couponsByProfile.get(p.id) ?? [];
    const issued = list.length;
    const used = list.reduce((s, c) => s + c.timesUsed, 0);
    summaries.push({
      profileId: p.id,
      displayName: p.display_name ?? authUser.user?.email ?? "—",
      email: authUser.user?.email ?? "",
      role: p.role,
      quota,
      isQuotaOverride: override !== undefined && override.quota !== defaultQuota,
      discountType,
      discountValue,
      isDiscountOverride:
        override !== undefined &&
        (override.discountType != null || override.discountValue != null),
      issued,
      used,
      remaining: Math.max(0, quota - issued),
      coupons: list,
    });
  }
  return summaries;
}
