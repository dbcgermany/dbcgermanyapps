"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ---------------------------------------------------------------------------
// Column selections (no SELECT *)
// ---------------------------------------------------------------------------
const EVENT_LIST_COLUMNS =
  "id, slug, title_en, title_de, title_fr, event_type, starts_at, ends_at, capacity, is_published, cover_image_url, city" as const;

const EVENT_DETAIL_COLUMNS =
  "id, slug, title_en, title_de, title_fr, description_en, description_de, description_fr, event_type, venue_name, venue_address, city, country, timezone, starts_at, ends_at, capacity, max_tickets_per_order, enabled_payment_methods, cover_image_url, is_published, created_at, updated_at" as const;

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getEvents() {
  await requireRole("manager");
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("events")
    .select(EVENT_LIST_COLUMNS)
    .order("starts_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getEvent(id: string) {
  await requireRole("manager");
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("events")
    .select(EVENT_DETAIL_COLUMNS)
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createEvent(formData: FormData) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const locale = formData.get("locale") as string;

  const titleEn = formData.get("title_en") as string;
  const slug = slugify(titleEn) + "-" + Date.now().toString(36);

  const eventData = {
    slug,
    title_en: titleEn,
    title_de: (formData.get("title_de") as string) || titleEn,
    title_fr: (formData.get("title_fr") as string) || titleEn,
    description_en: formData.get("description_en") as string,
    description_de: formData.get("description_de") as string,
    description_fr: formData.get("description_fr") as string,
    event_type: formData.get("event_type") as string,
    venue_name: formData.get("venue_name") as string,
    venue_address: formData.get("venue_address") as string,
    city: formData.get("city") as string,
    timezone: (formData.get("timezone") as string) || "Europe/Berlin",
    starts_at: formData.get("starts_at") as string,
    ends_at: formData.get("ends_at") as string,
    capacity: parseInt(formData.get("capacity") as string, 10),
    max_tickets_per_order: parseInt(
      (formData.get("max_tickets_per_order") as string) || "10",
      10
    ),
    is_published: false,
  };

  const { data, error } = await supabase
    .from("events")
    .insert(eventData)
    .select("id")
    .single();

  if (error) return { error: error.message };

  // Audit log
  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "create_event",
    entity_type: "events",
    entity_id: data.id,
    details: { title: titleEn },
  });

  revalidatePath(`/${locale}/events`);
  redirect(`/${locale}/events/${data.id}`);
}

export async function updateEvent(id: string, formData: FormData) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const locale = formData.get("locale") as string;

  // Optimistic locking: check updated_at hasn't changed
  const expectedUpdatedAt = formData.get("updated_at") as string;

  const eventData = {
    title_en: formData.get("title_en") as string,
    title_de: formData.get("title_de") as string,
    title_fr: formData.get("title_fr") as string,
    description_en: formData.get("description_en") as string,
    description_de: formData.get("description_de") as string,
    description_fr: formData.get("description_fr") as string,
    event_type: formData.get("event_type") as string,
    venue_name: formData.get("venue_name") as string,
    venue_address: formData.get("venue_address") as string,
    city: formData.get("city") as string,
    timezone: formData.get("timezone") as string,
    starts_at: formData.get("starts_at") as string,
    ends_at: formData.get("ends_at") as string,
    capacity: parseInt(formData.get("capacity") as string, 10),
    max_tickets_per_order: parseInt(
      formData.get("max_tickets_per_order") as string,
      10
    ),
  };

  const { error } = await supabase
    .from("events")
    .update(eventData)
    .eq("id", id)
    .eq("updated_at", expectedUpdatedAt) // Optimistic lock
    .select("id")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return {
        error:
          "This event was modified by another user. Please refresh and try again.",
      };
    }
    return { error: error.message };
  }

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "update_event",
    entity_type: "events",
    entity_id: id,
    details: { title: eventData.title_en },
  });

  revalidatePath(`/${locale}/events`);
  revalidatePath(`/${locale}/events/${id}`);
  return { success: true };
}

export async function togglePublish(id: string, locale: string) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  // Get current state
  const { data: event } = await supabase
    .from("events")
    .select("is_published, title_en")
    .eq("id", id)
    .single();

  if (!event) return { error: "Event not found" };

  const { error } = await supabase
    .from("events")
    .update({ is_published: !event.is_published })
    .eq("id", id);

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: event.is_published ? "unpublish_event" : "publish_event",
    entity_type: "events",
    entity_id: id,
    details: { title: event.title_en },
  });

  revalidatePath(`/${locale}/events`);
  revalidatePath(`/${locale}/events/${id}`);
  return { success: true };
}

export async function deleteEvent(id: string, locale: string) {
  const user = await requireRole("admin");
  const supabase = await createServerClient();

  const { data: event } = await supabase
    .from("events")
    .select("title_en")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("events").delete().eq("id", id);

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "delete_event",
    entity_type: "events",
    entity_id: id,
    details: { title: event?.title_en },
  });

  revalidatePath(`/${locale}/events`);
  redirect(`/${locale}/events`);
}
