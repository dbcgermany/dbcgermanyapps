"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { revalidatePath } from "next/cache";

export interface RunsheetItem {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  responsible_person: string | null;
  location_note: string | null;
  status: string;
  sort_order: number;
  assigned_to: string | null;
  default_duration_minutes: number | null;
  created_at: string;
  updated_at: string | null;
  assignee?: { display_name: string | null } | null;
}

const ITEM_COLUMNS =
  "id, event_id, title, description, starts_at, ends_at, responsible_person, location_note, status, sort_order, assigned_to, default_duration_minutes, created_at, updated_at" as const;

export async function getRunsheetItems(eventId: string): Promise<RunsheetItem[]> {
  await requireRole("team_member");
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("event_runsheet_items")
    .select(
      `${ITEM_COLUMNS}, assignee:profiles!event_runsheet_items_assigned_to_fkey(display_name)`
    )
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true })
    .order("starts_at", { ascending: true });

  if (error) throw new Error(error.message);

  // Normalize assignee (Supabase may return array from join)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map((r) => ({
    ...r,
    assignee: Array.isArray(r.assignee) ? r.assignee[0] ?? null : r.assignee ?? null,
  })) as RunsheetItem[];
}

export async function createRunsheetItem(
  eventId: string,
  formData: FormData
) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const locale = (formData.get("locale") as string) || "en";

  const title = ((formData.get("title") as string) || "").trim();
  if (!title) return { error: "Title is required." };

  const assignedTo = ((formData.get("assigned_to") as string) || "").trim();

  const { data, error } = await supabase
    .from("event_runsheet_items")
    .insert({
      event_id: eventId,
      title,
      starts_at: (formData.get("starts_at") as string) || null,
      ends_at: (formData.get("ends_at") as string) || null,
      description: ((formData.get("description") as string) || "").trim() || null,
      responsible_person:
        ((formData.get("responsible_person") as string) || "").trim() || null,
      location_note:
        ((formData.get("location_note") as string) || "").trim() || null,
      assigned_to: assignedTo || null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "create_runsheet_item",
    entity_type: "event_runsheet_items",
    entity_id: data.id,
    details: { title, event_id: eventId },
  });

  revalidatePath(`/${locale}/events/${eventId}/runsheet`);
  return { success: true };
}

export async function updateRunsheetItem(id: string, formData: FormData) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const locale = (formData.get("locale") as string) || "en";
  const eventId = formData.get("event_id") as string;

  const patch: Record<string, unknown> = {};

  const fields = [
    "title",
    "description",
    "responsible_person",
    "location_note",
    "starts_at",
    "ends_at",
    "assigned_to",
  ];
  for (const f of fields) {
    const raw = formData.get(f);
    if (raw !== null) {
      const val = typeof raw === "string" ? raw.trim() : "";
      patch[f] = val === "" ? null : val;
    }
  }

  if (formData.get("status") !== null) {
    patch.status = (formData.get("status") as string) || "pending";
  }

  patch.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from("event_runsheet_items")
    .update(patch)
    .eq("id", id);

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "update_runsheet_item",
    entity_type: "event_runsheet_items",
    entity_id: id,
    details: { fields: Object.keys(patch), event_id: eventId },
  });

  revalidatePath(`/${locale}/events/${eventId}/runsheet`);
  return { success: true };
}

export async function deleteRunsheetItem(
  id: string,
  eventId: string,
  locale: string
) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const { error } = await supabase
    .from("event_runsheet_items")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "delete_runsheet_item",
    entity_type: "event_runsheet_items",
    entity_id: id,
    details: { event_id: eventId },
  });

  revalidatePath(`/${locale}/events/${eventId}/runsheet`);
  return { success: true };
}

export async function reorderRunsheetItems(
  eventId: string,
  orderedIds: string[],
  locale: string
) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  // Update each item's sort_order based on its position in orderedIds
  const updates = orderedIds.map((id, idx) =>
    supabase
      .from("event_runsheet_items")
      .update({ sort_order: (idx + 1) * 10 })
      .eq("id", id)
  );
  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) return { error: failed.error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "reorder_runsheet_items",
    entity_type: "event_runsheet_items",
    entity_id: null,
    details: { event_id: eventId, count: orderedIds.length },
  });

  revalidatePath(`/${locale}/events/${eventId}/runsheet`);
  return { success: true };
}

export async function populateRunsheetFromTemplate(
  eventId: string,
  eventStartsAt: string,
  locale: string
) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const { data: templates } = await supabase
    .from("event_runsheet_templates")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (!templates || templates.length === 0)
    return { error: "No templates found." };

  const baseMs = new Date(eventStartsAt).getTime();
  const items = templates.map((t) => {
    const starts = new Date(baseMs + t.default_offset_minutes * 60_000);
    const ends = t.default_duration_minutes
      ? new Date(starts.getTime() + t.default_duration_minutes * 60_000)
      : null;
    return {
      event_id: eventId,
      title: t.title,
      description: t.description,
      responsible_person: t.responsible_role,
      location_note: t.location_note,
      starts_at: starts.toISOString(),
      ends_at: ends?.toISOString() ?? null,
      default_duration_minutes: t.default_duration_minutes,
      sort_order: t.sort_order,
      status: "pending",
    };
  });

  const { error } = await supabase
    .from("event_runsheet_items")
    .insert(items);

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "populate_runsheet",
    entity_type: "event_runsheet_items",
    entity_id: eventId,
    details: { count: items.length },
  });

  revalidatePath(`/${locale}/events/${eventId}/runsheet`);
  return { success: true };
}
