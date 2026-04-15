"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { createInvitation } from "./invitations";

export interface BulkInvitationRow {
  email: string;
  firstName: string;
  lastName: string;
  country: string | null;
  occupation: string | null;
  categoryTags: string[];
  tierSlug: string | null;
  locale: string | null;
  note: string | null;
}

export interface BulkParseResult {
  rows: BulkInvitationRow[];
  errors: Array<{ line: number; message: string }>;
}

/**
 * Split a single CSV line respecting double-quoted fields. No external dep —
 * handles the RFC-4180 subset we need (commas inside quotes, escaped quotes).
 */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else {
      if (ch === ",") {
        out.push(cur);
        cur = "";
      } else if (ch === '"' && cur.length === 0) {
        inQuotes = true;
      } else {
        cur += ch;
      }
    }
  }
  out.push(cur);
  return out;
}

export async function parseInvitationsCsv(
  text: string
): Promise<BulkParseResult> {
  await requireRole("manager");

  const lines = text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .filter((l) => l.length > 0);
  if (lines.length === 0) {
    return { rows: [], errors: [{ line: 0, message: "Empty file." }] };
  }

  const header = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const col = (name: string) => header.indexOf(name);
  const emailIdx = col("email");
  if (emailIdx === -1) {
    return {
      rows: [],
      errors: [{ line: 1, message: "Missing required column: email" }],
    };
  }

  const firstNameIdx = col("first_name");
  const lastNameIdx = col("last_name");
  const countryIdx = col("country");
  const occupationIdx = col("occupation");
  const categoryTagsIdx = col("category_tags");
  const tierSlugIdx = col("tier_slug");
  const localeIdx = col("locale");
  const noteIdx = col("note");

  const rows: BulkInvitationRow[] = [];
  const errors: Array<{ line: number; message: string }> = [];
  const seenEmails = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const lineNum = i + 1;
    const parts = splitCsvLine(lines[i]);
    const email = (parts[emailIdx] ?? "").trim().toLowerCase();
    if (!email) {
      errors.push({ line: lineNum, message: "email is empty" });
      continue;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({ line: lineNum, message: `invalid email: ${email}` });
      continue;
    }
    if (seenEmails.has(email)) {
      errors.push({ line: lineNum, message: `duplicate email in file: ${email}` });
      continue;
    }
    seenEmails.add(email);

    const country = (countryIdx >= 0 ? parts[countryIdx] : "").trim();
    const normalizedCountry =
      country.length === 0
        ? null
        : country.length === 2
          ? country.toUpperCase()
          : country.toUpperCase().slice(0, 2); // best-effort: users should give ISO-2

    const tags = (categoryTagsIdx >= 0 ? parts[categoryTagsIdx] : "")
      .split(/[;,]/)
      .map((t) => t.trim())
      .filter(Boolean);

    const locale = (localeIdx >= 0 ? parts[localeIdx] : "").trim().toLowerCase();
    const localeOk = locale === "en" || locale === "de" || locale === "fr";

    rows.push({
      email,
      firstName: (firstNameIdx >= 0 ? parts[firstNameIdx] : "").trim(),
      lastName: (lastNameIdx >= 0 ? parts[lastNameIdx] : "").trim(),
      country: normalizedCountry,
      occupation: (occupationIdx >= 0 ? parts[occupationIdx] : "").trim() || null,
      categoryTags: tags,
      tierSlug: (tierSlugIdx >= 0 ? parts[tierSlugIdx] : "").trim() || null,
      locale: localeOk ? locale : null,
      note: (noteIdx >= 0 ? parts[noteIdx] : "").trim() || null,
    });
  }

  return { rows, errors };
}

export interface BulkSendInput {
  eventId: string;
  defaultTierId: string;
  rows: BulkInvitationRow[];
  defaultLocale: string;
  sendEmails: boolean;
}

export interface BulkSendResult {
  success: number;
  failed: number;
  report: Array<{
    email: string;
    status: "sent" | "created" | "failed";
    error?: string;
  }>;
}

export async function bulkCreateInvitations(
  input: BulkSendInput
): Promise<BulkSendResult> {
  await requireRole("manager");
  const supabase = await createServerClient();

  // Resolve tier slugs → ids once
  const slugs = Array.from(
    new Set(input.rows.map((r) => r.tierSlug).filter(Boolean) as string[])
  );
  const slugToId = new Map<string, string>();
  if (slugs.length > 0) {
    const { data: tiersBySlug } = await supabase
      .from("ticket_tiers")
      .select("id, slug")
      .eq("event_id", input.eventId)
      .in("slug", slugs);
    for (const t of tiersBySlug ?? []) {
      if (t.slug) slugToId.set(t.slug, t.id);
    }
  }

  const report: BulkSendResult["report"] = [];
  let success = 0;
  let failed = 0;

  for (const row of input.rows) {
    const tierId =
      (row.tierSlug && slugToId.get(row.tierSlug)) || input.defaultTierId;

    const result = await createInvitation({
      eventId: input.eventId,
      tierId,
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      country: row.country,
      occupation: row.occupation,
      extraCategoryTags: row.categoryTags,
      note: row.note ?? undefined,
      locale: row.locale ?? input.defaultLocale,
      sendEmail: input.sendEmails,
    });

    if ("error" in result) {
      failed++;
      report.push({ email: row.email, status: "failed", error: result.error });
    } else {
      success++;
      report.push({
        email: row.email,
        status: input.sendEmails ? "sent" : "created",
      });
    }
  }

  return { success, failed, report };
}
