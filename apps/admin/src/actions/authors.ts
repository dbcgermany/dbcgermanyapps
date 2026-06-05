"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { slugify, uniqueSlug } from "@/lib/slugify";
import { pingRevalidate } from "@/lib/revalidate";

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

// Typeahead source for the news editor's author picker.
export async function searchAuthors(query: string) {
  await requireRole("manager");
  const supabase = await createServerClient();
  let q = supabase
    .from("authors")
    .select("id, display_name, type, photo_url, slug")
    .order("sort_order", { ascending: true })
    .limit(20);
  const term = query.trim();
  if (term) q = q.ilike("display_name", `%${term}%`);
  const { data } = await q;
  return data ?? [];
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
