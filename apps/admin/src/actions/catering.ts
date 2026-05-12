"use server";

import { requireRole } from "@dbc/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export type CateringCategory =
  | "starter"
  | "main"
  | "dessert"
  | "drink_non_alcoholic"
  | "drink_alcoholic"
  | "snack";

export const CATERING_CATEGORIES: readonly CateringCategory[] = [
  "starter",
  "main",
  "dessert",
  "drink_non_alcoholic",
  "drink_alcoholic",
  "snack",
];

export interface CateringMenuItem {
  id: string;
  event_id: string;
  category: CateringCategory;
  name_en: string;
  name_de: string;
  name_fr: string;
  description_en: string | null;
  description_de: string | null;
  description_fr: string | null;
  is_vegetarian: boolean | null;
  is_vegan: boolean | null;
  is_halal: boolean | null;
  allergens: string[] | null;
  sort_order: number | null;
  is_active: boolean;
  max_selections_per_event: number | null;
  selections_count: number;
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function readAllergens(raw: FormDataEntryValue | null): string[] {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function buildPayload(formData: FormData) {
  const category = formData.get("category") as CateringCategory;
  if (!CATERING_CATEGORIES.includes(category)) {
    throw new Error("Invalid category");
  }
  const nameEn = ((formData.get("name_en") as string) ?? "").trim();
  if (!nameEn) throw new Error("Name (EN) required");
  return {
    category,
    name_en: nameEn,
    name_de: ((formData.get("name_de") as string) ?? "").trim() || nameEn,
    name_fr: ((formData.get("name_fr") as string) ?? "").trim() || nameEn,
    description_en:
      ((formData.get("description_en") as string) ?? "").trim() || null,
    description_de:
      ((formData.get("description_de") as string) ?? "").trim() || null,
    description_fr:
      ((formData.get("description_fr") as string) ?? "").trim() || null,
    is_vegetarian: formData.get("is_vegetarian") === "true",
    is_vegan: formData.get("is_vegan") === "true",
    is_halal: formData.get("is_halal") === "true",
    allergens: readAllergens(formData.get("allergens")),
    sort_order: formData.get("sort_order")
      ? parseInt(formData.get("sort_order") as string, 10)
      : 0,
    max_selections_per_event: formData.get("max_selections_per_event")
      ? parseInt(formData.get("max_selections_per_event") as string, 10)
      : null,
    is_active: formData.get("is_active") !== "false",
  };
}

export async function listCateringMenu(
  eventId: string
): Promise<CateringMenuItem[]> {
  await requireRole("manager");
  const service = getServiceClient();
  const { data, error } = await service
    .from("catering_menu_items")
    .select(
      "id, event_id, category, name_en, name_de, name_fr, description_en, description_de, description_fr, is_vegetarian, is_vegan, is_halal, allergens, sort_order, is_active, max_selections_per_event, selections_count"
    )
    .eq("event_id", eventId)
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as CateringMenuItem[];
}

export async function createCateringMenuItem(
  eventId: string,
  formData: FormData
) {
  const actor = await requireRole("admin");
  const service = getServiceClient();
  try {
    const payload = buildPayload(formData);
    const { error } = await service
      .from("catering_menu_items")
      .insert({ ...payload, event_id: eventId });
    if (error) return { error: error.message };
    await service.from("audit_log").insert({
      user_id: actor.userId,
      action: "create_catering_menu_item",
      entity_type: "catering_menu_items",
      entity_id: eventId,
      details: { event_id: eventId, name: payload.name_en },
    });
    revalidatePath(`/[locale]/events/${eventId}/catering`, "layout");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed" };
  }
}

export async function updateCateringMenuItem(
  itemId: string,
  formData: FormData
) {
  const actor = await requireRole("admin");
  const service = getServiceClient();
  try {
    const payload = buildPayload(formData);
    const { data, error } = await service
      .from("catering_menu_items")
      .update(payload)
      .eq("id", itemId)
      .select("event_id")
      .single();
    if (error) return { error: error.message };
    await service.from("audit_log").insert({
      user_id: actor.userId,
      action: "update_catering_menu_item",
      entity_type: "catering_menu_items",
      entity_id: itemId,
    });
    revalidatePath(`/[locale]/events/${data.event_id}/catering`, "layout");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed" };
  }
}

export async function deleteCateringMenuItem(itemId: string) {
  const actor = await requireRole("admin");
  const service = getServiceClient();
  const { data: existing } = await service
    .from("catering_menu_items")
    .select("event_id, selections_count")
    .eq("id", itemId)
    .maybeSingle();
  if (!existing) return { error: "Item not found" };
  if ((existing.selections_count ?? 0) > 0) {
    return {
      error:
        "Selected by guests already — deactivate instead so existing selections stay valid.",
    };
  }
  const { error } = await service
    .from("catering_menu_items")
    .delete()
    .eq("id", itemId);
  if (error) return { error: error.message };
  await service.from("audit_log").insert({
    user_id: actor.userId,
    action: "delete_catering_menu_item",
    entity_type: "catering_menu_items",
    entity_id: itemId,
  });
  revalidatePath(`/[locale]/events/${existing.event_id}/catering`, "layout");
  return { success: true };
}

export async function toggleCateringMenuItemActive(
  itemId: string,
  active: boolean
) {
  const actor = await requireRole("admin");
  const service = getServiceClient();
  const { data, error } = await service
    .from("catering_menu_items")
    .update({ is_active: active })
    .eq("id", itemId)
    .select("event_id")
    .single();
  if (error) return { error: error.message };
  await service.from("audit_log").insert({
    user_id: actor.userId,
    action: active ? "activate_catering_item" : "deactivate_catering_item",
    entity_type: "catering_menu_items",
    entity_id: itemId,
  });
  revalidatePath(`/[locale]/events/${data.event_id}/catering`, "layout");
  return { success: true };
}

export interface CateringSelectionExportRow {
  ticketShortId: string;
  attendeeName: string;
  attendeeEmail: string;
  tierName: string;
  tierPurpose: string | null;
  category: CateringCategory;
  itemName: string;
  allergens: string[];
  dietary: string;
  notes: string;
  selectionCreatedAt: string;
}

export async function exportCateringSelections(
  eventId: string
): Promise<CateringSelectionExportRow[]> {
  await requireRole("admin");
  const service = getServiceClient();
  const { data, error } = await service
    .from("ticket_catering_selections")
    .select(
      `id, notes, created_at,
       tickets!inner(id, ticket_token, attendee_name, attendee_email, attendee_first_name, attendee_last_name, event_id, ticket_tiers:ticket_tiers!inner(name_de, name_en, purpose)),
       catering_menu_items!inner(category, name_de, name_en, is_vegetarian, is_vegan, is_halal, allergens)`
    )
    .eq("tickets.event_id", eventId);
  if (error) throw new Error(error.message);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map((r) => {
    const ticket = r.tickets;
    const tier = ticket?.ticket_tiers;
    const item = r.catering_menu_items;
    const attendeeName =
      [ticket?.attendee_first_name, ticket?.attendee_last_name]
        .filter(Boolean)
        .join(" ") ||
      ticket?.attendee_name ||
      "—";
    const dietaryFlags: string[] = [];
    if (item?.is_vegetarian) dietaryFlags.push("vegetarian");
    if (item?.is_vegan) dietaryFlags.push("vegan");
    if (item?.is_halal) dietaryFlags.push("halal");
    return {
      ticketShortId: (ticket?.id ?? "").slice(0, 8),
      attendeeName,
      attendeeEmail: ticket?.attendee_email ?? "",
      tierName: tier?.name_de ?? tier?.name_en ?? "",
      tierPurpose: tier?.purpose ?? null,
      category: item?.category ?? "other",
      itemName: item?.name_de ?? item?.name_en ?? "",
      allergens: item?.allergens ?? [],
      dietary: dietaryFlags.join("|"),
      notes: r.notes ?? "",
      selectionCreatedAt: r.created_at,
    };
  });
}
