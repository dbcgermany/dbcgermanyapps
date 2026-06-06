"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { STAFF_ROLES } from "@dbc/types";
import { slugify, uniqueSlug } from "@/lib/slugify";
import { pingRevalidate } from "@/lib/revalidate";
import type { AuthorSearchResult } from "@/lib/post-authors-sync";

// Module-local (a non-async export in a "use server" file breaks the build).
const AUTHOR_COLUMNS =
  "id, slug, display_name, type, role_title_en, role_title_de, role_title_fr, bio_en, bio_de, bio_fr, photo_url, email, linkedin_url, website_url, instagram_url, contact_id, team_member_id, is_org_default, is_public, sort_order";

const authorPaths = (slug?: string) =>
  slug ? ["/[locale]/news", `/[locale]/news/author/${slug}`] : ["/[locale]/news"];

export async function getAuthors() {
  await requireRole("manager");
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("authors")
    .select(AUTHOR_COLUMNS)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

// Typeahead source for the news editor's author picker. Unifies four SSOT
// sources — existing authors, team members, speakers, and admin profiles —
// into one de-duplicated person list. A person already backed by an `authors`
// row (or represented as a team member) is shown once, so the operator never
// picks the same human twice. The hard no-duplicate guarantee lives in
// resolvePickedAuthors (find-or-create keyed on the canonical FK).
export async function searchAuthors(query: string): Promise<AuthorSearchResult[]> {
  await requireRole("manager");
  const supabase = await createServerClient();
  const term = query.trim().toLowerCase();
  const match = (s: string | null | undefined) =>
    !term || (s ?? "").toLowerCase().includes(term);

  // Reference sets are small (tens of rows) — pull them whole so de-dup is
  // correct regardless of which rows match the term.
  const [authorsRes, teamRes, speakersRes, profilesRes] = await Promise.all([
    supabase
      .from("authors")
      .select(
        "id, display_name, type, photo_url, role_title_en, team_member_id, speaker_id, profile_id"
      )
      .order("sort_order", { ascending: true }),
    supabase
      .from("team_members")
      .select("id, name, role_en, photo_url, profile_id")
      .order("sort_order", { ascending: true }),
    supabase
      .from("speakers")
      .select("id, first_name, last_name, title_en, photo_url, team_member_id"),
    supabase
      .from("profiles")
      .select("id, display_name, first_name, last_name, avatar_url, role")
      .in("role", STAFF_ROLES),
  ]);

  const authors = authorsRes.data ?? [];
  const team = teamRes.data ?? [];
  const speakers = speakersRes.data ?? [];
  const profiles = profilesRes.data ?? [];

  // People already backed by an author row — don't list them again as a raw
  // person entity.
  const backedTeam = new Set(authors.map((a) => a.team_member_id).filter(Boolean));
  const backedSpeaker = new Set(authors.map((a) => a.speaker_id).filter(Boolean));
  const backedProfile = new Set(authors.map((a) => a.profile_id).filter(Boolean));
  // profile -> team member, so an admin who is on the team collapses to the
  // team entry (one canonical person).
  const profileTeam = new Map<string, string>();
  for (const t of team) if (t.profile_id) profileTeam.set(t.profile_id, t.id);

  const results: AuthorSearchResult[] = [];
  const representedTeam = new Set<string>();

  // 1) Existing authors (incl. DBC Germany + any already-linked person).
  for (const a of authors) {
    if (!match(a.display_name)) continue;
    results.push({
      kind: "author",
      id: a.id,
      display_name: a.display_name,
      detail: a.role_title_en ?? null,
      photo_url: a.photo_url,
    });
    if (a.team_member_id) representedTeam.add(a.team_member_id);
  }

  // 2) Team members not already backed by an author.
  for (const t of team) {
    if (backedTeam.has(t.id) || representedTeam.has(t.id)) continue;
    if (!match(t.name)) continue;
    results.push({
      kind: "team_member",
      id: t.id,
      display_name: t.name,
      detail: t.role_en ?? null,
      photo_url: t.photo_url,
    });
    representedTeam.add(t.id);
  }

  // 3) Speakers, unless they're a team member already represented, or backed.
  for (const s of speakers) {
    if (backedSpeaker.has(s.id)) continue;
    if (s.team_member_id && representedTeam.has(s.team_member_id)) continue;
    const name = [s.first_name, s.last_name].filter(Boolean).join(" ");
    if (!match(name)) continue;
    results.push({
      kind: "speaker",
      id: s.id,
      display_name: name,
      detail: s.title_en ?? null,
      photo_url: s.photo_url,
    });
  }

  // 4) Admin profiles, unless they map to an already-represented team member
  //    or are backed by an author.
  for (const p of profiles) {
    if (backedProfile.has(p.id)) continue;
    const linkedTeam = profileTeam.get(p.id);
    if (linkedTeam && representedTeam.has(linkedTeam)) continue;
    const name =
      p.display_name ||
      [p.first_name, p.last_name].filter(Boolean).join(" ") ||
      "";
    if (!name || !match(name)) continue;
    results.push({
      kind: "profile",
      id: p.id,
      display_name: name,
      detail: null,
      photo_url: p.avatar_url ?? null,
    });
  }

  return results.slice(0, 30);
}

function readAuthorForm(formData: FormData) {
  const displayName = (formData.get("display_name") as string).trim();
  const type = ((formData.get("type") as string) || "guest").trim();
  return {
    displayName,
    type,
    record: {
      display_name: displayName,
      type,
      role_title_en: (formData.get("role_title_en") as string)?.trim() || null,
      role_title_de: (formData.get("role_title_de") as string)?.trim() || null,
      role_title_fr: (formData.get("role_title_fr") as string)?.trim() || null,
      bio_en: (formData.get("bio_en") as string)?.trim() || null,
      bio_de: (formData.get("bio_de") as string)?.trim() || null,
      bio_fr: (formData.get("bio_fr") as string)?.trim() || null,
      photo_url: (formData.get("photo_url") as string)?.trim() || null,
      email: (formData.get("email") as string)?.trim() || null,
      linkedin_url: (formData.get("linkedin_url") as string)?.trim() || null,
      website_url: (formData.get("website_url") as string)?.trim() || null,
      instagram_url: (formData.get("instagram_url") as string)?.trim() || null,
      team_member_id: (formData.get("team_member_id") as string)?.trim() || null,
      is_public: formData.get("is_public") !== "off",
    },
  };
}

// Best-effort: add an external author to the CRM contact list and link it.
// Never blocks author creation.
async function linkContactForExternal(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  record: { email: string | null; type: string; display_name: string; role_title_en: string | null }
): Promise<string | null> {
  if (!record.email || record.type === "dbc_org" || record.type === "staff") return null;
  try {
    const { data: existing } = await supabase
      .from("contacts")
      .select("id")
      .eq("email", record.email)
      .maybeSingle();
    if (existing) return existing.id;
    const [first, ...rest] = record.display_name.split(" ");
    const { data: created } = await supabase
      .from("contacts")
      .insert({
        first_name: first || record.display_name,
        last_name: rest.join(" ") || null,
        email: record.email,
        occupation: record.role_title_en,
      })
      .select("id")
      .single();
    return created?.id ?? null;
  } catch {
    return null;
  }
}

export async function createAuthor(formData: FormData) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const { displayName, type, record } = readAuthorForm(formData);
  if (!displayName) return { error: "Display name is required." };

  const manualSlug = ((formData.get("slug") as string) ?? "").trim();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const slug = await uniqueSlug(supabase as any, "authors", manualSlug || slugify(displayName, "author"));
  const contactId = await linkContactForExternal(supabase, { ...record, type, display_name: displayName });

  const { error } = await supabase
    .from("authors")
    .insert({ ...record, slug, contact_id: contactId });
  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "create_author",
    entity_type: "authors",
    entity_id: slug,
    details: { name: displayName },
  });
  await pingRevalidate("site", authorPaths(slug));
  return { success: true };
}

export async function updateAuthor(id: string, formData: FormData) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const { displayName, record } = readAuthorForm(formData);
  if (!displayName) return { error: "Display name is required." };

  const patch: Record<string, unknown> = { ...record };
  const rawSlug = ((formData.get("slug") as string) ?? "").trim();
  const { data: before } = await supabase.from("authors").select("slug").eq("id", id).single();
  if (rawSlug) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    patch.slug = await uniqueSlug(supabase as any, "authors", slugify(rawSlug, "author"), id);
  }

  const { error } = await supabase.from("authors").update(patch).eq("id", id);
  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "update_author",
    entity_type: "authors",
    entity_id: id,
    details: { name: displayName },
  });
  const slugs = new Set(
    [before?.slug, (patch.slug as string) ?? before?.slug].filter(Boolean) as string[]
  );
  await pingRevalidate("site", [
    "/[locale]/news",
    ...[...slugs].map((s) => `/[locale]/news/author/${s}`),
  ]);
  return { success: true };
}

export async function deleteAuthor(id: string) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const { data: author } = await supabase
    .from("authors")
    .select("slug, display_name, is_org_default")
    .eq("id", id)
    .single();
  if (author?.is_org_default) {
    return { error: "The default DBC Germany author cannot be deleted." };
  }
  const { error } = await supabase.from("authors").delete().eq("id", id);
  if (error) return { error: error.message };
  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "delete_author",
    entity_type: "authors",
    entity_id: id,
    details: { name: author?.display_name },
  });
  await pingRevalidate("site", authorPaths(author?.slug));
  return { success: true };
}

export async function reorderAuthors(orderedIds: string[]) {
  await requireRole("manager");
  const supabase = await createServerClient();
  await Promise.all(
    orderedIds.map((id, i) =>
      supabase.from("authors").update({ sort_order: (i + 1) * 10 }).eq("id", id)
    )
  );
  await pingRevalidate("site", ["/[locale]/news"]);
  return { success: true };
}
