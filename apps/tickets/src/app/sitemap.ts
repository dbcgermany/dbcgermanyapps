import type { MetadataRoute } from "next";
import { createServerClient } from "@dbc/supabase/server";

// Tickets-app sitemap. Mirrors the marketing site's pattern but only lists
// surfaces an outside searcher should land on directly:
//   • the events archive  /{locale}/events
//   • each public event   /{locale}/events/{slug}
// Order/transfer/checkout/confirmation routes are buyer-private and already
// blocked in robots.ts; speakers + speaker-detail routes are sub-paths off
// each event so Google will discover them via the event page itself.

const BASE = "https://tickets.dbc-germany.com";
const LOCALES = ["en", "de", "fr"] as const;

function archiveEntries(): MetadataRoute.Sitemap {
  return LOCALES.map((locale) => ({
    url: `${BASE}/${locale}/events`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.9,
    alternates: {
      languages: Object.fromEntries(
        LOCALES.map((l) => [l, `${BASE}/${l}/events`])
      ),
    },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = archiveEntries();

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
                LOCALES.map((l) => [l, `${BASE}/${l}/events/${event.slug}`])
              ),
            },
          });
        }
      }
    }
  } catch {
    // DB unavailable — archive entries only.
  }

  return entries;
}
