"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { bestEffortSync, syncCouponToStripe } from "@/lib/stripe-sync";

// Each Germany team member can issue a small batch of discounted invite
// coupons their friends use at the public checkout to bring a public tier
// down to the team_invite_tier price (e.g. Premium €129 → Starter price €49).
//
// All knobs live on the event row:
//   events.team_invite_quota         — default slot count
//   events.team_invite_tier_id       — reference tier whose price_cents
//                                       is the target friend price
//
// The coupon's discount = (next_paid_public_tier.price_cents - target_price).
// One coupon per slot; max_uses = 1; tied to the issuing team member via
// coupons.issued_to_profile_id.

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

export async function getMyEffectiveQuota(eventId: string, profileId: string) {
  const user = await requireRole("team_member");
  if (profileId !== user.userId && !(await isAdminLike(user.role))) {
    throw new Error("Forbidden");
  }
  const supabase = await createServerClient();
  const { data: override } = await supabase
    .from("event_team_member_quota_overrides")
    .select("quota")
    .eq("event_id", eventId)
    .eq("profile_id", profileId)
    .maybeSingle();
  if (override?.quota != null) return override.quota;
  const { data: event } = await supabase
    .from("events")
    .select("team_invite_quota")
    .eq("id", eventId)
    .maybeSingle();
  return event?.team_invite_quota ?? 3;
}

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

export async function listMyTeamFriendCoupons(
  eventId: string,
  profileId?: string
) {
  const user = await requireRole("team_member");
  const targetProfileId = profileId ?? user.userId;
  if (targetProfileId !== user.userId && !(await isAdminLike(user.role))) {
    throw new Error("Forbidden");
  }
  const service = getServiceClient();
  const { data, error } = await service
    .from("coupons")
    .select(
      "id, code, discount_value, max_uses, times_used, is_active, applicable_tier_ids, created_at"
    )
    .eq("event_id", eventId)
    .eq("issued_to_profile_id", targetProfileId)
    .eq("purpose", "team_friend_invite")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

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

  // 1. Load event configuration.
  const { data: event } = await service
    .from("events")
    .select("id, slug, team_invite_quota, team_invite_tier_id")
    .eq("id", eventId)
    .single();
  if (!event) return { error: "Event not found" };
  if (!event.team_invite_tier_id) {
    return {
      error:
        "Team-friend invites are not configured for this event. Set a target tier in event settings.",
    };
  }

  // 2. Resolve target tier (the price the friend ends up paying).
  const { data: targetTier } = await service
    .from("ticket_tiers")
    .select("id, price_cents")
    .eq("id", event.team_invite_tier_id)
    .single();
  if (!targetTier) {
    return { error: "Target team-friend tier is missing." };
  }

  // 3. Pick the source tier — the cheapest paid public tier strictly above
  //    the target price. This is what the friend selects at checkout; the
  //    coupon brings it down to the target.
  const { data: candidates } = await service
    .from("ticket_tiers")
    .select("id, name_en, price_cents, is_public, counts_as_sold")
    .eq("event_id", eventId)
    .eq("is_public", true)
    .eq("counts_as_sold", true)
    .gt("price_cents", targetTier.price_cents)
    .order("price_cents", { ascending: true });
  const sourceTier = (candidates ?? [])[0];
  if (!sourceTier) {
    return {
      error:
        "No public retail tier is priced above the team-friend target. Add a higher tier first.",
    };
  }
  const discountValue = sourceTier.price_cents - targetTier.price_cents;

  // 4. Effective quota → how many more slots to issue.
  const quota = await getMyEffectiveQuota(eventId, targetProfileId);
  const existing = await listMyTeamFriendCoupons(eventId, targetProfileId);
  const remaining = Math.max(0, quota - existing.length);
  if (remaining === 0) {
    return {
      success: true,
      created: 0,
      message: "You already have all your invite slots.",
    };
  }

  // 5. Generate codes + insert, then Stripe-sync each.
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
        discount_type: "fixed_amount",
        discount_value: discountValue,
        max_uses: 1,
        times_used: 0,
        applicable_tier_ids: [sourceTier.id],
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
          discount_type: "fixed_amount",
          discount_value: discountValue,
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
      discount_value: discountValue,
      source_tier_id: sourceTier.id,
    },
  });

  revalidatePath(`/[locale]/account/event-invites`, "layout");
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
  revalidatePath(`/[locale]/account/event-invites`, "layout");
  revalidatePath(`/[locale]/events/${coupon.event_id}/team-invites`, "layout");
  return { success: true };
}

export type TeamMemberInviteSummary = {
  profileId: string;
  displayName: string;
  email: string;
  role: string;
  quota: number;
  isOverride: boolean;
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
    .select("team_invite_quota")
    .eq("id", eventId)
    .single();
  const defaultQuota = event?.team_invite_quota ?? 3;

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, role")
    .in("role", ["team_member", "manager", "admin", "super_admin"])
    .order("display_name", { ascending: true });

  const { data: overrides } = await service
    .from("event_team_member_quota_overrides")
    .select("profile_id, quota")
    .eq("event_id", eventId);
  const overrideByProfile = new Map(
    (overrides ?? []).map((o) => [o.profile_id, o.quota])
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
    const quota = override ?? defaultQuota;
    const list = couponsByProfile.get(p.id) ?? [];
    const issued = list.length;
    const used = list.reduce((s, c) => s + c.timesUsed, 0);
    summaries.push({
      profileId: p.id,
      displayName: p.display_name ?? authUser.user?.email ?? "—",
      email: authUser.user?.email ?? "",
      role: p.role,
      quota,
      isOverride: override !== undefined,
      issued,
      used,
      remaining: Math.max(0, quota - issued),
      coupons: list,
    });
  }
  return summaries;
}
