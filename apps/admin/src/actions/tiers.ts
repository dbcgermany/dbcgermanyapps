"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { revalidatePath } from "next/cache";
import { slugify, uniqueSlug } from "@/lib/slugify";
import { pingRevalidate } from "@/lib/revalidate";

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

const TIER_COLUMNS =
  "id, event_id, name_en, name_de, name_fr, description_en, description_de, description_fr, price_cents, currency, max_quantity, quantity_sold, sales_start_at, sales_end_at, is_public, sort_order, created_at" as const;

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

  const tierData = {
    event_id: eventId,
    slug,
    name_en: nameEn,
    name_de: (formData.get("name_de") as string) || nameEn,
    name_fr: (formData.get("name_fr") as string) || nameEn,
    description_en: formData.get("description_en") as string,
    description_de: formData.get("description_de") as string,
    description_fr: formData.get("description_fr") as string,
    price_cents: Math.round(
      parseFloat(formData.get("price") as string) * 100
    ),
    max_quantity: formData.get("max_quantity")
      ? parseInt(formData.get("max_quantity") as string, 10)
      : null,
    sales_start_at: (formData.get("sales_start_at") as string) || null,
    sales_end_at: (formData.get("sales_end_at") as string) || null,
    is_public: formData.get("is_public") === "true",
    sort_order: parseInt((formData.get("sort_order") as string) || "0", 10),
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

  revalidatePath(`/${locale}/events/${eventId}/tiers`);
  await pingTierPaths(supabase, eventId);
  return { success: true };
}

export async function updateTier(tierId: string, formData: FormData) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const eventId = formData.get("event_id") as string;
  const locale = formData.get("locale") as string;
  const nameEn = formData.get("name_en") as string;

  const tierData = {
    name_en: nameEn,
    name_de: (formData.get("name_de") as string) || nameEn,
    name_fr: (formData.get("name_fr") as string) || nameEn,
    description_en: formData.get("description_en") as string,
    description_de: formData.get("description_de") as string,
    description_fr: formData.get("description_fr") as string,
    price_cents: Math.round(
      parseFloat(formData.get("price") as string) * 100
    ),
    max_quantity: formData.get("max_quantity")
      ? parseInt(formData.get("max_quantity") as string, 10)
      : null,
    sales_start_at: (formData.get("sales_start_at") as string) || null,
    sales_end_at: (formData.get("sales_end_at") as string) || null,
    sort_order: parseInt((formData.get("sort_order") as string) || "0", 10),
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

  revalidatePath(`/${locale}/events/${eventId}/tiers`);
  await pingTierPaths(supabase, eventId);
  return { success: true };
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
    .select("is_public, name_en")
    .eq("id", tierId)
    .single();

  if (!tier) return { error: "Tier not found" };

  const { error } = await supabase
    .from("ticket_tiers")
    .update({ is_public: !tier.is_public })
    .eq("id", tierId);

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: tier.is_public ? "hide_tier" : "publish_tier",
    entity_type: "ticket_tiers",
    entity_id: tierId,
    details: { name: tier.name_en, event_id: eventId },
  });

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
    .select("name_en, quantity_sold")
    .eq("id", tierId)
    .single();

  if (tier && tier.quantity_sold > 0) {
    return { error: "Cannot delete a tier that has sold tickets." };
  }

  const { error } = await supabase
    .from("ticket_tiers")
    .delete()
    .eq("id", tierId);

  if (error) return { error: error.message };

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
