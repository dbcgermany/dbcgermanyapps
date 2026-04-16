import type { MetadataRoute } from "next";
import { createServerClient } from "@dbc/supabase/server";

const BASE = "https://dbc-germany.com";
const LOCALES = ["en", "de", "fr"] as const;

const STATIC_PAGES: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "", changeFrequency: "daily", priority: 1.0 },
  { path: "about", changeFrequency: "monthly", priority: 0.8 },
  { path: "events", changeFrequency: "daily", priority: 0.9 },
  { path: "news", changeFrequency: "weekly", priority: 0.8 },
  { path: "team", changeFrequency: "monthly", priority: 0.6 },
  { path: "contact", changeFrequency: "monthly", priority: 0.7 },
  { path: "careers", changeFrequency: "monthly", priority: 0.5 },
  { path: "press", changeFrequency: "monthly", priority: 0.5 },
  { path: "partners", changeFrequency: "monthly", priority: 0.5 },
  { path: "faq", changeFrequency: "monthly", priority: 0.7 },
  { path: "newsletter", changeFrequency: "monthly", priority: 0.5 },
  { path: "services/incubation", changeFrequency: "monthly", priority: 0.7 },
  { path: "services/courses", changeFrequency: "monthly", priority: 0.7 },
  { path: "services/investments", changeFrequency: "monthly", priority: 0.7 },
  { path: "services/mentorship", changeFrequency: "monthly", priority: 0.7 },
  { path: "services/elearning", changeFrequency: "monthly", priority: 0.7 },
  { path: "terms", changeFrequency: "monthly", priority: 0.3 },
  { path: "privacy", changeFrequency: "monthly", priority: 0.3 },
  { path: "cookies", changeFrequency: "monthly", priority: 0.3 },
  { path: "imprint", changeFrequency: "monthly", priority: 0.3 },
  { path: "us-privacy-notice", changeFrequency: "monthly", priority: 0.2 },
];

function staticEntries(): MetadataRoute.Sitemap {
  return STATIC_PAGES.flatMap(({ path, changeFrequency, priority }) =>
    LOCALES.map((locale) => ({
      url: `${BASE}/${locale}${path ? `/${path}` : ""}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
      alternates: {
        languages: Object.fromEntries(
          LOCALES.map((l) => [l, `${BASE}/${l}${path ? `/${path}` : ""}`])
        ),
      },
    }))
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = staticEntries();

  try {
    const supabase = await createServerClient();

    const { data: events } = await supabase
      .from("events")
      .select("slug, updated_at")
      .eq("is_published", true);

    if (events) {
      for (const event of events) {
        for (const locale of LOCALES) {
          entries.push({
            url: `${BASE}/${locale}/events/${event.slug}`,
            lastModified: new Date(event.updated_at),
            changeFrequency: "weekly",
            priority: 0.9,
            alternates: {
              languages: Object.fromEntries(
                LOCALES.map((l) => [
                  l,
                  `${BASE}/${l}/events/${event.slug}`,
                ])
              ),
            },
          });
        }
      }
    }

    const { data: posts } = await supabase
      .from("news_posts")
      .select("slug, updated_at")
      .eq("is_published", true);

    if (posts) {
      for (const post of posts) {
        for (const locale of LOCALES) {
          entries.push({
            url: `${BASE}/${locale}/news/${post.slug}`,
            lastModified: new Date(post.updated_at),
            changeFrequency: "monthly",
            priority: 0.7,
            alternates: {
              languages: Object.fromEntries(
                LOCALES.map((l) => [l, `${BASE}/${l}/news/${post.slug}`])
              ),
            },
          });
        }
      }
    }
  } catch {
    // DB unavailable — static entries only
  }

  return entries;
}
