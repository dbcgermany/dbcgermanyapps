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

type RawAuthor = {
  slug: string;
  display_name: string;
  type: string;
  photo_url: string | null;
};
// PostgREST returns a single object for the to-one embed; supabase-js may
// type it as an array. Accept both.
type RawPostAuthor = {
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
  "id, slug, title_en, title_de, title_fr, excerpt_en, excerpt_de, excerpt_fr, cover_image_url, author_name, published_at, news_category_links(is_primary, news_categories(slug, name_en, name_de, name_fr)), post_authors(role, sort_order, authors(slug, display_name, type, photo_url))";

/** Ordered byline for a post: its authors, else a DBC Germany fallback. */
export function postByline(post: RawPost): PostByline[] {
  const rows = [...(post.post_authors ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const out: PostByline[] = [];
  for (const r of rows) {
    const a = Array.isArray(r.authors) ? r.authors[0] : r.authors;
    if (a) out.push({ slug: a.slug, name: a.display_name, type: a.type, photo_url: a.photo_url, role: r.role });
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
  "id, slug, display_name, type, role_title_en, role_title_de, role_title_fr, bio_en, bio_de, bio_fr, photo_url, linkedin_url, website_url, instagram_url";

export async function fetchAuthorBySlug(slug: string): Promise<AuthorRow | null> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("authors")
    .select(AUTHOR_SELECT)
    .eq("slug", slug)
    .eq("is_public", true)
    .maybeSingle();
  return (data as unknown as AuthorRow) ?? null;
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
