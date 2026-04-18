"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { revalidatePath } from "next/cache";

export async function getRunsheetItems(eventId: string) {
  await requireRole("team_member");
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("event_runsheet_items")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true })
    .order("starts_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
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
