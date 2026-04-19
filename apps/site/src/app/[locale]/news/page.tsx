import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Reveal } from "@dbc/ui";
import { createServerClient } from "@dbc/supabase/server";
import { DBC } from "@/lib/dbc-assets";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title:
      locale === "de" ? "News" : locale === "fr" ? "Actualités" : "News",
  };
}

async function getPosts() {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("news_posts")
    .select(
      "id, slug, title_en, title_de, title_fr, excerpt_en, excerpt_de, excerpt_fr, cover_image_url, author_name, published_at"
    )
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(30);
  return data ?? [];
}

export default async function NewsIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = (locale === "de" || locale === "fr" ? locale : "en") as
    | "en"
    | "de"
    | "fr";
  const posts = await getPosts();

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

  function tFor(post: (typeof posts)[number]) {
    return {
      title:
        (post[`title_${l}` as "title_en" | "title_de" | "title_fr"] as string) ||
        post.title_en,
      excerpt:
        (post[`excerpt_${l}` as "excerpt_en" | "excerpt_de" | "excerpt_fr"] as
          | string
          | null) ?? "",
    };
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          {copy.eyebrow}
        </p>
        <h1 className="mt-3 font-heading text-4xl font-bold tracking-tight sm:text-5xl">
          {copy.title}
        </h1>
      </Reveal>

      {posts.length === 0 ? (
        <p className="mt-12 rounded-xl border border-dashed border-border bg-background p-12 text-center text-muted-foreground">
          {copy.empty}
        </p>
      ) : (
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {posts.map((post, i) => {
            const { title, excerpt } = tFor(post);
            const cover = post.cover_image_url ?? DBC.photo.cohort;
            return (
              <Reveal key={post.id} delay={Math.min(i, 5) * 60} className="h-full">
              <Link
                href={`/${locale}/news/${post.slug}`}
                className="group block h-full overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                  <Image
                    src={cover}
                    alt={title}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover transition-transform group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-6">
                  {post.published_at && (
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {new Date(post.published_at).toLocaleDateString(locale, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  )}
                  <h2 className="mt-2 font-heading text-xl font-bold group-hover:text-primary">
                    {title}
                  </h2>
                  {excerpt && (
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {excerpt}
                    </p>
                  )}
                  {post.author_name && (
                    <p className="mt-4 text-xs text-muted-foreground">
                      {post.author_name}
                    </p>
                  )}
                </div>
              </Link>
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}
