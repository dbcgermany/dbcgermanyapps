"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { revalidatePath } from "next/cache";
import type { ProgramItem } from "@dbc/types";

// IMPORTANT (feedback_postgrest_column_drift): every column referenced
// below must exist on the matching Row type in
// packages/types/src/database.ts. PostgREST validates these strings only
// at runtime; a typo here = production 500 on the runsheet page. When
// modifying, prefer the typed `cols()` / `joinCols()` helpers from
// @dbc/supabase for new code (they error at compile time on column drift).
const ITEM_COLUMNS =
  "id, event_id, title, title_de, title_fr, description, description_de, description_fr, notes, starts_at, ends_at, responsible_person, location_note, status, sort_order, assigned_to, default_duration_minutes, is_public, speaker_id, team_member_id, contact_id, speaker_first_name, speaker_last_name, speaker_name, speaker_title, speaker_image_url, created_at, updated_at" as const;

const JOINS =
  "assignee:profiles!event_runsheet_items_assigned_to_fkey(display_name)," +
  "speaker:speakers!event_runsheet_items_speaker_id_fkey(id, slug, first_name, last_name, photo_url, title_en, title_de, title_fr)," +
  "team_member:team_members!event_runsheet_items_team_member_id_fkey(id, slug, name, photo_url, role_en, role_de, role_fr)," +
  "contact:contacts!event_runsheet_items_contact_id_fkey(id, first_name, last_name, email)";

function normaliseJoined<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function fanout(formData: FormData) {
  const title = ((formData.get("title") as string) || "").trim();
  const titleDe = ((formData.get("title_de") as string) || "").trim();
  const titleFr = ((formData.get("title_fr") as string) || "").trim();
  const description = ((formData.get("description") as string) || "").trim();
  const descriptionDe = ((formData.get("description_de") as string) || "").trim();
  const descriptionFr = ((formData.get("description_fr") as string) || "").trim();
  const notes = ((formData.get("notes") as string) || "").trim();
  const responsiblePerson =
    ((formData.get("responsible_person") as string) || "").trim();
  const locationNote = ((formData.get("location_note") as string) || "").trim();
  const assignedTo = ((formData.get("assigned_to") as string) || "").trim();
  const speakerId = ((formData.get("speaker_id") as string) || "").trim();
  const teamMemberId = ((formData.get("team_member_id") as string) || "").trim();
  const contactId = ((formData.get("contact_id") as string) || "").trim();
  return {
    title,
    title_de: titleDe || null,
    title_fr: titleFr || null,
    description: description || null,
    description_de: descriptionDe || null,
    description_fr: descriptionFr || null,
    notes: notes || null,
    responsible_person: responsiblePerson || null,
    location_note: locationNote || null,
    assigned_to: assignedTo || null,
    speaker_id: speakerId || null,
    team_member_id: teamMemberId || null,
    contact_id: contactId || null,
  };
}

function revalidate(eventId: string, locale: string) {
  revalidatePath(`/${locale}/events/${eventId}/runsheet`);
  revalidatePath(`/${locale}/events/${eventId}/schedule`);
}

export async function getRunsheetItems(
  eventId: string,
  opts: { publicOnly?: boolean } = {}
): Promise<ProgramItem[]> {
  await requireRole("team_member");
  const supabase = await createServerClient();

  let query = supabase
    .from("event_runsheet_items")
    .select(`${ITEM_COLUMNS}, ${JOINS}`)
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true })
    .order("starts_at", { ascending: true });

  if (opts.publicOnly) {
    query = query.eq("is_public", true);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map((r) => ({
    ...r,
    assignee: normaliseJoined(r.assignee),
    speaker: normaliseJoined(r.speaker),
    team_member: normaliseJoined(r.team_member),
    contact: normaliseJoined(r.contact),
  })) as ProgramItem[];
}

export async function createRunsheetItem(
  eventId: string,
  formData: FormData
) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const locale = (formData.get("locale") as string) || "en";

  const fields = fanout(formData);
  if (!fields.title) return { error: "Title is required." };

  const isPublic = formData.get("is_public") === "on" ||
    formData.get("is_public") === "true";

  const { data, error } = await supabase
    .from("event_runsheet_items")
    .insert({
      event_id: eventId,
      starts_at: (formData.get("starts_at") as string) || null,
      ends_at: (formData.get("ends_at") as string) || null,
      sort_order: parseInt(
        (formData.get("sort_order") as string) || "0",
        10
      ),
      is_public: isPublic,
      ...fields,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "create_runsheet_item",
    entity_type: "event_runsheet_items",
    entity_id: data.id,
    details: { title: fields.title, event_id: eventId, is_public: isPublic },
  });

  revalidate(eventId, locale);
  return { success: true };
}

export async function updateRunsheetItem(id: string, formData: FormData) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const locale = (formData.get("locale") as string) || "en";
  const eventId = (formData.get("event_id") as string) || "";

  const patch: Record<string, unknown> = {};

  // Strings (fan-out includes empty-string → null normalisation)
  const stringFields = [
    "title",
    "title_de",
    "title_fr",
    "description",
    "description_de",
    "description_fr",
    "notes",
    "responsible_person",
    "location_note",
    "starts_at",
    "ends_at",
    "assigned_to",
    "speaker_id",
    "team_member_id",
    "contact_id",
  ];
  for (const f of stringFields) {
    const raw = formData.get(f);
    if (raw !== null) {
      const val = typeof raw === "string" ? raw.trim() : "";
      patch[f] = val === "" ? null : val;
    }
  }

  if (formData.get("status") !== null) {
    patch.status = (formData.get("status") as string) || "pending";
  }

  if (formData.get("is_public") !== null) {
    const raw = formData.get("is_public") as string;
    patch.is_public = raw === "on" || raw === "true";
  }

  if (formData.get("sort_order") !== null) {
    const raw = formData.get("sort_order") as string;
    patch.sort_order = parseInt(raw, 10);
  }

  // Owner exclusivity: when one canonical owner FK is being set explicitly to
  // a non-empty value, clear the other two so we don't end up with multiple
  // canonical owners on a single row.
  const ownerFields = ["speaker_id", "team_member_id", "contact_id"] as const;
  const explicitNonEmpty = ownerFields.filter(
    (f) => patch[f] !== undefined && patch[f] !== null
  );
  if (explicitNonEmpty.length === 1) {
    const winner = explicitNonEmpty[0];
    for (const f of ownerFields) {
      if (f !== winner) patch[f] = null;
    }
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

  if (eventId) revalidate(eventId, locale);
  return { success: true };
}

/**
 * One-click toggle of `is_public`. Used by the inline pill on the runsheet
 * row — no form open, no submit. UI calls this with the new value already
 * decided optimistically. Returns the persisted boolean so the client can
 * reconcile if it diverges.
 */
export async function toggleRunsheetItemPublic(
  id: string,
  eventId: string,
  locale: string,
  nextValue: boolean
) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("event_runsheet_items")
    .update({ is_public: nextValue, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("is_public")
    .single();

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "toggle_runsheet_item_public",
    entity_type: "event_runsheet_items",
    entity_id: id,
    details: { event_id: eventId, is_public: nextValue },
  });

  revalidate(eventId, locale);
  return { success: true, is_public: data?.is_public ?? nextValue };
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

  revalidate(eventId, locale);
  return { success: true };
}

export async function reorderRunsheetItems(
  eventId: string,
  orderedIds: string[],
  locale: string
) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

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

  revalidate(eventId, locale);
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
      // Template rows are operational defaults — internal, never public.
      is_public: false,
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

  revalidate(eventId, locale);
  return { success: true };
}

/* -------------------------------------------------------------------------- */
/*                       Owner picker option fetchers                         */
/* -------------------------------------------------------------------------- */
// Used by the runsheet row's owner combobox. Each returns rows for that
// canonical-people table, with just the fields needed to render an option +
// write the FK back. Reused across the form and the inline-edit row so we
// don't have three near-identical fetchers floating around.

export async function getRunsheetSpeakerOptions(eventId: string) {
  await requireRole("manager");
  const supabase = await createServerClient();

  // Pull every speaker linked to this event PLUS every speaker the team has
  // ever stored — gives Ruth the full canonical list without forcing her to
  // pre-link a speaker to the event first.
  const { data: linked } = await supabase
    .from("event_speakers")
    .select("speaker_id")
    .eq("event_id", eventId);
  const { data: allSpeakers } = await supabase
    .from("speakers")
    .select(
      "id, slug, first_name, last_name, photo_url, title_en, title_de, title_fr"
    )
    .order("last_name", { ascending: true });

  const linkedIds = new Set(
    (linked ?? []).map((r) => r.speaker_id as string)
  );

  return (allSpeakers ?? []).map((s) => ({
    ...s,
    is_event_speaker: linkedIds.has(s.id),
  }));
}

export async function getRunsheetTeamMemberOptions() {
  await requireRole("manager");
  const supabase = await createServerClient();

  const { data } = await supabase
    .from("team_members")
    .select("id, slug, name, photo_url, role_en, role_de, role_fr")
    .neq("visibility", "hidden")
    .order("name", { ascending: true });

  return data ?? [];
}

export async function getRunsheetContactOptions() {
  await requireRole("manager");
  const supabase = await createServerClient();

  // Vendors / external service providers tagged via the service_providers
  // contact category. Same pattern as event_expenses.provider_contact_id.
  // Note: contacts has first_name/last_name, NOT full_name (canonical
  // column shape per packages/types/src/database.ts).
  const { data } = await supabase
    .from("contacts")
    .select(
      "id, first_name, last_name, email, contact_category_links!inner(contact_categories!inner(slug))"
    )
    .eq("contact_category_links.contact_categories.slug", "service_providers")
    .order("last_name", { ascending: true });

  return (data ?? []).map((c) => ({
    id: c.id,
    first_name: c.first_name,
    last_name: c.last_name,
    email: c.email,
  }));
}
