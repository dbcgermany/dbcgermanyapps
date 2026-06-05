import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Reveal } from "@dbc/ui";
import { JsonLd, itemListJsonLd } from "@/lib/json-ld";
import { NewsCard } from "@/components/news-card";
import {
  fetchAuthorBySlug,
  fetchPostsByAuthorId,
  toLocale,
  toNewsCard,
  authorField,
} from "@/lib/news";

// Per-item ISR pattern: revalidate + NO generateStaticParams. Author/post
// writes ping this literal path.
export const revalidate = 60;

const BASE = "https://dbc-germany.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const l = toLocale(locale);
  const author = await fetchAuthorBySlug(slug);
  if (!author) return {};
  const role = authorField(author, "role_title", l);
  const description = authorField(author, "bio", l) ?? role ?? undefined;
  return {
    title: `${author.display_name}${role ? ` — ${role}` : ""}`,
    description: description ?? undefined,
    alternates: {
      canonical: `${BASE}/${locale}/news/author/${slug}`,
      languages: {
        en: `${BASE}/en/news/author/${slug}`,
        de: `${BASE}/de/news/author/${slug}`,
        fr: `${BASE}/fr/news/author/${slug}`,
      },
    },
  };
}

export default async function NewsAuthorPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const l = toLocale(locale);
  const author = await fetchAuthorBySlug(slug);
  if (!author) notFound();

  const [posts, tNews] = await Promise.all([
    fetchPostsByAuthorId(author.id),
    getTranslations({ locale, namespace: "site.news" }),
  ]);
  const cards = posts.map((p) => toNewsCard(p, l));
  const role = authorField(author, "role_title", l);
  const bio = authorField(author, "bio", l);

  const sameAs = [author.linkedin_url, author.website_url, author.instagram_url].filter(
    Boolean
  ) as string[];
  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.display_name,
    jobTitle: role ?? undefined,
    description: bio ?? undefined,
    image: author.photo_url ?? undefined,
    url: `${BASE}/${locale}/news/author/${slug}`,
    worksFor: { "@id": "https://dbc-germany.com/#organization" },
    sameAs: sameAs.length > 0 ? sameAs : undefined,
  };
  const listSchema =
    cards.length > 0
      ? itemListJsonLd(
          cards.map((c) => ({ name: c.title, url: `${BASE}/${locale}/news/${c.slug}` }))
        )
      : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <JsonLd data={schema} />
      {listSchema && <JsonLd data={listSchema} />}
      <Reveal>
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          {author.photo_url && (
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-muted">
              <Image
                src={author.photo_url}
                alt={author.display_name}
                fill
                sizes="96px"
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
          <div>
            <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
              {author.display_name}
            </h1>
            {role && <p className="mt-2 text-base text-muted-foreground">{role}</p>}
          </div>
        </div>
      </Reveal>

      {bio && (
        <Reveal delay={80}>
          <p className="mt-6 max-w-3xl whitespace-pre-wrap text-base leading-7 text-muted-foreground">
            {bio}
          </p>
        </Reveal>
      )}

      {cards.length === 0 ? (
        <p className="mt-12 rounded-xl border border-dashed border-border bg-background p-12 text-center text-muted-foreground">
          {tNews("empty")}
        </p>
      ) : (
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {cards.map((card, i) => (
            <Reveal key={card.slug} delay={Math.min(i, 5) * 60} className="h-full">
              <NewsCard locale={locale} post={card} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
