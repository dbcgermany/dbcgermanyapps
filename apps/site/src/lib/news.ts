import { createServerClient } from "@dbc/supabase/server";
import { DBC } from "@/lib/dbc-assets";
import type { NewsCardData } from "@/components/news-card";

export type SiteLocale = "en" | "de" | "fr";

export function toLocale(locale: string): SiteLocale {
  return locale === "de" || locale === "fr" ? locale : "en";
}

type RawCategory = {
  slug: string;
  name_en: string;
  name_de: string | null;
  name_fr: string | null;
};
type RawLink = { is_primary: boolean; news_categories: RawCategory | null };

// PostgREST returns a single object for a to-one embed; supabase-js may type
// it as an array. Accept both and collapse with `one()`.
function one<T>(v: T | T[] | null | undefined): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : (v ?? null);
}

// Linked person rows embedded on an author. An author backed by a team
// member / speaker / admin is a thin credit; its display fields are resolved
// LIVE from these so editing the Team/Speaker record updates every byline.
type LinkedTeam = {
  name: string;
  photo_url: string | null;
  role_en: string | null;
  role_de: string | null;
  role_fr: string | null;
  bio_en: string | null;
  bio_de: string | null;
  bio_fr: string | null;
};
type LinkedSpeaker = {
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
  title_en: string | null;
  title_de: string | null;
  title_fr: string | null;
  bio_en: string | null;
  bio_de: string | null;
  bio_fr: string | null;
};
type LinkedProfile = {
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};
type AuthorLinks = {
  team_members?: LinkedTeam | LinkedTeam[] | null;
  speakers?: LinkedSpeaker | LinkedSpeaker[] | null;
  profiles?: LinkedProfile | LinkedProfile[] | null;
};

// SSOT embed: pull the linked person alongside the author's own fields.
// Exported so pages with their own post select (e.g. the article page, which
// also needs body/SEO columns) embed the exact same author shape.
export const AUTHOR_EMBED =
  "slug, display_name, type, photo_url, role_title_en, role_title_de, role_title_fr, bio_en, bio_de, bio_fr, team_members(name, photo_url, role_en, role_de, role_fr, bio_en, bio_de, bio_fr), speakers(first_name, last_name, photo_url, title_en, title_de, title_fr, bio_en, bio_de, bio_fr), profiles(display_name, first_name, last_name, avatar_url)";

type RawAuthor = {
  slug: string;
  display_name: string;
  type: string;
  photo_url: string | null;
  role_title_en?: string | null;
  role_title_de?: string | null;
  role_title_fr?: string | null;
  bio_en?: string | null;
  bio_de?: string | null;
  bio_fr?: string | null;
} & AuthorLinks;
export type RawPostAuthor = {
  role: string;
  sort_order: number;
  authors: RawAuthor | RawAuthor[] | null;
};

export type PostByline = {
  slug: string;
  name: string;
  type: string;
  photo_url: string | null;
  role: string;
};

// Resolve an author's public display fields, preferring the linked person
// (true SSOT) and falling back to the author row's own fields.
function resolveAuthorDisplay(a: RawAuthor) {
  const tm = one(a.team_members);
  const sp = one(a.speakers);
  const pr = one(a.profiles);
  const own = {
    display_name: a.display_name,
    photo_url: a.photo_url,
    role_title_en: a.role_title_en ?? null,
    role_title_de: a.role_title_de ?? null,
    role_title_fr: a.role_title_fr ?? null,
    bio_en: a.bio_en ?? null,
    bio_de: a.bio_de ?? null,
    bio_fr: a.bio_fr ?? null,
  };
  if (tm) {
    return {
      display_name: tm.name || own.display_name,
      photo_url: tm.photo_url ?? own.photo_url,
      role_title_en: tm.role_en ?? own.role_title_en,
      role_title_de: tm.role_de ?? own.role_title_de,
      role_title_fr: tm.role_fr ?? own.role_title_fr,
      bio_en: tm.bio_en ?? own.bio_en,
      bio_de: tm.bio_de ?? own.bio_de,
      bio_fr: tm.bio_fr ?? own.bio_fr,
    };
  }
  if (sp) {
    const name = [sp.first_name, sp.last_name].filter(Boolean).join(" ");
    return {
      display_name: name || own.display_name,
      photo_url: sp.photo_url ?? own.photo_url,
      role_title_en: sp.title_en ?? own.role_title_en,
      role_title_de: sp.title_de ?? own.role_title_de,
      role_title_fr: sp.title_fr ?? own.role_title_fr,
      bio_en: sp.bio_en ?? own.bio_en,
      bio_de: sp.bio_de ?? own.bio_de,
      bio_fr: sp.bio_fr ?? own.bio_fr,
    };
  }
  if (pr) {
    const name =
      pr.display_name || [pr.first_name, pr.last_name].filter(Boolean).join(" ");
    return { ...own, display_name: name || own.display_name, photo_url: pr.avatar_url ?? own.photo_url };
  }
  return own;
}

export type RawPost = {
  id: string;
  slug: string;
  title_en: string;
  title_de: string;
  title_fr: string;
  excerpt_en: string | null;
  excerpt_de: string | null;
  excerpt_fr: string | null;
  cover_image_url: string | null;
  author_name: string | null;
  published_at: string | null;
  news_category_links: RawLink[] | null;
  post_authors: RawPostAuthor[] | null;
};

const POST_SELECT =
  `id, slug, title_en, title_de, title_fr, excerpt_en, excerpt_de, excerpt_fr, cover_image_url, author_name, published_at, news_category_links(is_primary, news_categories(slug, name_en, name_de, name_fr)), post_authors(role, sort_order, authors(${AUTHOR_EMBED}))`;

/** Ordered byline for a post: its authors, else a DBC Germany fallback. */
export function postByline(post: RawPost): PostByline[] {
  const rows = [...(post.post_authors ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const out: PostByline[] = [];
  for (const r of rows) {
    const a = one(r.authors);
    if (a) {
      const d = resolveAuthorDisplay(a);
      out.push({ slug: a.slug, name: d.display_name, type: a.type, photo_url: d.photo_url, role: r.role });
    }
  }
  if (out.length === 0) {
    out.push({
      slug: "dbc-germany",
      name: post.author_name || "DBC Germany",
      type: "dbc_org",
      photo_url: null,
      role: "author",
    });
  }
  return out;
}

// Lightweight byline (slug + live-resolved name) for pages that run their own
// post select but embed AUTHOR_EMBED. Falls back to DBC Germany when empty.
export function bylineNames(
  postAuthors: RawPostAuthor[] | null,
  fallbackName: string | null
): { slug: string; name: string }[] {
  const out = [...(postAuthors ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((r) => {
      const a = one(r.authors);
      return a ? { slug: a.slug, name: resolveAuthorDisplay(a).display_name } : null;
    })
    .filter((x): x is { slug: string; name: string } => x !== null);
  return out.length > 0
    ? out
    : [{ slug: "dbc-germany", name: fallbackName || "DBC Germany" }];
}

export type NewsCategoryRow = {
  id: string;
  slug: string;
  name_en: string;
  name_de: string | null;
  name_fr: string | null;
  description_en: string | null;
  description_de: string | null;
  description_fr: string | null;
  seo_title_en: string | null;
  seo_title_de: string | null;
  seo_title_fr: string | null;
  seo_description_en: string | null;
  seo_description_de: string | null;
  seo_description_fr: string | null;
};

export async function fetchNewsCategories(): Promise<NewsCategoryRow[]> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("news_categories")
    .select(
      "id, slug, name_en, name_de, name_fr, description_en, description_de, description_fr, seo_title_en, seo_title_de, seo_title_fr, seo_description_en, seo_description_de, seo_description_fr"
    )
    .order("sort_order", { ascending: true });
  return (data ?? []) as unknown as NewsCategoryRow[];
}

export async function fetchPublishedPosts(limit = 30): Promise<RawPost[]> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("news_posts")
    .select(POST_SELECT)
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as RawPost[];
}

export async function fetchCategoryBySlug(slug: string): Promise<NewsCategoryRow | null> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("news_categories")
    .select(
      "id, slug, name_en, name_de, name_fr, description_en, description_de, description_fr, seo_title_en, seo_title_de, seo_title_fr, seo_description_en, seo_description_de, seo_description_fr"
    )
    .eq("slug", slug)
    .maybeSingle();
  return (data as unknown as NewsCategoryRow) ?? null;
}

export async function fetchPostsByCategoryId(categoryId: string, limit = 60): Promise<RawPost[]> {
  const supabase = await createServerClient();
  const { data: links } = await supabase
    .from("news_category_links")
    .select("post_id")
    .eq("category_id", categoryId);
  const ids = (links ?? []).map((l) => l.post_id);
  if (ids.length === 0) return [];
  const { data } = await supabase
    .from("news_posts")
    .select(POST_SELECT)
    .in("id", ids)
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as RawPost[];
}

/** Estimated reading time in minutes from an HTML body (~200 wpm). */
export function readingTimeMinutes(html: string): number {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const words = text ? text.split(" ").length : 0;
  return Math.max(1, Math.round(words / 200));
}

/** More articles: same-category first, then recent — excluding the current post. */
export async function fetchRelatedPosts(postId: string, limit = 3): Promise<RawPost[]> {
  const supabase = await createServerClient();
  const { data: cats } = await supabase
    .from("news_category_links")
    .select("category_id")
    .eq("post_id", postId);
  const catIds = (cats ?? []).map((c) => c.category_id);
  const ids = new Set<string>();
  if (catIds.length) {
    const { data: links } = await supabase
      .from("news_category_links")
      .select("post_id")
      .in("category_id", catIds);
    (links ?? []).forEach((l) => {
      if (l.post_id !== postId) ids.add(l.post_id);
    });
  }
  let related: RawPost[] = [];
  if (ids.size) {
    const { data } = await supabase
      .from("news_posts")
      .select(POST_SELECT)
      .in("id", [...ids])
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(limit);
    related = (data ?? []) as unknown as RawPost[];
  }
  if (related.length < limit) {
    const exclude = [postId, ...related.map((r) => r.id)];
    const { data } = await supabase
      .from("news_posts")
      .select(POST_SELECT)
      .eq("is_published", true)
      .not("id", "in", `(${exclude.join(",")})`)
      .order("published_at", { ascending: false })
      .limit(limit - related.length);
    related = [...related, ...((data ?? []) as unknown as RawPost[])];
  }
  return related.slice(0, limit);
}

export function localizedName(cat: RawCategory, locale: SiteLocale): string {
  return (cat[`name_${locale}` as "name_en"] as string | null) ?? cat.name_en;
}

export function primaryCategory(
  post: RawPost,
  locale: SiteLocale
): { slug: string; name: string } | null {
  const links = post.news_category_links ?? [];
  const link = links.find((l) => l.is_primary) ?? links[0];
  if (!link?.news_categories) return null;
  return { slug: link.news_categories.slug, name: localizedName(link.news_categories, locale) };
}

/** Map a raw post row to the SSOT NewsCard shape for a given locale. */
export function toNewsCard(post: RawPost, locale: SiteLocale): NewsCardData {
  return {
    slug: post.slug,
    title: (post[`title_${locale}` as "title_en"] as string) || post.title_en,
    excerpt: (post[`excerpt_${locale}` as "excerpt_en"] as string | null) ?? "",
    cover: post.cover_image_url ?? DBC.photo.cohort,
    dateLabel: post.published_at
      ? new Date(post.published_at).toLocaleDateString(locale, {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : null,
    author: postByline(post).map((b) => b.name).join(", "),
    category: primaryCategory(post, locale),
  };
}

export type AuthorRow = {
  id: string;
  slug: string;
  display_name: string;
  type: string;
  role_title_en: string | null;
  role_title_de: string | null;
  role_title_fr: string | null;
  bio_en: string | null;
  bio_de: string | null;
  bio_fr: string | null;
  photo_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  instagram_url: string | null;
};

const AUTHOR_SELECT =
  `id, slug, display_name, type, role_title_en, role_title_de, role_title_fr, bio_en, bio_de, bio_fr, photo_url, linkedin_url, website_url, instagram_url, team_members(name, photo_url, role_en, role_de, role_fr, bio_en, bio_de, bio_fr), speakers(first_name, last_name, photo_url, title_en, title_de, title_fr, bio_en, bio_de, bio_fr), profiles(display_name, first_name, last_name, avatar_url)`;

export async function fetchAuthorBySlug(slug: string): Promise<AuthorRow | null> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("authors")
    .select(AUTHOR_SELECT)
    .eq("slug", slug)
    .eq("is_public", true)
    .maybeSingle();
  if (!data) return null;
  // Resolve display fields live from the linked person (SSOT).
  const raw = data as unknown as AuthorRow & AuthorLinks;
  const d = resolveAuthorDisplay(raw as unknown as RawAuthor);
  return {
    ...raw,
    display_name: d.display_name,
    photo_url: d.photo_url,
    role_title_en: d.role_title_en,
    role_title_de: d.role_title_de,
    role_title_fr: d.role_title_fr,
    bio_en: d.bio_en,
    bio_de: d.bio_de,
    bio_fr: d.bio_fr,
  };
}

export async function fetchPostsByAuthorId(authorId: string, limit = 60): Promise<RawPost[]> {
  const supabase = await createServerClient();
  const { data: links } = await supabase
    .from("post_authors")
    .select("post_id")
    .eq("author_id", authorId);
  const ids = (links ?? []).map((l) => l.post_id);
  if (ids.length === 0) return [];
  const { data } = await supabase
    .from("news_posts")
    .select(POST_SELECT)
    .in("id", ids)
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as RawPost[];
}

export function authorField(a: AuthorRow, field: string, l: SiteLocale): string | null {
  return (
    ((a as unknown as Record<string, string | null>)[`${field}_${l}`]) ??
    ((a as unknown as Record<string, string | null>)[`${field}_en`]) ??
    null
  );
}
