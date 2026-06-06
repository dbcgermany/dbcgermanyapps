// SSOT helper to sync a post's authors (delete-then-insert) with role + order.
// Plain module (NOT "use server") so it takes the calling action's Supabase
// client. Reused by createNewsPost + updateNewsPost.

import { slugify, uniqueSlug } from "@/lib/slugify";

export type PostAuthorEntry = { id: string; role: string };

// The author picker can credit four kinds of source. Every credited person
// resolves to exactly one `authors` row (the canonical credit), so re-adding
// the same person never duplicates an author record.
export type AuthorPickKind = "author" | "team_member" | "speaker" | "profile";
export type PickedAuthor = {
  kind: AuthorPickKind;
  id: string;
  role: string;
  // The display name to stamp on a freshly-created thin author row.
  name?: string;
};

// One row in the author picker's typeahead. `kind` drives the localized
// source label in the UI; `detail` is an already-localized-enough specific
// (role title / company) shown after it. Defined here (a plain module) rather
// than in the "use server" actions file, which may only export async fns.
export type AuthorSearchResult = {
  kind: AuthorPickKind;
  id: string;
  display_name: string;
  detail: string | null;
  photo_url: string | null;
};

// Find (or lazily create) the single `authors` row that backs a person,
// keyed on the canonical FK so the partial-unique indexes guarantee no
// duplicates. Returns the author id, or null if creation failed.
async function findOrCreateAuthorForEntity(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  fk: { team_member_id?: string; speaker_id?: string; profile_id?: string },
  displayName: string,
  type: string
): Promise<string | null> {
  const col = fk.team_member_id
    ? "team_member_id"
    : fk.speaker_id
      ? "speaker_id"
      : "profile_id";
  const val = fk.team_member_id ?? fk.speaker_id ?? fk.profile_id;
  if (!val) return null;

  const { data: existing } = await supabase
    .from("authors")
    .select("id")
    .eq(col, val)
    .maybeSingle();
  if (existing?.id) return existing.id as string;

  const name = displayName.trim() || "Author";
  const slug = await uniqueSlug(supabase, "authors", slugify(name, "author"));
  const { data: created } = await supabase
    .from("authors")
    .insert({ ...fk, display_name: name, type, slug, is_public: true })
    .select("id")
    .single();
  return (created?.id as string) ?? null;
}

// Map one picked entry to its canonical author id. Speakers and admins that
// are also team members collapse onto the team member's author row, so a
// person is never credited twice under different hats.
async function resolveOnePick(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  p: PickedAuthor
): Promise<string | null> {
  const name = p.name ?? "";
  if (p.kind === "author") return p.id;

  if (p.kind === "team_member") {
    return findOrCreateAuthorForEntity(
      supabase,
      { team_member_id: p.id },
      name,
      "staff"
    );
  }

  if (p.kind === "speaker") {
    const { data: sp } = await supabase
      .from("speakers")
      .select("team_member_id, first_name, last_name")
      .eq("id", p.id)
      .maybeSingle();
    const display =
      name || [sp?.first_name, sp?.last_name].filter(Boolean).join(" ");
    if (sp?.team_member_id) {
      return findOrCreateAuthorForEntity(
        supabase,
        { team_member_id: sp.team_member_id },
        display,
        "staff"
      );
    }
    return findOrCreateAuthorForEntity(
      supabase,
      { speaker_id: p.id },
      display,
      "guest"
    );
  }

  // kind === "profile" (admin / staff account)
  const { data: tm } = await supabase
    .from("team_members")
    .select("id, name")
    .eq("profile_id", p.id)
    .maybeSingle();
  if (tm?.id) {
    return findOrCreateAuthorForEntity(
      supabase,
      { team_member_id: tm.id },
      name || tm.name || "",
      "staff"
    );
  }
  return findOrCreateAuthorForEntity(
    supabase,
    { profile_id: p.id },
    name,
    "staff"
  );
}

// Resolve the editor's picked authors to canonical author ids, de-duplicated
// (so the same person picked under two hats yields one post_authors row).
export async function resolvePickedAuthors(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  picked: PickedAuthor[]
): Promise<PostAuthorEntry[]> {
  const out: PostAuthorEntry[] = [];
  const seen = new Set<string>();
  for (const p of picked) {
    const authorId = await resolveOnePick(supabase, p);
    if (authorId && !seen.has(authorId)) {
      seen.add(authorId);
      out.push({ id: authorId, role: p.role || "author" });
    }
  }
  return out;
}

export async function syncPostAuthors(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  postId: string,
  entries: PostAuthorEntry[]
): Promise<void> {
  await supabase.from("post_authors").delete().eq("post_id", postId);
  if (entries.length === 0) return;
  const rows = entries.map((a, i) => ({
    post_id: postId,
    author_id: a.id,
    role: a.role || "author",
    sort_order: (i + 1) * 10,
  }));
  await supabase.from("post_authors").insert(rows);
}
