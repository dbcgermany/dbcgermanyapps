"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { slugify, uniqueSlug } from "@/lib/slugify";
import { pingRevalidate } from "@/lib/revalidate";

type Visibility = "public" | "internal" | "hidden";

export interface Speaker {
  id: string;
  slug: string;
  first_name: string;
  last_name: string;
  title_en: string | null;
  title_de: string | null;
  title_fr: string | null;
  company_en: string | null;
  company_de: string | null;
  company_fr: string | null;
  bio_en: string | null;
  bio_de: string | null;
  bio_fr: string | null;
  photo_url: string | null;
  email: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  website_url: string | null;
  team_member_id: string | null;
  visibility: Visibility;
  created_at: string;
  updated_at: string;
}

const SPEAKER_COLUMNS =
  "id, slug, first_name, last_name, title_en, title_de, title_fr, company_en, company_de, company_fr, bio_en, bio_de, bio_fr, photo_url, email, linkedin_url, twitter_url, website_url, team_member_id, visibility, created_at, updated_at" as const;

function ticketsPathsForEvent(eventSlug?: string | null) {
  const paths = ["/[locale]/events"];
  if (eventSlug) {
    paths.push(`/[locale]/events/${eventSlug}`);
    paths.push(`/[locale]/events/${eventSlug}/speakers`);
    paths.push(`/[locale]/events/${eventSlug}/speakers/[speakerSlug]`);
  }
  return paths;
}

// ---------------------------------------------------------------------------
// Global speakers CRUD
// ---------------------------------------------------------------------------

export async function getSpeakers(): Promise<Speaker[]> {
  await requireRole("manager");
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("speakers")
    .select(SPEAKER_COLUMNS)
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data as Speaker[]) ?? [];
}

export async function getSpeaker(id: string): Promise<Speaker> {
  await requireRole("manager");
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("speakers")
    .select(SPEAKER_COLUMNS)
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data as Speaker;
}

export async function getTeamMembersForLinking() {
  await requireRole("manager");
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("team_members")
    .select("id, name, slug")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as { id: string; name: string; slug: string }[];
}

function readSpeakerForm(formData: FormData) {
  const first = ((formData.get("first_name") as string) || "").trim();
  const last = ((formData.get("last_name") as string) || "").trim();
  const teamRaw = ((formData.get("team_member_id") as string) || "").trim();
  return {
    first_name: first,
    last_name: last,
    title_en: ((formData.get("title_en") as string) || "").trim() || null,
    title_de: ((formData.get("title_de") as string) || "").trim() || null,
    title_fr: ((formData.get("title_fr") as string) || "").trim() || null,
    company_en: ((formData.get("company_en") as string) || "").trim() || null,
    company_de: ((formData.get("company_de") as string) || "").trim() || null,
    company_fr: ((formData.get("company_fr") as string) || "").trim() || null,
    bio_en: ((formData.get("bio_en") as string) || "").trim() || null,
    bio_de: ((formData.get("bio_de") as string) || "").trim() || null,
    bio_fr: ((formData.get("bio_fr") as string) || "").trim() || null,
    photo_url: ((formData.get("photo_url") as string) || "").trim() || null,
    email: ((formData.get("email") as string) || "").trim() || null,
    linkedin_url:
      ((formData.get("linkedin_url") as string) || "").trim() || null,
    twitter_url: ((formData.get("twitter_url") as string) || "").trim() || null,
    website_url: ((formData.get("website_url") as string) || "").trim() || null,
    team_member_id: teamRaw || null,
    visibility: ((formData.get("visibility") as string) || "public") as Visibility,
    fullName: [first, last].filter(Boolean).join(" "),
  };
}

export async function createSpeaker(formData: FormData) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const locale = (formData.get("locale") as string) || "en";

  const fields = readSpeakerForm(formData);
  if (!fields.first_name || !fields.last_name) {
    return { error: "First and last name are required." };
  }

  const manualSlug = ((formData.get("slug") as string) ?? "").trim();
  const base = manualSlug || slugify(fields.fullName, "speaker");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const slug = await uniqueSlug(supabase as any, "speakers", base);

  const { data, error } = await supabase
    .from("speakers")
    .insert({ ...fields, slug, updated_by: user.userId })
    .select("id, slug")
    .single();
  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "create_speaker",
    entity_type: "speakers",
    entity_id: data.id,
    details: { name: fields.fullName, visibility: fields.visibility },
  });

  revalidatePath(`/${locale}/speakers`);
  redirect(`/${locale}/speakers/${data.id}`);
}

export async function updateSpeaker(id: string, formData: FormData) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const locale = (formData.get("locale") as string) || "en";

  const fields = readSpeakerForm(formData);
  if (!fields.first_name || !fields.last_name) {
    return { error: "First and last name are required." };
  }

  const record: Record<string, unknown> = { ...fields, updated_by: user.userId };
  delete record.fullName;

  const rawSlug = ((formData.get("slug") as string) ?? "").trim();
  if (rawSlug) {
    record.slug = await uniqueSlug(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase as any,
      "speakers",
      slugify(rawSlug, "speaker"),
      id,
    );
  }

  const { error } = await supabase.from("speakers").update(record).eq("id", id);
  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "update_speaker",
    entity_type: "speakers",
    entity_id: id,
    details: { name: fields.fullName },
  });

  revalidatePath(`/${locale}/speakers`);
  // Find every event this speaker is on and ping all of those public pages
  const { data: links } = await supabase
    .from("event_speakers")
    .select("event_id, events(slug)")
    .eq("speaker_id", id);
  const eventSlugs = (links ?? [])
    .map(
      (l) =>
        (l as unknown as { events: { slug: string } | null }).events?.slug ??
        null,
    )
    .filter((s): s is string => !!s);
  for (const slug of eventSlugs) {
    await pingRevalidate("tickets", ticketsPathsForEvent(slug));
  }
  return { success: true };
}

export async function deleteSpeaker(id: string, locale: string) {
  const user = await requireRole("admin");
  const supabase = await createServerClient();
  const { data: existing } = await supabase
    .from("speakers")
    .select("first_name, last_name")
    .eq("id", id)
    .single();
  const { error } = await supabase.from("speakers").delete().eq("id", id);
  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "delete_speaker",
    entity_type: "speakers",
    entity_id: id,
    details: {
      name: `${existing?.first_name ?? ""} ${existing?.last_name ?? ""}`.trim(),
    },
  });

  revalidatePath(`/${locale}/speakers`);
  redirect(`/${locale}/speakers`);
}

export async function uploadSpeakerPhoto(file: File, speakerId: string | null) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const { toWebp } = await import("@/lib/webp");
  const { buffer, contentType, extension } = await toWebp(file, {
    maxDim: 1200,
  });
  const folder = speakerId ?? `draft/${user.userId}`;
  const path = `${folder}/photo-${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("speaker-photos")
    .upload(path, buffer, { upsert: false, contentType });
  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("speaker-photos").getPublicUrl(path);

  if (speakerId) {
    const { error } = await supabase
      .from("speakers")
      .update({ photo_url: publicUrl, updated_by: user.userId })
      .eq("id", speakerId);
    if (error) return { error: error.message };
    revalidatePath("/[locale]/speakers", "layout");
  }

  return { success: true as const, url: publicUrl };
}

// ---------------------------------------------------------------------------
// Event ↔ speaker relation editor
// ---------------------------------------------------------------------------

export interface EventSpeakerRow {
  event_id: string;
  speaker_id: string;
  role_label_en: string | null;
  role_label_de: string | null;
  role_label_fr: string | null;
  is_featured: boolean;
  sort_order: number;
  speakers: {
    id: string;
    slug: string;
    first_name: string;
    last_name: string;
    photo_url: string | null;
    visibility: Visibility;
  };
}

export async function getEventSpeakersForAdmin(
  eventId: string,
): Promise<EventSpeakerRow[]> {
  await requireRole("manager");
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("event_speakers")
    .select(
      "event_id, speaker_id, role_label_en, role_label_de, role_label_fr, is_featured, sort_order, speakers(id, slug, first_name, last_name, photo_url, visibility)",
    )
    .eq("event_id", eventId)
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as EventSpeakerRow[];
}

async function getEventSlug(eventId: string): Promise<string | null> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("events")
    .select("slug")
    .eq("id", eventId)
    .single();
  return data?.slug ?? null;
}

export async function attachSpeakerToEvent(
  eventId: string,
  formData: FormData,
) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const locale = (formData.get("locale") as string) || "en";
  const speakerId = ((formData.get("speaker_id") as string) || "").trim();
  if (!speakerId) return { error: "Pick a speaker first." };

  const record = {
    event_id: eventId,
    speaker_id: speakerId,
    role_label_en:
      ((formData.get("role_label_en") as string) || "").trim() || null,
    role_label_de:
      ((formData.get("role_label_de") as string) || "").trim() || null,
    role_label_fr:
      ((formData.get("role_label_fr") as string) || "").trim() || null,
    is_featured: formData.get("is_featured") === "on",
    sort_order: parseInt(
      (formData.get("sort_order") as string) || "100",
      10,
    ),
  };

  const { error } = await supabase
    .from("event_speakers")
    .upsert(record, { onConflict: "event_id,speaker_id" });
  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "attach_speaker_to_event",
    entity_type: "event_speakers",
    entity_id: eventId,
    details: { speaker_id: speakerId },
  });

  const eventSlug = await getEventSlug(eventId);
  revalidatePath(`/${locale}/events/${eventId}/speakers`);
  await pingRevalidate("tickets", ticketsPathsForEvent(eventSlug));
  return { success: true };
}

export async function updateEventSpeaker(
  eventId: string,
  speakerId: string,
  formData: FormData,
) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const locale = (formData.get("locale") as string) || "en";
  const record = {
    role_label_en:
      ((formData.get("role_label_en") as string) || "").trim() || null,
    role_label_de:
      ((formData.get("role_label_de") as string) || "").trim() || null,
    role_label_fr:
      ((formData.get("role_label_fr") as string) || "").trim() || null,
    is_featured: formData.get("is_featured") === "on",
    sort_order: parseInt(
      (formData.get("sort_order") as string) || "100",
      10,
    ),
  };
  const { error } = await supabase
    .from("event_speakers")
    .update(record)
    .eq("event_id", eventId)
    .eq("speaker_id", speakerId);
  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "update_event_speaker",
    entity_type: "event_speakers",
    entity_id: eventId,
    details: { speaker_id: speakerId },
  });

  const eventSlug = await getEventSlug(eventId);
  revalidatePath(`/${locale}/events/${eventId}/speakers`);
  await pingRevalidate("tickets", ticketsPathsForEvent(eventSlug));
  return { success: true };
}

export async function detachSpeakerFromEvent(
  eventId: string,
  speakerId: string,
  locale: string,
) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const { error } = await supabase
    .from("event_speakers")
    .delete()
    .eq("event_id", eventId)
    .eq("speaker_id", speakerId);
  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "detach_speaker_from_event",
    entity_type: "event_speakers",
    entity_id: eventId,
    details: { speaker_id: speakerId },
  });

  const eventSlug = await getEventSlug(eventId);
  revalidatePath(`/${locale}/events/${eventId}/speakers`);
  await pingRevalidate("tickets", ticketsPathsForEvent(eventSlug));
  return { success: true };
}
