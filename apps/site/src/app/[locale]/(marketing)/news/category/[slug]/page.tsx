import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Reveal } from "@dbc/ui";
import { JsonLd, itemListJsonLd } from "@/lib/json-ld";
import { NewsCard } from "@/components/news-card";
import { NewsCategoryFilter } from "@/components/news-category-filter";
import {
  fetchCategoryBySlug,
  fetchNewsCategories,
  fetchPostsByCategoryId,
  toLocale,
  toNewsCard,
  localizedName,
  type SiteLocale,
} from "@/lib/news";

// Per-item ISR pattern: revalidate window + NO generateStaticParams (rendered
// on demand). Admin category/post writes ping this literal path.
export const revalidate = 60;

const BASE = "https://dbc-germany.com";

function pick(cat: { [k: string]: unknown }, field: string, l: SiteLocale): string | null {
  return (
    (cat[`${field}_${l}`] as string | null) ?? (cat[`${field}_en`] as string | null) ?? null
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const l = toLocale(locale);
  const cat = await fetchCategoryBySlug(slug);
  if (!cat) return {};
  const title =
    pick(cat, "seo_title", l) ?? localizedName(cat, l);
  const description =
    pick(cat, "seo_description", l) ?? pick(cat, "description", l) ?? undefined;
  return {
    title,
    description,
    alternates: {
      canonical: `${BASE}/${locale}/news/category/${slug}`,
      languages: {
        en: `${BASE}/en/news/category/${slug}`,
        de: `${BASE}/de/news/category/${slug}`,
        fr: `${BASE}/fr/news/category/${slug}`,
      },
    },
  };
}

export default async function NewsCategoryPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const l = toLocale(locale);
  const cat = await fetchCategoryBySlug(slug);
  if (!cat) notFound();

  const [posts, categories, tNews] = await Promise.all([
    fetchPostsByCategoryId(cat.id),
    fetchNewsCategories(),
    getTranslations({ locale, namespace: "site.news" }),
  ]);
  const cards = posts.map((p) => toNewsCard(p, l));
  const name = localizedName(cat, l);
  const description = pick(cat, "description", l);

  const listSchema =
    cards.length > 0
      ? itemListJsonLd(
          cards.map((c) => ({
            name: c.title,
            url: `${BASE}/${locale}/news/${c.slug}`,
          }))
        )
      : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      {listSchema && <JsonLd data={listSchema} />}
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          {tNews("all")}
        </p>
        <h1 className="mt-3 font-heading text-4xl font-bold tracking-tight sm:text-5xl">
          {name}
        </h1>
      </Reveal>
      {description && (
        <Reveal delay={80}>
          <p className="mt-6 max-w-3xl text-base leading-7 text-muted-foreground">
            {description}
          </p>
        </Reveal>
      )}

      <NewsCategoryFilter
        locale={locale}
        categories={categories.map((c) => ({ slug: c.slug, name: localizedName(c, l) }))}
        activeSlug={slug}
        allLabel={tNews("all")}
      />

      {cards.length === 0 ? (
        <p className="mt-12 rounded-xl border border-dashed border-border bg-background p-12 text-center text-muted-foreground">
          {tNews("empty")}
        </p>
      ) : (
        <div className="mt-10 grid gap-8 md:grid-cols-2">
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
