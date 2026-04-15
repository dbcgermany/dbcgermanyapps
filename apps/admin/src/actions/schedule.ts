"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { revalidatePath } from "next/cache";

const SCHEDULE_COLUMNS =
  "id, event_id, title_en, title_de, title_fr, description_en, description_de, description_fr, starts_at, ends_at, speaker_name, speaker_title, speaker_image_url, sort_order" as const;

export async function getScheduleItems(eventId: string) {
  await requireRole("manager");
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("event_schedule_items")
    .select(SCHEDULE_COLUMNS)
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function createScheduleItem(formData: FormData) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const eventId = formData.get("event_id") as string;
  const locale = formData.get("locale") as string;
  const titleEn = formData.get("title_en") as string;

  const itemData = {
    event_id: eventId,
    title_en: titleEn,
    title_de: (formData.get("title_de") as string) || titleEn,
    title_fr: (formData.get("title_fr") as string) || titleEn,
    description_en: formData.get("description_en") as string,
    description_de: formData.get("description_de") as string,
    description_fr: formData.get("description_fr") as string,
    starts_at: formData.get("starts_at") as string,
    ends_at: formData.get("ends_at") as string,
    speaker_name: formData.get("speaker_name") as string,
    speaker_title: formData.get("speaker_title") as string,
    sort_order: parseInt((formData.get("sort_order") as string) || "0", 10),
  };

  const { data, error } = await supabase
    .from("event_schedule_items")
    .insert(itemData)
    .select("id")
    .single();

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "create_schedule_item",
    entity_type: "event_schedule_items",
    entity_id: data.id,
    details: { title: titleEn, event_id: eventId },
  });

  revalidatePath(`/${locale}/events/${eventId}/schedule`);
  return { success: true };
}

export async function updateScheduleItem(
  itemId: string,
  formData: FormData
) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const eventId = formData.get("event_id") as string;
  const locale = formData.get("locale") as string;
  const titleEn = formData.get("title_en") as string;

  const itemData = {
    title_en: titleEn,
    title_de: (formData.get("title_de") as string) || titleEn,
    title_fr: (formData.get("title_fr") as string) || titleEn,
    description_en: formData.get("description_en") as string,
    description_de: formData.get("description_de") as string,
    description_fr: formData.get("description_fr") as string,
    starts_at: formData.get("starts_at") as string,
    ends_at: formData.get("ends_at") as string,
    speaker_name: formData.get("speaker_name") as string,
    speaker_title: formData.get("speaker_title") as string,
    sort_order: parseInt((formData.get("sort_order") as string) || "0", 10),
  };

  const { error } = await supabase
    .from("event_schedule_items")
    .update(itemData)
    .eq("id", itemId);

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "update_schedule_item",
    entity_type: "event_schedule_items",
    entity_id: itemId,
    details: { title: titleEn, event_id: eventId },
  });

  revalidatePath(`/${locale}/events/${eventId}/schedule`);
  return { success: true };
}

export async function reorderScheduleItems(
  eventId: string,
  orderedIds: string[],
  locale: string
) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const updates = orderedIds.map((id, index) =>
    supabase
      .from("event_schedule_items")
      .update({ sort_order: index })
      .eq("id", id)
      .eq("event_id", eventId)
  );
  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) return { error: failed.error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "reorder_schedule",
    entity_type: "event_schedule_items",
    entity_id: eventId,
    details: { count: orderedIds.length },
  });

  revalidatePath(`/${locale}/events/${eventId}/schedule`);
  return { success: true };
}

export async function deleteScheduleItem(
  itemId: string,
  eventId: string,
  locale: string
) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const { error } = await supabase
    .from("event_schedule_items")
    .delete()
    .eq("id", itemId);

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "delete_schedule_item",
    entity_type: "event_schedule_items",
    entity_id: itemId,
    details: { event_id: eventId },
  });

  revalidatePath(`/${locale}/events/${eventId}/schedule`);
  return { success: true };
}
