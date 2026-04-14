"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const COVER_BUCKET = "event-covers";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

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
    cover_image_url:
      ((formData.get("cover_image_url") as string) || "").trim() || null,
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
    cover_image_url:
      ((formData.get("cover_image_url") as string) || "").trim() || null,
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

/**
 * Clone an event plus its tiers, schedule items and email sequences into a
 * fresh draft. Skips media and coupons. Shifts every timestamp forward by
 * one year so recurring yearly events are one click away.
 */
export async function duplicateEvent(sourceId: string, locale: string) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const { data: source, error: srcErr } = await supabase
    .from("events")
    .select(
      "title_en, title_de, title_fr, description_en, description_de, description_fr, event_type, venue_name, venue_address, city, country, timezone, starts_at, ends_at, capacity, max_tickets_per_order, enabled_payment_methods, cover_image_url"
    )
    .eq("id", sourceId)
    .single();
  if (srcErr || !source) return { error: "Source event not found" };

  const shift = (iso: string) => {
    const d = new Date(iso);
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString();
  };

  const titleEn = `(Copy) ${source.title_en}`;
  const slug = slugify(titleEn) + "-" + Date.now().toString(36);

  const newEventData = {
    ...source,
    slug,
    title_en: titleEn,
    title_de: `(Kopie) ${source.title_de ?? source.title_en}`,
    title_fr: `(Copie) ${source.title_fr ?? source.title_en}`,
    starts_at: shift(source.starts_at),
    ends_at: shift(source.ends_at),
    is_published: false,
  };

  const { data: newEvent, error: insertErr } = await supabase
    .from("events")
    .insert(newEventData)
    .select("id")
    .single();
  if (insertErr || !newEvent) {
    return { error: insertErr?.message ?? "Failed to insert new event" };
  }

  // Tiers — reset quantity_sold to 0
  const { data: srcTiers } = await supabase
    .from("ticket_tiers")
    .select(
      "name_en, name_de, name_fr, description_en, description_de, description_fr, price_cents, currency, max_quantity, sales_start_at, sales_end_at, is_public, sort_order"
    )
    .eq("event_id", sourceId);
  if (srcTiers && srcTiers.length) {
    await supabase.from("ticket_tiers").insert(
      srcTiers.map((t) => ({
        ...t,
        event_id: newEvent.id,
        quantity_sold: 0,
        sales_start_at: t.sales_start_at ? shift(t.sales_start_at) : null,
        sales_end_at: t.sales_end_at ? shift(t.sales_end_at) : null,
      }))
    );
  }

  // Schedule
  const { data: srcSchedule } = await supabase
    .from("event_schedule_items")
    .select(
      "title_en, title_de, title_fr, description_en, description_de, description_fr, starts_at, ends_at, speaker_name, speaker_title, speaker_image_url, sort_order"
    )
    .eq("event_id", sourceId);
  if (srcSchedule && srcSchedule.length) {
    await supabase.from("event_schedule_items").insert(
      srcSchedule.map((s) => ({
        ...s,
        event_id: newEvent.id,
        starts_at: shift(s.starts_at),
        ends_at: shift(s.ends_at),
      }))
    );
  }

  // Email sequences (reset sent_at; keep delay_days so they fire after the new event)
  const { data: srcSequences } = await supabase
    .from("event_email_sequences")
    .select(
      "delay_days, subject_en, subject_de, subject_fr, body_en, body_de, body_fr, is_active, sort_order"
    )
    .eq("event_id", sourceId);
  if (srcSequences && srcSequences.length) {
    await supabase.from("event_email_sequences").insert(
      srcSequences.map((s) => ({
        ...s,
        event_id: newEvent.id,
        sent_at: null,
      }))
    );
  }

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "duplicate_event",
    entity_type: "events",
    entity_id: newEvent.id,
    details: { from: sourceId, slug },
  });

  revalidatePath(`/${locale}/events`);
  redirect(`/${locale}/events/${newEvent.id}/edit`);
}

/**
 * Uploads an event cover image to the `event-covers` public bucket and returns
 * the resulting public URL. Client components call this from a browser
 * file-input component; the returned URL is written into the event form's
 * `cover_image_url` field.
 */
export async function uploadEventCover(formData: FormData) {
  await requireRole("manager");
  const file = formData.get("file") as File | null;
  if (!file || typeof file === "string") {
    return { error: "No file provided" };
  }
  if (file.size > 8 * 1024 * 1024) {
    return { error: "File is larger than 8 MB" };
  }
  if (!file.type.startsWith("image/")) {
    return { error: "Only image files are allowed" };
  }

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

  const service = getServiceClient();
  const { error: uploadError } = await service.storage
    .from(COVER_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return { error: `Upload failed: ${uploadError.message}` };
  }

  const { data } = service.storage.from(COVER_BUCKET).getPublicUrl(path);
  return { success: true as const, url: data.publicUrl };
}
