"use server";

// Thin compatibility layer over the unified runsheet (program) actions.
// The Schedule page is now a filtered view of the runsheet (is_public = true),
// so the old schedule writes route through the same canonical action set.
// Kept as a separate file only because some existing imports point here;
// remove this file once those importers are migrated.

import { revalidatePath } from "next/cache";
import { createServerClient, requireRole } from "@dbc/supabase/server";
import {
  createRunsheetItem,
  updateRunsheetItem,
  deleteRunsheetItem,
  reorderRunsheetItems,
} from "./runsheet";

function rewriteScheduleFormDataAsRunsheet(formData: FormData): FormData {
  // Old schedule form posted EN/DE/FR titles + inline speaker fields.
  // Map them onto the unified runsheet field shape and mark the row public
  // (legacy schedule entries are always part of the public agenda).
  const titleEn = (formData.get("title_en") as string) || "";
  if (titleEn && !formData.get("title")) {
    formData.set("title", titleEn);
  }
  const descriptionEn = (formData.get("description_en") as string) || "";
  if (descriptionEn && !formData.get("description")) {
    formData.set("description", descriptionEn);
  }
  if (!formData.get("is_public")) {
    formData.set("is_public", "on");
  }
  return formData;
}

export async function getScheduleItems(eventId: string) {
  await requireRole("manager");
  const supabase = await createServerClient();

  // Read through the back-compat VIEW so any caller that expected the old
  // schedule shape keeps working. New callers should prefer getRunsheetItems
  // with { publicOnly: true }.
  const { data, error } = await supabase
    .from("event_schedule_items")
    .select(
      "id, event_id, title_en, title_de, title_fr, description_en, description_de, description_fr, starts_at, ends_at, speaker_id, speaker_first_name, speaker_last_name, speaker_name, speaker_title, speaker_image_url, sort_order"
    )
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function createScheduleItem(formData: FormData) {
  const eventId = formData.get("event_id") as string;
  const locale = (formData.get("locale") as string) || "en";
  const result = await createRunsheetItem(
    eventId,
    rewriteScheduleFormDataAsRunsheet(formData)
  );
  revalidatePath(`/${locale}/events/${eventId}/schedule`);
  return result;
}

export async function updateScheduleItem(
  itemId: string,
  formData: FormData
) {
  const eventId = formData.get("event_id") as string;
  const locale = (formData.get("locale") as string) || "en";
  const result = await updateRunsheetItem(
    itemId,
    rewriteScheduleFormDataAsRunsheet(formData)
  );
  revalidatePath(`/${locale}/events/${eventId}/schedule`);
  return result;
}

export async function reorderScheduleItems(
  eventId: string,
  orderedIds: string[],
  locale: string
) {
  return reorderRunsheetItems(eventId, orderedIds, locale);
}

export async function deleteScheduleItem(
  itemId: string,
  eventId: string,
  locale: string
) {
  return deleteRunsheetItem(itemId, eventId, locale);
}
