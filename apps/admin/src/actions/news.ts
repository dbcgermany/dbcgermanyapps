"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { slugify, uniqueSlug } from "@/lib/slugify";
import { pingRevalidate } from "@/lib/revalidate";
import { syncPostCategories } from "@/lib/news-category-sync";
import {
  syncPostAuthors,
  resolvePickedAuthors,
  type PostAuthorEntry,
  type PickedAuthor,
  type AuthorPickKind,
} from "@/lib/post-authors-sync";

const AUTHOR_PICK_KINDS: AuthorPickKind[] = [
  "author",
  "team_member",
  "speaker",
  "profile",
];

// Parse the editor's author picker selection ([{kind, id, role, name}]) and
// resolve each pick to its canonical author row (team members / speakers /
// admins are linked, never duplicated). Falls back to the default org author
// (DBC Germany) when none chosen.
async function resolveAuthorEntries(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  formData: FormData
): Promise<PostAuthorEntry[]> {
  let picked: PickedAuthor[] = [];
  try {
    const raw = JSON.parse((formData.get("author_entries") as string) || "[]");
    if (Array.isArray(raw)) {
      picked = raw
        .filter((e) => e && typeof e.id === "string")
        .map((e) => ({
          // Default to "author" for legacy entries that predate the `kind` field.
          kind: AUTHOR_PICK_KINDS.includes(e.kind) ? e.kind : "author",
          id: e.id,
          role: typeof e.role === "string" ? e.role : "author",
          name: typeof e.name === "string" ? e.name : undefined,
        }));
    }
  } catch {
    picked = [];
  }

  const entries = await resolvePickedAuthors(supabase, picked);
  if (entries.length === 0) {
    const { data: org } = await supabase
      .from("authors")
      .select("id")
      .eq("is_org_default", true)
      .maybeSingle();
    if (org?.id) return [{ id: org.id, role: "author" }];
  }
  return entries;
}

// IMPORTANT: import @dbc/legal/server (isomorphic-dompurify → jsdom, which
// initializes a JSDOM window at module load) DYNAMICALLY, inside the write
// actions only. A top-level import drags jsdom into the cold-start of every
// function that imports this module — including the read-only /news list
// page (getNewsPosts) — which fails to boot the lambda and 500s the page.
//
// @dbc/legal MUST be in apps/admin's transpilePackages — it ships raw .ts and
// the dynamic import below throws at runtime under Turbopack otherwise, which
// previously made every article save fail silently before the DB write.

const BODY_SANITIZE_ERROR =
  "We couldn’t process the article body, so nothing was saved.";

// Sanitize the three localized bodies. Returns a clear error (never throws)
// when the sanitizer can't be loaded/run, so the save surfaces a toast instead
// of an opaque "Server Components render" crash. We never persist unsanitized
// HTML — sanitization is an XSS boundary. `fallbackToEn` mirrors create's
// behaviour (empty DE/FR fall back to EN); update keeps them independent.
async function sanitizeBodies(
  formData: FormData,
  fallbackToEn: boolean
): Promise<
  | { body_en: string; body_de: string; body_fr: string }
  | { error: string }
> {
  try {
    const { sanitizeRichHtml } = await import("@dbc/legal/server");
    const clean = (v: FormDataEntryValue | null, fallback = "") =>
      sanitizeRichHtml(((v as string) ?? "") || fallback);
    const en = clean(formData.get("body_en"));
    return {
      body_en: en,
      body_de: clean(formData.get("body_de"), fallbackToEn ? en : ""),
      body_fr: clean(formData.get("body_fr"), fallbackToEn ? en : ""),
    };
  } catch (e) {
    Sentry.captureException(e, { tags: { area: "news.sanitizeBodies" } });
    // Surface the real cause to the operator (admin is a trusted tool) and to
    // the Vercel runtime logs — the redacted "Server Components render" error
    // and the un-wired Sentry capture made this impossible to diagnose blind.
    const detail = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    console.error("[news.sanitizeBodies] failed:", e);
    return { error: `${BODY_SANITIZE_ERROR} (${detail})` };
  }
}

function readCategorySelection(formData: FormData) {
  return {
    categoryIds: formData.getAll("category_ids").map(String),
    primaryId: (formData.get("primary_category_id") as string) || null,
  };
}

const NEWS_PUBLIC_PATHS = (slug: string) => ["/[locale]/news", `/[locale]/news/${slug}`];

// The category landing pages a post currently belongs to (so they refresh
// when a post is published/edited/recategorized).
async function categoryPathsForPost(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  postId: string
): Promise<string[]> {
  const { data } = await supabase
    .from("news_category_links")
    .select("news_categories(slug)")
    .eq("post_id", postId);
  return ((data ?? []) as { news_categories: { slug: string } | null }[])
    .map((r) => r.news_categories?.slug)
    .filter((s): s is string => Boolean(s))
    .map((s) => `/[locale]/news/category/${s}`);
}

// The author landing pages a post currently credits.
async function authorPathsForPost(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  postId: string
): Promise<string[]> {
  const { data } = await supabase
    .from("post_authors")
    .select("authors(slug)")
    .eq("post_id", postId);
  return ((data ?? []) as { authors: { slug: string } | { slug: string }[] | null }[])
    .map((r) => (Array.isArray(r.authors) ? r.authors[0]?.slug : r.authors?.slug))
    .filter((s): s is string => Boolean(s))
    .map((s) => `/[locale]/news/author/${s}`);
}

const POST_COLUMNS =
  "id, slug, title_en, title_de, title_fr, excerpt_en, excerpt_de, excerpt_fr, body_en, body_de, body_fr, cover_image_url, author_name, is_pillar, pillar_id, seo_title_en, seo_title_de, seo_title_fr, seo_description_en, seo_description_de, seo_description_fr, focus_keyword_en, focus_keyword_de, focus_keyword_fr, og_title_en, og_title_de, og_title_fr, og_description_en, og_description_de, og_description_fr, og_image_url, canonical_url, robots_noindex, robots_nofollow, schema_type, is_published, published_at, created_at, updated_at" as const;

function readSeo(formData: FormData) {
  const s = (k: string) => ((formData.get(k) as string) ?? "").trim() || null;
  return {
    seo_title_en: s("seo_title_en"),
    seo_title_de: s("seo_title_de"),
    seo_title_fr: s("seo_title_fr"),
    seo_description_en: s("seo_description_en"),
    seo_description_de: s("seo_description_de"),
    seo_description_fr: s("seo_description_fr"),
    focus_keyword_en: s("focus_keyword_en"),
    focus_keyword_de: s("focus_keyword_de"),
    focus_keyword_fr: s("focus_keyword_fr"),
    og_title_en: s("og_title_en"),
    og_title_de: s("og_title_de"),
    og_title_fr: s("og_title_fr"),
    og_description_en: s("og_description_en"),
    og_description_de: s("og_description_de"),
    og_description_fr: s("og_description_fr"),
    og_image_url: s("og_image_url"),
    canonical_url: s("canonical_url"),
    robots_noindex: formData.get("robots_noindex") === "on",
    robots_nofollow: formData.get("robots_nofollow") === "on",
    schema_type: (formData.get("schema_type") as string) || "NewsArticle",
  };
}

function readPillar(formData: FormData): { is_pillar: boolean; pillar_id: string | null } {
  const isPillar = formData.get("is_pillar") === "on";
  const pillarId = (formData.get("pillar_id") as string) || null;
  // A pillar has no parent; a post can't be its own pillar.
  return { is_pillar: isPillar, pillar_id: isPillar ? null : pillarId };
}

// Module-local type (a non-async export in a "use server" file breaks the build).
type LinkSuggestion = { label: string; slug: string; group: string };

// Internal-link suggestions for the editor's link tool: a post's pillar +
// sibling clusters / its clusters, same-category articles, then recent ones.
export async function getLinkSuggestions(postId?: string): Promise<LinkSuggestion[]> {
  await requireRole("manager");
  const supabase = await createServerClient();
  const out: LinkSuggestion[] = [];
  const seen = new Set<string>();
  const add = (label: string, slug: string, group: string) => {
    if (seen.has(slug)) return;
    seen.add(slug);
    out.push({ label, slug, group });
  };

  if (postId) {
    const { data: post } = await supabase
      .from("news_posts")
      .select("id, is_pillar, pillar_id")
      .eq("id", postId)
      .maybeSingle();
    if (post?.pillar_id) {
      const { data: pillar } = await supabase
        .from("news_posts")
        .select("title_en, slug")
        .eq("id", post.pillar_id)
        .maybeSingle();
      if (pillar) add(pillar.title_en, pillar.slug, "pillar");
      const { data: sibs } = await supabase
        .from("news_posts")
        .select("title_en, slug")
        .eq("pillar_id", post.pillar_id)
        .neq("id", postId)
        .limit(12);
      (sibs ?? []).forEach((s) => add(s.title_en, s.slug, "siblings"));
    }
    if (post?.is_pillar) {
      const { data: clusters } = await supabase
        .from("news_posts")
        .select("title_en, slug")
        .eq("pillar_id", postId)
        .limit(20);
      (clusters ?? []).forEach((s) => add(s.title_en, s.slug, "clusters"));
    }
    // same-category articles
    const { data: cats } = await supabase
      .from("news_category_links")
      .select("category_id")
      .eq("post_id", postId);
    const catIds = (cats ?? []).map((c) => c.category_id);
    if (catIds.length > 0) {
      const { data: mates } = await supabase
        .from("news_category_links")
        .select("news_posts(title_en, slug, id)")
        .in("category_id", catIds)
        .limit(30);
      (mates ?? []).forEach((m) => {
        const p = Array.isArray(m.news_posts) ? m.news_posts[0] : m.news_posts;
        if (p && p.id !== postId) add(p.title_en, p.slug, "category");
      });
    }
  }

  const { data: recent } = await supabase
    .from("news_posts")
    .select("title_en, slug")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(12);
  (recent ?? []).forEach((s) => add(s.title_en, s.slug, "recent"));
  return out;
}

// Pillar articles available to assign as a cluster's parent.
export async function getPillarOptions(excludeId?: string) {
  await requireRole("manager");
  const supabase = await createServerClient();
  let q = supabase
    .from("news_posts")
    .select("id, title_en, slug")
    .eq("is_pillar", true)
    .order("created_at", { ascending: false });
  if (excludeId) q = q.neq("id", excludeId);
  const { data } = await q;
  return data ?? [];
}

export async function getNewsPosts() {
  await requireRole("manager");
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("news_posts")
    .select(POST_COLUMNS)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function getNewsPost(id: string) {
  await requireRole("manager");
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("news_posts")
    .select(
      `${POST_COLUMNS}, news_category_links(category_id, is_primary), post_authors(author_id, role, sort_order, authors(id, display_name, type))`
    )
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createNewsPost(formData: FormData) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const locale = formData.get("locale") as string;

  const titleEn = (formData.get("title_en") as string).trim();
  // Admin can pre-fill the slug; otherwise derive a clean one from the title.
  const manualSlug = ((formData.get("slug") as string) ?? "").trim();
  const base = manualSlug || slugify(titleEn, "post");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const slug = await uniqueSlug(supabase as any, "news_posts", base);

  // New posts: empty DE/FR bodies fall back to the EN body.
  const bodies = await sanitizeBodies(formData, true);
  if ("error" in bodies) return bodies;

  const record = {
    slug,
    title_en: titleEn,
    title_de: (formData.get("title_de") as string) || titleEn,
    title_fr: (formData.get("title_fr") as string) || titleEn,
    excerpt_en: (formData.get("excerpt_en") as string) || null,
    excerpt_de: (formData.get("excerpt_de") as string) || null,
    excerpt_fr: (formData.get("excerpt_fr") as string) || null,
    ...bodies,
    cover_image_url:
      ((formData.get("cover_image_url") as string) || "").trim() || null,
    author_name: (formData.get("author_name") as string) || null,
    ...readPillar(formData),
    ...readSeo(formData),
    is_published: false,
  };

  const { data, error } = await supabase
    .from("news_posts")
    .insert(record)
    .select("id")
    .single();

  if (error) return { error: error.message };

  const { categoryIds, primaryId } = readCategorySelection(formData);
  await syncPostCategories(supabase, data.id, categoryIds, primaryId, user.userId);
  await syncPostAuthors(supabase, data.id, await resolveAuthorEntries(supabase, formData));

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "create_news_post",
    entity_type: "news_posts",
    entity_id: data.id,
    details: { title: titleEn, slug },
  });

  revalidatePath(`/${locale}/news`);
  await pingRevalidate("site", [
    ...NEWS_PUBLIC_PATHS(slug),
    ...(await categoryPathsForPost(supabase, data.id)),
    ...(await authorPathsForPost(supabase, data.id)),
  ]);
  redirect(`/${locale}/news/${data.id}`);
}

export async function updateNewsPost(id: string, formData: FormData) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();
  const locale = formData.get("locale") as string;

  // Edits keep DE/FR bodies independent (don't overwrite an intentionally
  // empty translation with the EN body).
  const bodies = await sanitizeBodies(formData, false);
  if ("error" in bodies) return bodies;

  const record: Record<string, unknown> = {
    title_en: formData.get("title_en") as string,
    title_de: formData.get("title_de") as string,
    title_fr: formData.get("title_fr") as string,
    excerpt_en: (formData.get("excerpt_en") as string) || null,
    excerpt_de: (formData.get("excerpt_de") as string) || null,
    excerpt_fr: (formData.get("excerpt_fr") as string) || null,
    ...bodies,
    cover_image_url:
      ((formData.get("cover_image_url") as string) || "").trim() || null,
    author_name: (formData.get("author_name") as string) || null,
    ...readPillar(formData),
    ...readSeo(formData),
  };

  // Current slug (for rename → 301 history).
  const { data: currentRow } = await supabase
    .from("news_posts")
    .select("slug")
    .eq("id", id)
    .single();
  const oldSlug = currentRow?.slug as string | undefined;

  // Optional: admin can rename the slug. If provided, sanitise + ensure uniqueness.
  const rawSlug = ((formData.get("slug") as string) ?? "").trim();
  if (rawSlug) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    record.slug = await uniqueSlug(supabase as any, "news_posts", slugify(rawSlug, "post"), id);
  }

  const { error } = await supabase
    .from("news_posts")
    .update(record)
    .eq("id", id);

  if (error) return { error: error.message };

  // Record a 301 source when the slug actually changed.
  if (record.slug && oldSlug && record.slug !== oldSlug) {
    await supabase
      .from("news_slug_history")
      .upsert({ old_slug: oldSlug, post_id: id }, { onConflict: "old_slug" });
  }

  const { categoryIds, primaryId } = readCategorySelection(formData);
  await syncPostCategories(supabase, id, categoryIds, primaryId, user.userId);
  await syncPostAuthors(supabase, id, await resolveAuthorEntries(supabase, formData));

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "update_news_post",
    entity_type: "news_posts",
    entity_id: id,
    details: { title: record.title_en },
  });

  revalidatePath(`/${locale}/news`);
  revalidatePath(`/${locale}/news/${id}`);
  // Best-effort: fetch the current slug so we revalidate the public /news/[slug]
  const { data: slugRow } = await supabase
    .from("news_posts")
    .select("slug")
    .eq("id", id)
    .single();
  if (slugRow?.slug)
    await pingRevalidate("site", [
      ...NEWS_PUBLIC_PATHS(slugRow.slug),
      ...(await categoryPathsForPost(supabase, id)),
      ...(await authorPathsForPost(supabase, id)),
    ]);
  return { success: true };
}

export async function toggleNewsPublish(id: string, locale: string) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const { data: post } = await supabase
    .from("news_posts")
    .select("is_published, title_en, slug")
    .eq("id", id)
    .single();
  if (!post) return { error: "Post not found" };

  const newPublished = !post.is_published;
  const { error } = await supabase
    .from("news_posts")
    .update({
      is_published: newPublished,
      published_at: newPublished ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: newPublished ? "publish_news_post" : "unpublish_news_post",
    entity_type: "news_posts",
    entity_id: id,
    details: { title: post.title_en },
  });

  revalidatePath(`/${locale}/news`);
  await pingRevalidate("site", [
    ...NEWS_PUBLIC_PATHS(post.slug),
    ...(await categoryPathsForPost(supabase, id)),
    ...(await authorPathsForPost(supabase, id)),
  ]);
  return { success: true };
}

export async function deleteNewsPost(id: string, locale: string) {
  const user = await requireRole("admin");
  const supabase = await createServerClient();
  const { data: post } = await supabase
    .from("news_posts")
    .select("title_en, slug")
    .eq("id", id)
    .single();
  const { error } = await supabase.from("news_posts").delete().eq("id", id);
  if (error) return { error: error.message };
  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "delete_news_post",
    entity_type: "news_posts",
    entity_id: id,
    details: { title: post?.title_en },
  });
  revalidatePath(`/${locale}/news`);
  if (post?.slug) await pingRevalidate("site", NEWS_PUBLIC_PATHS(post.slug));
  redirect(`/${locale}/news`);
}
