import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Reveal } from "@dbc/ui";
import { seoFromI18n } from "@/lib/seo";
import { JsonLd, itemListJsonLd } from "@/lib/json-ld";
import { NewsCard } from "@/components/news-card";
import { NewsCategoryFilter } from "@/components/news-category-filter";
import {
  fetchPublishedPosts,
  fetchNewsCategories,
  toLocale,
  toNewsCard,
  localizedName,
} from "@/lib/news";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return seoFromI18n({ locale, pathSuffix: "/news", pageKey: "news" });
}

export default async function NewsIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = toLocale(locale);
  const [posts, categories, tIntro, tNews] = await Promise.all([
    fetchPublishedPosts(),
    fetchNewsCategories(),
    getTranslations({ locale, namespace: "site.intros" }),
    getTranslations({ locale, namespace: "site.news" }),
  ]);
  const cards = posts.map((p) => toNewsCard(p, l));

  const copy = {
    eyebrow: { en: "News", de: "News", fr: "Actualités" }[l],
    title: {
      en: "What's happening at DBC Germany.",
      de: "Das passiert bei DBC Germany.",
      fr: "L'actualité de DBC Germany.",
    }[l],
    empty: {
      en: "No announcements yet. Check back soon.",
      de: "Noch keine Ankündigungen. Schauen Sie bald wieder vorbei.",
      fr: "Aucune actualité pour l'instant. Revenez bientôt.",
    }[l],
  };

  const listSchema =
    cards.length > 0
      ? itemListJsonLd(
          cards.map((c) => ({
            name: c.title,
            url: `https://dbc-germany.com/${locale}/news/${c.slug}`,
          }))
        )
      : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      {listSchema && <JsonLd data={listSchema} />}
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          {copy.eyebrow}
        </p>
        <h1 className="mt-3 font-heading text-4xl font-bold tracking-tight sm:text-5xl">
          {copy.title}
        </h1>
      </Reveal>

      <Reveal delay={80}>
        <p className="mt-6 max-w-3xl text-base leading-7 text-muted-foreground">
          {tIntro("news")}
        </p>
      </Reveal>

      <NewsCategoryFilter
        locale={locale}
        categories={categories.map((c) => ({ slug: c.slug, name: localizedName(c, l) }))}
        activeSlug={null}
        allLabel={tNews("all")}
      />

      {cards.length === 0 ? (
        <p className="mt-12 rounded-xl border border-dashed border-border bg-background p-12 text-center text-muted-foreground">
          {copy.empty}
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
