"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { formalSalutation } from "@dbc/email";
import { revalidatePath } from "next/cache";

/* -------------------------------------------------------------------------- */
/*                                  Types                                     */
/* -------------------------------------------------------------------------- */

export type OutreachLocale = "en" | "de" | "fr";

export interface OutreachTemplateSummary {
  slug: string;
  name: string;
  description: string | null;
  reply_to: string;
  updated_at: string;
  is_system: boolean;
}

export interface OutreachTemplateRow extends OutreachTemplateSummary {
  id: string;
  subject_en: string;
  subject_de: string;
  subject_fr: string;
  body_en: string;
  body_de: string;
  body_fr: string;
  is_system: boolean;
  sort_order: number;
}

export interface InterpolatedTemplate {
  slug: string;
  name: string;
  replyTo: string;
  subject: string;
  body: string;
  locale: OutreachLocale;
}

/* -------------------------------------------------------------------------- */
/*                                Read paths                                  */
/* -------------------------------------------------------------------------- */

/** Compact list for the compose-dialog picker + admin index. */
export async function listOutreachTemplates(): Promise<
  OutreachTemplateSummary[]
> {
  await requireRole("manager");
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("outreach_templates")
    .select("slug, name, description, reply_to, updated_at, is_system")
    .order("sort_order", { ascending: true });
  return (data ?? []) as OutreachTemplateSummary[];
}

/** Raw row (all locales) for the admin editor. */
export async function getOutreachTemplate(
  slug: string
): Promise<OutreachTemplateRow | null> {
  await requireRole("manager");
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("outreach_templates")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return (data as OutreachTemplateRow | null) ?? null;
}

/**
 * Compose-dialog entry point. Loads the template + contact + Richesses 2026
 * event + sender profile, interpolates every `{variable}`, returns the
 * subject + body ready for the operator to read, tweak and send.
 */
export async function getOutreachTemplateForContact(
  slug: string,
  contactId: string,
  locale: OutreachLocale
): Promise<InterpolatedTemplate | { error: string }> {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const [{ data: template }, { data: contact }, { data: event }, { data: profile }] =
    await Promise.all([
      supabase
        .from("outreach_templates")
        .select(
          "slug, name, reply_to, subject_en, subject_de, subject_fr, body_en, body_de, body_fr"
        )
        .eq("slug", slug)
        .maybeSingle(),
      supabase
        .from("contacts")
        .select(
          "id, first_name, last_name, organization, country, sector, tier, pitch_tier, gender, title"
        )
        .eq("id", contactId)
        .maybeSingle(),
      supabase
        .from("events")
        .select(
          "title_en, title_de, title_fr, starts_at, ends_at, city, venue_name, venue_address"
        )
        .eq("slug", "richesses-dafrique-germany-2026")
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("first_name, last_name, display_name, role")
        .eq("id", user.userId)
        .maybeSingle(),
    ]);

  // Sender display name + email — fall back through display_name → first+last
  // → "DBC Germany Team". Email comes from the auth user (profiles doesn't
  // duplicate auth.users.email). Without this fallback chain {senderName}
  // rendered as the literal fallback, leaving outreach signed by "DBC Germany
  // Team" instead of Jay / whoever sent it.
  const senderFullName =
    profile?.display_name?.trim() ||
    [profile?.first_name, profile?.last_name]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    "DBC Germany Team";
  const senderEmail = user.email ?? "";

  if (!template) return { error: "Template not found." };
  if (!contact) return { error: "Contact not found." };

  // Pick the right subject + body for the requested locale, with a graceful
  // fallback chain locale -> en -> first non-empty.
  const subjectKey = `subject_${locale}` as keyof typeof template;
  const bodyKey = `body_${locale}` as keyof typeof template;
  const rawSubject =
    (template[subjectKey] as string | null) ||
    (template.subject_en as string | null) ||
    "";
  const rawBody =
    (template[bodyKey] as string | null) ||
    (template.body_en as string | null) ||
    "";

  // Event title in the chosen locale (same fallback).
  const eventTitle = event
    ? (event[`title_${locale}` as keyof typeof event] as string | null) ||
      (event.title_en as string | null) ||
      ""
    : "";
  const eventDate = event?.starts_at
    ? new Date(event.starts_at).toLocaleDateString(locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";
  // Time block — "10:00 – 16:00 Uhr" (DE), "10:00 AM – 4:00 PM" (EN),
  // "10h00 – 16h00" (FR). Reads each clock part with toLocaleTimeString and
  // joins with an en-dash. DE gets the " Uhr" suffix; FR substitutes the
  // colon with an "h" per local convention.
  const eventTime = formatEventTime(
    event?.starts_at ?? null,
    event?.ends_at ?? null,
    locale
  );
  const eventCity = event?.city ?? "";
  const eventVenue = event?.venue_name ?? "";
  const eventAddress = event?.venue_address ?? "";
  // Formal salutation line — opens every executive outreach body so the
  // recipient is addressed by name + title where known, gracefully degrading
  // to first-name / generic when not. The helper omits trailing punctuation;
  // we append the comma so templates can keep "{salutation}" on its own line.
  const salutation =
    formalSalutation(
      locale,
      contact.gender as "male" | "female" | "diverse" | null | undefined,
      contact.title ?? null,
      contact.last_name ?? null,
      contact.first_name ?? ""
    ) + ",";
  // Deep-link to the public event page so the recipient can click straight
  // through to programme + tier overview. Locale-aware so the page renders
  // in the recipient's language.
  const ticketsBase =
    process.env.NEXT_PUBLIC_TICKETS_URL ?? "https://tickets.dbc-germany.com";
  const eventUrl = `${ticketsBase}/${locale}/events/richesses-dafrique-germany-2026`;

  const countryName = contact.country
    ? countryDisplayName(contact.country, locale)
    : "";

  const variables: Record<string, string> = {
    salutation,
    firstName: contact.first_name ?? "",
    lastName: contact.last_name ?? "",
    fullName: [contact.first_name, contact.last_name]
      .filter(Boolean)
      .join(" ")
      .trim(),
    organization: contact.organization ?? "",
    country: countryName,
    sector: contact.sector ?? "",
    tier: contact.tier ?? "",
    pitchTier: contact.pitch_tier ?? "",
    eventTitle,
    eventDate,
    eventTime,
    eventCity,
    eventVenue,
    eventAddress,
    eventUrl,
    senderName: senderFullName,
    senderEmail: senderEmail,
    senderRole: profile?.role ?? "",
    ticketsUrl:
      process.env.NEXT_PUBLIC_TICKETS_URL ?? "https://tickets.dbc-germany.com",
    sponsorDeckUrl:
      process.env.NEXT_PUBLIC_SPONSOR_DECK_URL ??
      "https://dbc-germany.com/sponsors",
    pressKitUrl:
      process.env.NEXT_PUBLIC_PRESS_KIT_URL ??
      "https://dbc-germany.com/press",
  };

  return {
    slug: template.slug,
    name: template.name,
    replyTo: template.reply_to,
    subject: interpolate(rawSubject, variables),
    body: interpolate(rawBody, variables),
    locale,
  };
}

/* -------------------------------------------------------------------------- */
/*                                Write path                                  */
/* -------------------------------------------------------------------------- */

export interface UpsertOutreachTemplateInput {
  slug: string;
  name: string;
  description?: string | null;
  reply_to: string;
  subject_en: string;
  subject_de: string;
  subject_fr: string;
  body_en: string;
  body_de: string;
  body_fr: string;
  sort_order?: number;
}

export async function upsertOutreachTemplate(
  input: UpsertOutreachTemplateInput
): Promise<{ success: true } | { error: string }> {
  const user = await requireRole("admin");
  const supabase = await createServerClient();

  const slug = input.slug.trim();
  if (!/^[a-z][a-z0-9_]*$/.test(slug)) {
    return {
      error: "Slug must be lowercase letters, numbers, or underscores.",
    };
  }
  const replyTo = input.reply_to.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyTo)) {
    return { error: "Reply-To must be a valid email address." };
  }
  if (!input.name.trim()) return { error: "Template name is required." };

  // Required content per locale — refuse a save that would land an empty
  // subject or body in any of the three.
  for (const locale of ["en", "de", "fr"] as const) {
    const subject = input[`subject_${locale}` as const]?.trim();
    const body = input[`body_${locale}` as const]?.trim();
    if (!subject) {
      return { error: `Subject (${locale.toUpperCase()}) is required.` };
    }
    if (!body) {
      return { error: `Body (${locale.toUpperCase()}) is required.` };
    }
  }

  const { error } = await supabase
    .from("outreach_templates")
    .upsert(
      {
        slug,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        reply_to: replyTo,
        subject_en: input.subject_en.trim(),
        subject_de: input.subject_de.trim(),
        subject_fr: input.subject_fr.trim(),
        body_en: input.body_en,
        body_de: input.body_de,
        body_fr: input.body_fr,
        sort_order: input.sort_order ?? 0,
        updated_by: user.userId,
      },
      { onConflict: "slug" }
    );
  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "upsert_outreach_template",
    entity_type: "outreach_templates",
    entity_id: slug,
    details: { name: input.name, reply_to: replyTo },
  });

  revalidatePath(`/[locale]/outreach/templates`, "layout");
  return { success: true };
}

/**
 * Delete a custom outreach template. Templates flagged `is_system = true`
 * are seeded by migrations and refuse to delete — removing them would just
 * cause confusion on the next deploy when the seed re-inserts them. Admin
 * can still edit their copy via the upsert path.
 */
export async function deleteOutreachTemplate(
  slug: string
): Promise<{ success: true } | { error: string }> {
  const user = await requireRole("admin");
  const supabase = await createServerClient();

  const { data: row } = await supabase
    .from("outreach_templates")
    .select("slug, name, is_system")
    .eq("slug", slug)
    .maybeSingle();
  if (!row) return { error: "Template not found." };
  if (row.is_system) {
    return {
      error:
        "This template is seeded by the system and can't be deleted. Edit its copy instead.",
    };
  }

  const { error } = await supabase
    .from("outreach_templates")
    .delete()
    .eq("slug", slug);
  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "delete_outreach_template",
    entity_type: "outreach_templates",
    entity_id: slug,
    details: { name: row.name },
  });

  revalidatePath(`/[locale]/outreach/templates`, "layout");
  return { success: true };
}

/* -------------------------------------------------------------------------- */
/*                              Helpers                                       */
/* -------------------------------------------------------------------------- */

function interpolate(
  template: string,
  variables: Record<string, string>
): string {
  // Replace every `{key}` with variables[key] (empty string if missing —
  // never let `{foo}` leak through to the recipient).
  const filled = template.replace(
    /\{(\w+)\}/g,
    (_, key: string) => variables[key] ?? ""
  );
  // Post-process so empty variables don't leave the body looking spammy:
  // "Your work at {organization} in {sector}" with both empty becomes
  // "Your work at  in " → we collapse the doubled space + tidy orphan
  // " at ," / " in ," / " in ." artifacts. Per-line so blank-line paragraph
  // separators stay intact.
  return filled
    .split("\n")
    .map((line) =>
      line
        // " at  in "  → " "    (two stranded prepositions in a row)
        .replace(/\s+(?:at|in|for|with|by|on)\s+(?=(?:at|in|for|with|by|on)\s)/gi, " ")
        // " at  ,"   → ","   (preposition then punctuation, value was empty)
        .replace(/\s+(?:at|in|for|with|by|on)\s+(?=[.,;:!?])/gi, "")
        // any " at  " with double-space after → " " (orphan preposition)
        .replace(/\s+(?:at|in|for|with|by|on)\s{2,}/gi, " ")
        // generic collapse of any double+ space to one
        .replace(/[ \t]{2,}/g, " ")
        .trimEnd()
    )
    .join("\n")
    .trim();
}

function countryDisplayName(isoAlpha2: string, locale: OutreachLocale): string {
  try {
    const dn = new Intl.DisplayNames([locale], { type: "region" });
    return dn.of(isoAlpha2.toUpperCase()) ?? isoAlpha2;
  } catch {
    return isoAlpha2;
  }
}

function formatEventTime(
  startsAt: string | null,
  endsAt: string | null,
  locale: OutreachLocale
): string {
  if (!startsAt || !endsAt) return "";
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "";
  const opts: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: locale === "en",
  };
  const startStr = start.toLocaleTimeString(locale, opts);
  const endStr = end.toLocaleTimeString(locale, opts);
  if (locale === "fr") {
    return `${startStr.replace(":", "h")} – ${endStr.replace(":", "h")}`;
  }
  if (locale === "de") {
    return `${startStr} – ${endStr} Uhr`;
  }
  return `${startStr} – ${endStr}`;
}
