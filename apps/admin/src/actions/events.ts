"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { slugify, uniqueSlug } from "@/lib/slugify";
import { pingBoth } from "@/lib/revalidate";
import {
  EVENT_BRANCH_VALUES,
  STRIPE_PAYMENT_METHOD_TYPE_VALUES,
  type EventBranch,
  type StripePaymentMethodType,
} from "@dbc/types";

// Read the (branch, external_url) pair from FormData and validate the
// coherence rule that the DB check constraint enforces: dbc_germany events
// have no external URL; "other" events must have an http(s) URL. Returns
// the patch fragment or an Error to short-circuit the mutation.
function readEventBranch(
  fd: FormData
): { event_branch: EventBranch; external_url: string | null } | { error: string } {
  const rawBranch = ((fd.get("event_branch") as string) || "dbc_germany").trim();
  const branch = (EVENT_BRANCH_VALUES as readonly string[]).includes(rawBranch)
    ? (rawBranch as EventBranch)
    : "dbc_germany";

  if (branch === "dbc_germany") {
    return { event_branch: "dbc_germany", external_url: null };
  }

  const url = ((fd.get("external_url") as string) || "").trim();
  if (!url) {
    return { error: "External URL is required for other-branch events." };
  }
  if (!/^https?:\/\/\S+$/.test(url)) {
    return {
      error: "External URL must start with http:// or https://.",
    };
  }
  return { event_branch: "other", external_url: url };
}

// Keep only Stripe-canonical values the SSOT allows. Anything else (a
// stale 'sepa' instead of 'sepa_debit', a typo, a manually crafted FormData
// blob) is dropped silently — Stripe would reject the session otherwise,
// so we'd rather surface an empty list (= account defaults) than crash
// checkout for every customer.
function readPaymentMethods(fd: FormData): StripePaymentMethodType[] {
  const raw = fd.getAll("enabled_payment_methods").map(String);
  const allowed = new Set<string>(STRIPE_PAYMENT_METHOD_TYPE_VALUES);
  return raw.filter((v): v is StripePaymentMethodType => allowed.has(v));
}

const COVER_BUCKET = "event-covers";

function eventPublicPaths(slug?: string | null) {
  // Site: the events listing + homepage upcoming strip.
  // Tickets: the event detail + checkout pages when we know the slug.
  return {
    site: ["/[locale]", "/[locale]/events"],
    tickets: slug
      ? ["/[locale]/events", `/[locale]/events/${slug}`, `/[locale]/checkout/${slug}`]
      : ["/[locale]/events"],
  };
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ---------------------------------------------------------------------------
// Column selections (no SELECT *)
// `capacity` is intentionally omitted — total capacity is derived from
// SUM(ticket_tiers.max_quantity) per event. See getEventCapacities().
// ---------------------------------------------------------------------------
const EVENT_LIST_COLUMNS =
  "id, slug, title_en, title_de, title_fr, event_type, event_branch, external_url, starts_at, ends_at, is_published, cover_image_url, city" as const;

const EVENT_DETAIL_COLUMNS =
  "id, slug, title_en, title_de, title_fr, description_en, description_de, description_fr, event_type, event_branch, external_url, venue_name, venue_address, city, country, timezone, starts_at, ends_at, max_tickets_per_order, enabled_payment_methods, cover_image_url, is_published, feedback_survey_url, sales_target_tickets, sales_target_revenue_cents, created_at, updated_at, team_invite_quota, team_invite_tier_id, team_invite_discount_type, team_invite_discount_value, team_invite_applicable_tier_ids, chapter_delegate_tier_id, chapter_companion_tier_id, chapter_companion_value_tier_id, team_member_tier_id, chapter_delegate_program_enabled, catering_enabled, catering_eligible_roles, delegate_review_notify_email, door_sale_enabled, coupons_enabled, waitlist_enabled, ticket_transfer_enabled, ticket_transfer_cutoff_hours, refund_policy_days, refund_policy_text_de, refund_policy_text_en, refund_policy_text_fr, requires_photo_consent, photo_consent_text_de, photo_consent_text_en, photo_consent_text_fr, aftercare_emails_enabled, check_in_opens_minutes_before, check_in_closes_minutes_after, max_total_tickets, ticket_pdf_hero_url, funnel_brand_accent_hex" as const;

// ---------------------------------------------------------------------------
// Capacity helpers (derived from sum of tier max_quantity per event)
// ---------------------------------------------------------------------------

/**
 * Compute capacity for one or more events as the sum of ticket_tiers.max_quantity.
 * Tiers with NULL max_quantity (= unlimited) are excluded from the sum.
 * Returns a Map keyed by event_id; events without tiers map to 0.
 */
export async function getEventCapacities(
  eventIds: string[]
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (eventIds.length === 0) return out;
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("ticket_tiers")
    .select("event_id, max_quantity")
    .in("event_id", eventIds)
    .not("max_quantity", "is", null);
  for (const row of data ?? []) {
    out.set(row.event_id, (out.get(row.event_id) ?? 0) + (row.max_quantity ?? 0));
  }
  for (const id of eventIds) if (!out.has(id)) out.set(id, 0);
  return out;
}

export async function getEventCapacity(eventId: string): Promise<number> {
  const map = await getEventCapacities([eventId]);
  return map.get(eventId) ?? 0;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getEvents() {
  await requireRole("team_member");
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("events")
    .select(EVENT_LIST_COLUMNS)
    .order("starts_at", { ascending: false });

  if (error) throw new Error(error.message);
  const rows = data ?? [];
  const capacities = await getEventCapacities(rows.map((r) => r.id));
  return rows.map((r) => ({ ...r, capacity: capacities.get(r.id) ?? 0 }));
}

export async function getEvent(id: string) {
  await requireRole("team_member");
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("events")
    .select(EVENT_DETAIL_COLUMNS)
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return { ...data, capacity: await getEventCapacity(id) };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createEvent(formData: FormData) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const locale = formData.get("locale") as string;

  const branchPatch = readEventBranch(formData);
  if ("error" in branchPatch) return { error: branchPatch.error };
  const isExternal = branchPatch.event_branch === "other";

  const titleEn = (formData.get("title_en") as string).trim();
  const manualSlug = ((formData.get("slug") as string) ?? "").trim();
  const base = manualSlug || slugify(titleEn, "event");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const slug = await uniqueSlug(supabase as any, "events", base);

  const eventData = {
    slug,
    title_en: titleEn,
    title_de: (formData.get("title_de") as string) || titleEn,
    title_fr: (formData.get("title_fr") as string) || titleEn,
    description_en: formData.get("description_en") as string,
    description_de: formData.get("description_de") as string,
    description_fr: formData.get("description_fr") as string,
    event_type: (formData.get("event_type") as string) || "conference",
    event_branch: branchPatch.event_branch,
    external_url: branchPatch.external_url,
    venue_name: formData.get("venue_name") as string,
    venue_address: formData.get("venue_address") as string,
    city: formData.get("city") as string,
    timezone: (formData.get("timezone") as string) || "Europe/Berlin",
    starts_at: formData.get("starts_at") as string,
    ends_at: formData.get("ends_at") as string,
    max_tickets_per_order: parseInt(
      (formData.get("max_tickets_per_order") as string) || "10",
      10
    ),
    // External events don't sell tickets through us — skip payment methods.
    enabled_payment_methods: isExternal ? [] : readPaymentMethods(formData),
    cover_image_url:
      ((formData.get("cover_image_url") as string) || "").trim() || null,
    is_published: false,
  };

  const { data, error } = await supabase
    .from("events")
    .insert(eventData)
    .select("id, slug")
    .single();

  if (error) return { error: error.message };

  // Auto-populate checklist from template (DBC Germany events only — for
  // external branches we don't run the event)
  if (!isExternal) try {
    const { data: templates } = await supabase
      .from("event_checklist_templates")
      .select("title, category, description, default_offset_days, estimated_cost_cents, sort_order")
      .eq("is_active", true)
      .order("sort_order");

    if (templates && templates.length > 0) {
      const startsAt = new Date(eventData.starts_at);
      const checklistItems = templates.map((t) => {
        const dueDate = new Date(startsAt);
        dueDate.setDate(dueDate.getDate() + t.default_offset_days);
        return {
          event_id: data.id,
          title: t.title,
          category: t.category,
          description: t.description,
          due_date: dueDate.toISOString().slice(0, 10),
          estimated_cost_cents: t.estimated_cost_cents,
          sort_order: t.sort_order,
          status: "pending",
        };
      });
      await supabase.from("event_checklist_items").insert(checklistItems);
    }
  } catch (err) {
    console.error("[createEvent] checklist auto-populate failed:", err);
  }

  // Auto-populate run sheet from template (skip for external events)
  if (!isExternal) try {
    const { data: rsTemplates } = await supabase
      .from("event_runsheet_templates")
      .select("title, description, responsible_role, default_offset_minutes, default_duration_minutes, location_note, sort_order")
      .eq("is_active", true)
      .order("sort_order");

    if (rsTemplates && rsTemplates.length > 0) {
      const baseMs = new Date(eventData.starts_at).getTime();
      const runsheetItems = rsTemplates.map((t) => {
        const starts = new Date(baseMs + t.default_offset_minutes * 60_000);
        const ends = t.default_duration_minutes
          ? new Date(starts.getTime() + t.default_duration_minutes * 60_000)
          : null;
        return {
          event_id: data.id,
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
      await supabase.from("event_runsheet_items").insert(runsheetItems);
    }
  } catch (err) {
    console.error("[createEvent] runsheet auto-populate failed:", err);
  }

  // Audit log
  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "create_event",
    entity_type: "events",
    entity_id: data.id,
    details: { title: titleEn },
  });

  revalidatePath(`/${locale}/events`);
  const p = eventPublicPaths(data.slug);
  await pingBoth(p.site, p.tickets);
  redirect(`/${locale}/events/${data.id}`);
}

export async function updateEvent(id: string, formData: FormData) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const locale = formData.get("locale") as string;

  // Optimistic locking: check updated_at hasn't changed
  const expectedUpdatedAt = formData.get("updated_at") as string;

  const branchPatch = readEventBranch(formData);
  if ("error" in branchPatch) return { error: branchPatch.error };
  const isExternal = branchPatch.event_branch === "other";

  const eventData: Record<string, unknown> = {
    title_en: formData.get("title_en") as string,
    title_de: formData.get("title_de") as string,
    title_fr: formData.get("title_fr") as string,
    description_en: formData.get("description_en") as string,
    description_de: formData.get("description_de") as string,
    description_fr: formData.get("description_fr") as string,
    event_type: (formData.get("event_type") as string) || "conference",
    event_branch: branchPatch.event_branch,
    external_url: branchPatch.external_url,
    venue_name: formData.get("venue_name") as string,
    venue_address: formData.get("venue_address") as string,
    city: formData.get("city") as string,
    timezone: formData.get("timezone") as string,
    starts_at: formData.get("starts_at") as string,
    ends_at: formData.get("ends_at") as string,
    max_tickets_per_order: parseInt(
      formData.get("max_tickets_per_order") as string,
      10
    ),
    enabled_payment_methods: isExternal ? [] : readPaymentMethods(formData),
    cover_image_url:
      ((formData.get("cover_image_url") as string) || "").trim() || null,
    feedback_survey_url:
      ((formData.get("feedback_survey_url") as string) || "").trim() || null,
    sales_target_tickets: formData.get("sales_target_tickets")
      ? parseInt(formData.get("sales_target_tickets") as string, 10)
      : null,
    sales_target_revenue_cents: formData.get("sales_target_revenue_eur")
      ? Math.round(
          parseFloat(formData.get("sales_target_revenue_eur") as string) * 100
        )
      : null,
    // Guest programs + per-event flexibility knobs (admin-owned dial)
    team_invite_quota: formData.get("team_invite_quota")
      ? Math.max(0, parseInt(formData.get("team_invite_quota") as string, 10))
      : 3,
    team_invite_tier_id:
      ((formData.get("team_invite_tier_id") as string) || "").trim() || null,
    chapter_delegate_tier_id:
      ((formData.get("chapter_delegate_tier_id") as string) || "").trim() ||
      null,
    chapter_companion_tier_id:
      ((formData.get("chapter_companion_tier_id") as string) || "").trim() ||
      null,
    chapter_companion_value_tier_id:
      ((formData.get("chapter_companion_value_tier_id") as string) || "").trim() ||
      null,
    team_member_tier_id:
      ((formData.get("team_member_tier_id") as string) || "").trim() || null,
    chapter_delegate_program_enabled:
      formData.get("chapter_delegate_program_enabled") === "true",
    catering_enabled: formData.get("catering_enabled") === "true",
    catering_eligible_roles: formData.getAll("catering_eligible_roles") as string[],
    delegate_review_notify_email:
      ((formData.get("delegate_review_notify_email") as string) || "").trim() ||
      null,
    door_sale_enabled: formData.get("door_sale_enabled") === "true",
    coupons_enabled: formData.get("coupons_enabled") === "true",
    waitlist_enabled: formData.get("waitlist_enabled") === "true",
    ticket_transfer_enabled: formData.get("ticket_transfer_enabled") === "true",
    ticket_transfer_cutoff_hours: formData.get("ticket_transfer_cutoff_hours")
      ? parseInt(formData.get("ticket_transfer_cutoff_hours") as string, 10)
      : 24,
    refund_policy_days: formData.get("refund_policy_days")
      ? parseInt(formData.get("refund_policy_days") as string, 10)
      : 14,
    refund_policy_text_de:
      ((formData.get("refund_policy_text_de") as string) || "").trim() || null,
    refund_policy_text_en:
      ((formData.get("refund_policy_text_en") as string) || "").trim() || null,
    refund_policy_text_fr:
      ((formData.get("refund_policy_text_fr") as string) || "").trim() || null,
    requires_photo_consent:
      formData.get("requires_photo_consent") === "true",
    photo_consent_text_de:
      ((formData.get("photo_consent_text_de") as string) || "").trim() || null,
    photo_consent_text_en:
      ((formData.get("photo_consent_text_en") as string) || "").trim() || null,
    photo_consent_text_fr:
      ((formData.get("photo_consent_text_fr") as string) || "").trim() || null,
    aftercare_emails_enabled:
      formData.get("aftercare_emails_enabled") === "true",
    check_in_opens_minutes_before: formData.get("check_in_opens_minutes_before")
      ? parseInt(
          formData.get("check_in_opens_minutes_before") as string,
          10
        )
      : 60,
    check_in_closes_minutes_after: formData.get("check_in_closes_minutes_after")
      ? parseInt(
          formData.get("check_in_closes_minutes_after") as string,
          10
        )
      : 180,
    max_total_tickets: formData.get("max_total_tickets")
      ? parseInt(formData.get("max_total_tickets") as string, 10)
      : null,
    ticket_pdf_hero_url:
      ((formData.get("ticket_pdf_hero_url") as string) || "").trim() || null,
    funnel_brand_accent_hex:
      ((formData.get("funnel_brand_accent_hex") as string) || "").trim() ||
      null,
  };

  // For external-branch events we never run ticketing, so zero out every
  // program / sales / inventory / refund-policy flag. Cover, title, dates,
  // city stay as the user entered them on the card.
  if (isExternal) {
    Object.assign(eventData, {
      enabled_payment_methods: [],
      max_tickets_per_order: 0,
      sales_target_tickets: null,
      sales_target_revenue_cents: null,
      team_invite_quota: 0,
      team_invite_tier_id: null,
      chapter_delegate_tier_id: null,
      chapter_companion_tier_id: null,
      chapter_companion_value_tier_id: null,
      team_member_tier_id: null,
      chapter_delegate_program_enabled: false,
      catering_enabled: false,
      catering_eligible_roles: [],
      delegate_review_notify_email: null,
      door_sale_enabled: false,
      coupons_enabled: false,
      waitlist_enabled: false,
      ticket_transfer_enabled: false,
      requires_photo_consent: false,
      aftercare_emails_enabled: false,
      max_total_tickets: null,
    });
  }

  // Optional: admin can rename the slug. If provided, sanitise + ensure uniqueness.
  const rawSlug = ((formData.get("slug") as string) ?? "").trim();
  if (rawSlug) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    eventData.slug = await uniqueSlug(supabase as any, "events", slugify(rawSlug, "event"), id);
  }

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
  const { data: row } = await supabase
    .from("events")
    .select("slug")
    .eq("id", id)
    .single();
  const p = eventPublicPaths(row?.slug);
  await pingBoth(p.site, p.tickets);
  // Chapter-delegate register page reads chapter_companion_value_tier_id +
  // catering_eligible_roles from this row — bust ISR in all 3 locales so the
  // public notice + access logic reflect the admin save immediately.
  if (row?.slug) {
    for (const loc of ["en", "de", "fr"] as const) {
      revalidatePath(`/${loc}/chapter-delegate/${row.slug}/register`);
    }
  }
  return { success: true };
}

export async function togglePublish(id: string, locale: string) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  // Get current state
  const { data: event } = await supabase
    .from("events")
    .select("is_published, title_en, slug")
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
  const p = eventPublicPaths(event.slug);
  await pingBoth(p.site, p.tickets);
  return { success: true };
}

export async function deleteEvent(id: string, locale: string) {
  const user = await requireRole("admin");
  const supabase = await createServerClient();

  const { data: event } = await supabase
    .from("events")
    .select("title_en, slug")
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
  const p = eventPublicPaths(event?.slug);
  await pingBoth(p.site, p.tickets);
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
      "title_en, title_de, title_fr, description_en, description_de, description_fr, event_type, venue_name, venue_address, city, country, timezone, starts_at, ends_at, max_tickets_per_order, enabled_payment_methods, cover_image_url"
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const slug = await uniqueSlug(supabase as any, "events", slugify(titleEn, "event"));

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
      "slug, name_en, name_de, name_fr, description_en, description_de, description_fr, price_cents, currency, max_quantity, sales_start_at, sales_end_at, is_public, sort_order"
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
  if (file.size > 50 * 1024 * 1024) {
    return { error: "File is larger than 50 MB" };
  }
  if (!file.type.startsWith("image/")) {
    return { error: "Only image files are allowed" };
  }

  const { toWebp } = await import("@/lib/webp");
  const { buffer, contentType, extension } = await toWebp(file);
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;

  const service = getServiceClient();
  const { error: uploadError } = await service.storage
    .from(COVER_BUCKET)
    .upload(path, buffer, {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    return { error: `Upload failed: ${uploadError.message}` };
  }

  const { data } = service.storage.from(COVER_BUCKET).getPublicUrl(path);
  return { success: true as const, url: data.publicUrl };
}

/**
 * Issues a signed Supabase Storage upload URL for a hero video so the
 * browser can upload the file straight to storage, bypassing the Vercel
 * 4.5 MB serverless-function payload cap. Validates auth + content-type
 * server-side; the file size is enforced by the bucket itself (100 MB).
 *
 * Client flow (uploadToSignedUrl):
 *   1. Call this action with eventId + file metadata
 *   2. Use @supabase/supabase-js .uploadToSignedUrl(path, token, file)
 *   3. On success, write the returned publicUrl into the form
 */
const ALLOWED_HERO_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);
const HERO_VIDEO_MAX_BYTES = 100 * 1024 * 1024;

export async function getEventHeroVideoUploadUrl(input: {
  eventId: string;
  contentType: string;
  sizeBytes: number;
}) {
  await requireRole("manager");

  const { eventId, contentType, sizeBytes } = input;
  if (!eventId || !/^[0-9a-fA-F-]{32,40}$/.test(eventId)) {
    return { error: "Missing or invalid event_id" };
  }
  if (!ALLOWED_HERO_VIDEO_TYPES.has(contentType)) {
    return { error: "Only MP4, WebM or QuickTime videos are allowed" };
  }
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0 || sizeBytes > HERO_VIDEO_MAX_BYTES) {
    return { error: "Video must be between 0 and 100 MB" };
  }

  const ext =
    contentType === "video/mp4"
      ? "mp4"
      : contentType === "video/webm"
        ? "webm"
        : "mov";
  const path = `${eventId}/hero-video/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

  const service = getServiceClient();
  const { data, error } = await service.storage
    .from(COVER_BUCKET)
    .createSignedUploadUrl(path);
  if (error || !data) {
    return { error: `Could not create upload URL: ${error?.message ?? "unknown"}` };
  }

  const { data: pub } = service.storage.from(COVER_BUCKET).getPublicUrl(path);

  return {
    success: true as const,
    path,
    token: data.token,
    publicUrl: pub.publicUrl,
  };
}

/**
 * Uploads a PNG hero overlay (transparency preserved — never WebP-converted)
 * to event-covers/{eventId}/hero-overlay/. Returned URL is written into
 * events.hero_overlay_image_url.
 */
export async function uploadEventHeroOverlay(formData: FormData) {
  await requireRole("manager");
  const file = formData.get("file") as File | null;
  const eventId = (formData.get("event_id") as string | null) ?? null;
  if (!file || typeof file === "string") {
    return { error: "No file provided" };
  }
  if (!eventId || !/^[0-9a-fA-F-]{32,40}$/.test(eventId)) {
    return { error: "Missing or invalid event_id" };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { error: "PNG is larger than 5 MB" };
  }
  if (file.type !== "image/png") {
    return { error: "Only PNG images are allowed (transparency required)" };
  }

  const path = `${eventId}/hero-overlay/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.png`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const service = getServiceClient();
  const { error: uploadError } = await service.storage
    .from(COVER_BUCKET)
    .upload(path, buffer, { contentType: "image/png", upsert: false });
  if (uploadError) {
    return { error: `Upload failed: ${uploadError.message}` };
  }
  const { data } = service.storage.from(COVER_BUCKET).getPublicUrl(path);
  return { success: true as const, url: data.publicUrl };
}
