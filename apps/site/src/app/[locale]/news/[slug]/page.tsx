import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerClient } from "@dbc/supabase/server";
import { getCompanyInfo } from "@/lib/company-info";
import { JsonLd, articleJsonLd } from "@/lib/json-ld";
import { DBC } from "@/lib/dbc-assets";

export const revalidate = 60;

async function getPost(slug: string) {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("news_posts")
    .select(
      "id, slug, title_en, title_de, title_fr, excerpt_en, excerpt_de, excerpt_fr, body_en, body_de, body_fr, cover_image_url, author_name, published_at, updated_at, is_published, seo_title, seo_description, og_image_url"
    )
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  const l = (locale === "de" || locale === "fr" ? locale : "en") as "en" | "de" | "fr";
  const title =
    (post.seo_title as string | null) ??
    (post[`title_${l}` as "title_en" | "title_de" | "title_fr"] as string) ??
    post.title_en;
  const excerptKey = `excerpt_${l}` as "excerpt_en" | "excerpt_de" | "excerpt_fr";
  const bodyKey = `body_${l}` as "body_en" | "body_de" | "body_fr";
  const rawDesc =
    (post.seo_description as string | null) ??
    (post[excerptKey] as string | null) ??
    ((post[bodyKey] as string) ?? "").slice(0, 160);
  const description = rawDesc.length > 160 ? rawDesc.slice(0, 157) + "..." : rawDesc;
  const image = (post.og_image_url as string | null) ?? post.cover_image_url;
  const BASE = "https://dbc-germany.com";
  return {
    title,
    description: description || undefined,
    openGraph: {
      title,
      description: description || undefined,
      type: "article",
      publishedTime: post.published_at ?? undefined,
      modifiedTime: (post.updated_at as string | null) ?? undefined,
      images: image ? [{ url: image }] : undefined,
    },
    alternates: {
      canonical: `${BASE}/${locale}/news/${slug}`,
      languages: {
        en: `${BASE}/en/news/${slug}`,
        de: `${BASE}/de/news/${slug}`,
        fr: `${BASE}/fr/news/${slug}`,
      },
    },
  };
}

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const l = (locale === "de" || locale === "fr" ? locale : "en") as
    | "en"
    | "de"
    | "fr";
  const title =
    (post[`title_${l}` as "title_en" | "title_de" | "title_fr"] as string) ||
    post.title_en;
  const body =
    (post[`body_${l}` as "body_en" | "body_de" | "body_fr"] as string) ||
    post.body_en;
  const cover = post.cover_image_url ?? DBC.hero.home;
  const company = await getCompanyInfo();
  const excerptKey = `excerpt_${l}` as "excerpt_en" | "excerpt_de" | "excerpt_fr";
  const excerpt = (post[excerptKey] as string | null) ?? body.slice(0, 200);

  const jsonLd = articleJsonLd({
    title,
    description: excerpt,
    slug: post.slug,
    published_at: post.published_at ?? "",
    updated_at: (post.updated_at as string | null) ?? post.published_at ?? "",
    author_name: post.author_name,
    cover_image_url: post.cover_image_url,
    publisher: company?.legal_name ?? "DBC Germany",
    publisher_logo: company?.logo_light_url ?? null,
  });

  return (
    <article className="mx-auto max-w-3xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <JsonLd data={jsonLd} />
      <Link
        href={`/${locale}/news`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        &larr;{" "}
        {l === "de" ? "Alle News" : l === "fr" ? "Toutes les actualités" : "All news"}
      </Link>

      <div className="mt-6 flex items-center gap-3 text-xs text-muted-foreground">
        {post.published_at && (
          <time dateTime={post.published_at}>
            {new Date(post.published_at).toLocaleDateString(locale, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        )}
        {post.author_name && <span>· {post.author_name}</span>}
      </div>

      <h1 className="mt-3 font-heading text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
        {title}
      </h1>

      <div className="relative mt-10 aspect-[16/9] w-full overflow-hidden rounded-2xl">
        <Image
          src={cover}
          alt={title}
          fill
          sizes="(min-width: 768px) 768px, 100vw"
          className="object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="prose prose-neutral dark:prose-invert mt-10 max-w-none whitespace-pre-wrap text-base leading-8 text-foreground">
        {body}
      </div>
    </article>
  );
}
