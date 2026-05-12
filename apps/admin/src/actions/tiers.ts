"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { revalidatePath } from "next/cache";
import { slugify, uniqueSlug } from "@/lib/slugify";
import { pingRevalidate } from "@/lib/revalidate";
import {
  archiveTierInStripe,
  bestEffortSync,
  syncTierToStripe,
} from "@/lib/stripe-sync";

async function pingTierPaths(
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

async function persistStripeIdsForTier(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  tierId: string,
  result: Awaited<ReturnType<typeof syncTierToStripe>>
) {
  await supabase
    .from("ticket_tiers")
    .update({
      stripe_product_id: result.stripe_product_id,
      stripe_price_id: result.stripe_price_id,
      stripe_price_archived_ids: result.archived_price_ids,
    })
    .eq("id", tierId);
}

const TIER_COLUMNS =
  "id, event_id, name_en, name_de, name_fr, description_en, description_de, description_fr, price_cents, original_price_cents, currency, max_quantity, quantity_sold, low_stock_threshold_pct, sales_start_at, sales_end_at, is_public, sort_order, stripe_product_id, stripe_price_id, stripe_price_archived_ids, created_at, purpose, catering_included, is_team, is_companion, counts_as_sold, scanner_badge_label" as const;

const TIER_PURPOSES = [
  "public",
  "vip",
  "speaker",
  "team_germany",
  "team_external",
  "companion",
  "team_friend",
  "press",
  "other",
] as const;
type TierPurpose = (typeof TIER_PURPOSES)[number];

function parseTierFlags(formData: FormData) {
  const rawPurpose = (formData.get("purpose") as string) || "public";
  const purpose: TierPurpose = (TIER_PURPOSES as readonly string[]).includes(
    rawPurpose
  )
    ? (rawPurpose as TierPurpose)
    : "public";
  const badge = ((formData.get("scanner_badge_label") as string) ?? "").trim();
  return {
    purpose,
    catering_included: formData.get("catering_included") === "true",
    is_team: formData.get("is_team") === "true",
    is_companion: formData.get("is_companion") === "true",
    counts_as_sold: formData.get("counts_as_sold") !== "false",
    scanner_badge_label: badge.length > 0 ? badge : null,
  };
}

function parseLowStockThresholdPct(
  raw: FormDataEntryValue | null
): number | null {
  const str = typeof raw === "string" ? raw.trim() : "";
  if (str === "") return null;
  const parsed = parseInt(str, 10);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 100) return null;
  return parsed;
}

function parseOriginalPrice(
  raw: FormDataEntryValue | null,
  priceCents: number
): { value: number | null; error?: string } {
  const str = typeof raw === "string" ? raw.trim() : "";
  if (str === "") return { value: null };
  const parsed = parseFloat(str);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return { value: null, error: "Regular price must be a positive number." };
  }
  const cents = Math.round(parsed * 100);
  if (cents < priceCents) {
    return {
      value: null,
      error: "Regular price must be higher than the current price.",
    };
  }
  return { value: cents };
}

export async function getTiers(eventId: string) {
  await requireRole("manager");
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("ticket_tiers")
    .select(TIER_COLUMNS)
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function createTier(formData: FormData) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const eventId = formData.get("event_id") as string;
  const locale = formData.get("locale") as string;
  const nameEn = formData.get("name_en") as string;

  // ticket_tiers.slug is NOT NULL with UNIQUE(event_id, slug) for bulk-invite
  // CSV imports; derive it from name_en and ensure it doesn't collide inside
  // this event.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const slug = await uniqueSlug(supabase as any, "ticket_tiers", slugify(nameEn, "tier"), undefined, {
    column: "event_id",
    value: eventId,
  });

  const priceCents = Math.round(
    parseFloat(formData.get("price") as string) * 100
  );
  const originalPrice = parseOriginalPrice(
    formData.get("original_price"),
    priceCents
  );
  if (originalPrice.error) return { error: originalPrice.error };

  const lowStockPct = parseLowStockThresholdPct(
    formData.get("low_stock_threshold_pct")
  );

  const tierData = {
    event_id: eventId,
    slug,
    name_en: nameEn,
    name_de: (formData.get("name_de") as string) || nameEn,
    name_fr: (formData.get("name_fr") as string) || nameEn,
    description_en: formData.get("description_en") as string,
    description_de: formData.get("description_de") as string,
    description_fr: formData.get("description_fr") as string,
    price_cents: priceCents,
    original_price_cents: originalPrice.value,
    max_quantity: formData.get("max_quantity")
      ? parseInt(formData.get("max_quantity") as string, 10)
      : null,
    ...(lowStockPct != null ? { low_stock_threshold_pct: lowStockPct } : {}),
    sales_start_at: (formData.get("sales_start_at") as string) || null,
    sales_end_at: (formData.get("sales_end_at") as string) || null,
    is_public: formData.get("is_public") === "true",
    sort_order: parseInt((formData.get("sort_order") as string) || "0", 10),
    ...parseTierFlags(formData),
  };

  const { data, error } = await supabase
    .from("ticket_tiers")
    .insert(tierData)
    .select("id")
    .single();

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "create_tier",
    entity_type: "ticket_tiers",
    entity_id: data.id,
    details: { name: nameEn, event_id: eventId },
  });

  const synced = await bestEffortSync(
    () =>
      syncTierToStripe({
        id: data.id,
        event_id: eventId,
        name_en: nameEn,
        description_en: tierData.description_en,
        price_cents: priceCents,
        currency: "EUR",
        stripe_product_id: null,
        stripe_price_id: null,
        stripe_price_archived_ids: [],
        is_public: tierData.is_public,
      }),
    `createTier:${data.id}`
  );
  if (synced) await persistStripeIdsForTier(supabase, data.id, synced);

  revalidatePath(`/${locale}/events/${eventId}/tiers`);
  await pingTierPaths(supabase, eventId);
  return {
    success: true,
    stripeWarning: synced ? null : "Saved locally — Stripe sync failed. Click Resync.",
  };
}

export async function updateTier(tierId: string, formData: FormData) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const eventId = formData.get("event_id") as string;
  const locale = formData.get("locale") as string;
  const nameEn = formData.get("name_en") as string;

  const priceCents = Math.round(
    parseFloat(formData.get("price") as string) * 100
  );
  const originalPrice = parseOriginalPrice(
    formData.get("original_price"),
    priceCents
  );
  if (originalPrice.error) return { error: originalPrice.error };

  const lowStockPct = parseLowStockThresholdPct(
    formData.get("low_stock_threshold_pct")
  );

  const tierData = {
    name_en: nameEn,
    name_de: (formData.get("name_de") as string) || nameEn,
    name_fr: (formData.get("name_fr") as string) || nameEn,
    description_en: formData.get("description_en") as string,
    description_de: formData.get("description_de") as string,
    description_fr: formData.get("description_fr") as string,
    price_cents: priceCents,
    original_price_cents: originalPrice.value,
    max_quantity: formData.get("max_quantity")
      ? parseInt(formData.get("max_quantity") as string, 10)
      : null,
    ...(lowStockPct != null ? { low_stock_threshold_pct: lowStockPct } : {}),
    sales_start_at: (formData.get("sales_start_at") as string) || null,
    sales_end_at: (formData.get("sales_end_at") as string) || null,
    sort_order: parseInt((formData.get("sort_order") as string) || "0", 10),
    ...parseTierFlags(formData),
  };

  const { error } = await supabase
    .from("ticket_tiers")
    .update(tierData)
    .eq("id", tierId);

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "update_tier",
    entity_type: "ticket_tiers",
    entity_id: tierId,
    details: { name: nameEn, event_id: eventId },
  });

  const { data: existing } = await supabase
    .from("ticket_tiers")
    .select(
      "id, event_id, name_en, description_en, price_cents, currency, stripe_product_id, stripe_price_id, stripe_price_archived_ids, is_public"
    )
    .eq("id", tierId)
    .single();
  let synced: Awaited<ReturnType<typeof syncTierToStripe>> | null = null;
  if (existing) {
    synced = await bestEffortSync(
      () => syncTierToStripe(existing),
      `updateTier:${tierId}`
    );
    if (synced) await persistStripeIdsForTier(supabase, tierId, synced);
  }

  revalidatePath(`/${locale}/events/${eventId}/tiers`);
  await pingTierPaths(supabase, eventId);
  return {
    success: true,
    stripeWarning: synced ? null : "Saved locally — Stripe sync failed. Click Resync.",
  };
}

export async function toggleTierPublic(
  tierId: string,
  eventId: string,
  locale: string
) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const { data: tier } = await supabase
    .from("ticket_tiers")
    .select(
      "is_public, name_en, event_id, description_en, price_cents, currency, stripe_product_id, stripe_price_id, stripe_price_archived_ids"
    )
    .eq("id", tierId)
    .single();

  if (!tier) return { error: "Tier not found" };

  const newIsPublic = !tier.is_public;
  const { error } = await supabase
    .from("ticket_tiers")
    .update({ is_public: newIsPublic })
    .eq("id", tierId);

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: tier.is_public ? "hide_tier" : "publish_tier",
    entity_type: "ticket_tiers",
    entity_id: tierId,
    details: { name: tier.name_en, event_id: eventId },
  });

  const synced = await bestEffortSync(
    () =>
      syncTierToStripe({
        id: tierId,
        event_id: tier.event_id,
        name_en: tier.name_en,
        description_en: tier.description_en,
        price_cents: tier.price_cents,
        currency: tier.currency,
        stripe_product_id: tier.stripe_product_id,
        stripe_price_id: tier.stripe_price_id,
        stripe_price_archived_ids: tier.stripe_price_archived_ids,
        is_public: newIsPublic,
      }),
    `toggleTierPublic:${tierId}`
  );
  if (synced) await persistStripeIdsForTier(supabase, tierId, synced);

  revalidatePath(`/${locale}/events/${eventId}/tiers`);
  await pingTierPaths(supabase, eventId);
  return { success: true };
}

export async function reorderTiers(
  eventId: string,
  orderedIds: string[],
  locale: string
) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const updates = orderedIds.map((id, index) =>
    supabase
      .from("ticket_tiers")
      .update({ sort_order: index })
      .eq("id", id)
      .eq("event_id", eventId)
  );
  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) return { error: failed.error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "reorder_tiers",
    entity_type: "ticket_tiers",
    entity_id: eventId,
    details: { count: orderedIds.length },
  });

  revalidatePath(`/${locale}/events/${eventId}/tiers`);
  await pingTierPaths(supabase, eventId);
  return { success: true };
}

export async function deleteTier(tierId: string, eventId: string, locale: string) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const { data: tier } = await supabase
    .from("ticket_tiers")
    .select("name_en, quantity_sold, stripe_product_id, stripe_price_id")
    .eq("id", tierId)
    .single();

  if (!tier) return { error: "Tier not found." };
  if (tier.quantity_sold > 0) {
    return { error: "Cannot delete a tier that has sold tickets." };
  }

  // Archive Stripe entities before the DB delete so we don't lose the IDs.
  await bestEffortSync(
    () => archiveTierInStripe(tier.stripe_product_id, tier.stripe_price_id),
    `deleteTier:${tierId}`
  );

  // Atomic guard: the WHERE clause prevents racing with a concurrent purchase
  // that was mid-reservation when we read quantity_sold above. If a sale
  // landed between read + delete, this returns 0 affected rows.
  const { error, count } = await supabase
    .from("ticket_tiers")
    .delete({ count: "exact" })
    .eq("id", tierId)
    .eq("quantity_sold", 0);

  if (error) return { error: error.message };
  if (count === 0) {
    return {
      error:
        "Tier could not be deleted — a sale was registered while you were viewing this page. Refresh and try again.",
    };
  }

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "delete_tier",
    entity_type: "ticket_tiers",
    entity_id: tierId,
    details: { name: tier?.name_en, event_id: eventId },
  });

  revalidatePath(`/${locale}/events/${eventId}/tiers`);
  await pingTierPaths(supabase, eventId);
  return { success: true };
}

export async function resyncTierToStripe(tierId: string) {
  await requireRole("manager");
  const supabase = await createServerClient();
  const { data: tier } = await supabase
    .from("ticket_tiers")
    .select(
      "id, event_id, name_en, description_en, price_cents, currency, stripe_product_id, stripe_price_id, stripe_price_archived_ids, is_public"
    )
    .eq("id", tierId)
    .single();
  if (!tier) return { error: "Tier not found" };
  const synced = await bestEffortSync(
    () => syncTierToStripe(tier),
    `resync:${tierId}`
  );
  if (!synced) return { error: "Stripe sync failed. Check logs." };
  await persistStripeIdsForTier(supabase, tierId, synced);
  return { success: true };
}
