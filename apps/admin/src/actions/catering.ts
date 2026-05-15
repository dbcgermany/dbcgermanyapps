"use server";

import { requireRole } from "@dbc/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import {
  CATERING_CATEGORIES,
  type CateringCategory,
  type CateringMenuItem,
  type CateringSelectionExportRow,
} from "@/lib/catering-types";

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

/**
 * Admin-side equivalent of the public catering form's submit path. Lets an
 * operator log a guest's choices on their behalf (e.g. they confirmed by
 * phone, or are a VIP who doesn't want to use the form). Diff-based upsert
 * so re-running with a different selection updates rather than duplicates.
 * Single-select per starter/main/dessert is enforced — the form helper does
 * the same on the public side.
 */
const SINGLE_SELECT_CATS = new Set<CateringCategory>([
  "starter",
  "main",
  "dessert",
]);

export async function recordManualCateringSelection(input: {
  ticketId: string;
  selectedItemIds: string[];
  notes?: string;
}): Promise<{ success: true } | { error: string }> {
  const actor = await requireRole("manager");
  const service = getServiceClient();

  // Load ticket + event to know which menu the selection belongs to.
  const { data: ticket } = await service
    .from("tickets")
    .select("id, event_id, revoked_at, attendee_email")
    .eq("id", input.ticketId)
    .maybeSingle();
  if (!ticket) return { error: "Ticket not found." };
  if (ticket.revoked_at) return { error: "This ticket has been revoked." };

  // Fetch the active menu items for this event so we can validate that
  // every submitted id belongs to it, AND so the single-select per
  // starter/main/dessert rule is enforced server-side (not just client-side).
  const { data: menu } = await service
    .from("catering_menu_items")
    .select("id, category, max_selections_per_event, selections_count")
    .eq("event_id", ticket.event_id)
    .eq("is_active", true);
  const menuById = new Map(
    (menu ?? []).map((m) => [
      m.id,
      m as {
        id: string;
        category: CateringCategory;
        max_selections_per_event: number | null;
        selections_count: number;
      },
    ])
  );

  const cleanIds = Array.from(new Set(input.selectedItemIds)).filter((id) =>
    menuById.has(id)
  );

  // Enforce one-per-category for starter/main/dessert.
  const seenPerCat = new Map<CateringCategory, number>();
  for (const id of cleanIds) {
    const item = menuById.get(id)!;
    if (SINGLE_SELECT_CATS.has(item.category)) {
      const n = (seenPerCat.get(item.category) ?? 0) + 1;
      seenPerCat.set(item.category, n);
      if (n > 1) {
        return {
          error: `Pick only one ${item.category}.`,
        };
      }
    }
  }

  const noteClean = (input.notes ?? "").trim().slice(0, 500) || null;

  // Diff-based upsert vs. existing selections — mirrors submitCateringSelection
  // in apps/tickets/src/actions/catering-selection.ts.
  const { data: existing } = await service
    .from("ticket_catering_selections")
    .select("menu_item_id")
    .eq("ticket_id", input.ticketId);
  const existingIds = new Set(
    (existing ?? []).map((s) => s.menu_item_id as string)
  );

  // Per-item capacity check (matches public form).
  for (const id of cleanIds) {
    const item = menuById.get(id)!;
    if (item.max_selections_per_event == null) continue;
    if (
      item.selections_count >= item.max_selections_per_event &&
      !existingIds.has(id)
    ) {
      return { error: "That dish is at capacity — pick another." };
    }
  }

  const toDelete = (existing ?? [])
    .map((s) => s.menu_item_id as string)
    .filter((id) => !cleanIds.includes(id));
  const toInsert = cleanIds.filter((id) => !existingIds.has(id));

  if (toDelete.length > 0) {
    await service
      .from("ticket_catering_selections")
      .delete()
      .eq("ticket_id", input.ticketId)
      .in("menu_item_id", toDelete);
  }
  if (toInsert.length > 0) {
    await service.from("ticket_catering_selections").insert(
      toInsert.map((id) => ({
        ticket_id: input.ticketId,
        menu_item_id: id,
        notes: noteClean,
      }))
    );
  }
  if (noteClean !== null) {
    await service
      .from("ticket_catering_selections")
      .update({ notes: noteClean, updated_at: new Date().toISOString() })
      .eq("ticket_id", input.ticketId);
  }

  await service.from("audit_log").insert({
    user_id: actor.userId,
    action: "manual_catering_selection",
    entity_type: "tickets",
    entity_id: input.ticketId,
    details: {
      event_id: ticket.event_id,
      attendee_email: ticket.attendee_email,
      item_count: cleanIds.length,
    },
  });

  revalidatePath(`/[locale]/events/${ticket.event_id}/catering`, "layout");
  return { success: true };
}

export interface CateringCountRow {
  item_id: string;
  category: CateringCategory;
  name_en: string;
  name_de: string;
  name_fr: string;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_halal: boolean;
  allergens: string[];
  sort_order: number;
  count: number;
}

/**
 * Aggregate counts per active menu item for the kitchen report. Returns
 * EVERY active item (even with count=0) so the kitchen sees the full menu
 * with capacity gaps. No attendee names — this feeds the counts-only PDF.
 */
export async function getCateringCounts(
  eventId: string
): Promise<{ items: CateringCountRow[]; totalAttendees: number }> {
  await requireRole("manager");
  const service = getServiceClient();

  const { data: items } = await service
    .from("catering_menu_items")
    .select(
      "id, category, name_en, name_de, name_fr, is_vegetarian, is_vegan, is_halal, allergens, sort_order, selections_count"
    )
    .eq("event_id", eventId)
    .eq("is_active", true)
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true });

  // Distinct attendees who made at least one selection — separate count so
  // the report can show "X attendees confirmed / Y total tickets" if useful.
  const { data: distinctTickets } = await service
    .from("ticket_catering_selections")
    .select("ticket_id, tickets!inner(event_id)")
    .eq("tickets.event_id", eventId);
  const totalAttendees = new Set(
    (distinctTickets ?? []).map((r) => r.ticket_id as string)
  ).size;

  return {
    items: (items ?? []).map((i) => ({
      item_id: i.id,
      category: i.category as CateringCategory,
      name_en: i.name_en,
      name_de: i.name_de,
      name_fr: i.name_fr,
      is_vegetarian: !!i.is_vegetarian,
      is_vegan: !!i.is_vegan,
      is_halal: !!i.is_halal,
      allergens: (i.allergens as string[] | null) ?? [],
      sort_order: i.sort_order ?? 0,
      count: i.selections_count ?? 0,
    })),
    totalAttendees,
  };
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
