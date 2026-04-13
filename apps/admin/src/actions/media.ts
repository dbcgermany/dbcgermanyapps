"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { revalidatePath } from "next/cache";

export async function getEventMedia(eventId: string) {
  await requireRole("manager");
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("event_media")
    .select("id, type, url, title, sort_order, created_at")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function addEventMedia(formData: FormData) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const eventId = formData.get("event_id") as string;
  const locale = formData.get("locale") as string;
  const type = formData.get("type") as "photo" | "video" | "link";
  const url = (formData.get("url") as string).trim();
  const title = (formData.get("title") as string).trim();
  const sortOrder = parseInt((formData.get("sort_order") as string) || "0", 10);

  if (!url) return { error: "URL is required" };

  // Basic URL validation
  try {
    new URL(url);
  } catch {
    return { error: "Invalid URL" };
  }

  const { data, error } = await supabase
    .from("event_media")
    .insert({
      event_id: eventId,
      type,
      url,
      title: title || null,
      sort_order: sortOrder,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "add_event_media",
    entity_type: "event_media",
    entity_id: data.id,
    details: { event_id: eventId, type, url },
  });

  revalidatePath(`/${locale}/events/${eventId}/media`);
  return { success: true };
}

export async function deleteEventMedia(
  mediaId: string,
  eventId: string,
  locale: string
) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const { error } = await supabase
    .from("event_media")
    .delete()
    .eq("id", mediaId);

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "delete_event_media",
    entity_type: "event_media",
    entity_id: mediaId,
    details: { event_id: eventId },
  });

  revalidatePath(`/${locale}/events/${eventId}/media`);
  return { success: true };
}
