import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Reveal } from "@dbc/ui";
import { seoFromI18n } from "@/lib/seo";
import { JsonLd, itemListJsonLd } from "@/lib/json-ld";
import { getUpcomingEvents } from "@/lib/queries";
import { getFeaturedSiteTestimonials } from "@/lib/site-testimonials";
import { TestimonialsSection } from "@/components/testimonials-section";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return seoFromI18n({ locale, pathSuffix: "/events", pageKey: "events" });
}

export default async function EventsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "site" });
  const [events, testimonials] = await Promise.all([
    getUpcomingEvents(20),
    getFeaturedSiteTestimonials(6),
  ]);

  const ticketsUrl =
    process.env.NEXT_PUBLIC_TICKETS_URL ?? "https://tickets.dbc-germany.com";

  const l = (locale === "de" || locale === "fr" ? locale : "en") as
    | "en"
    | "de"
    | "fr";
  const listSchema =
    events.length > 0
      ? itemListJsonLd(
          events.map((e) => ({
            name:
              ((e[`title_${l}` as keyof typeof e] as string) || e.title_en) ??
              "",
            url: `${ticketsUrl}/${locale}/events/${e.slug}`,
          }))
        )
      : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      {listSchema && <JsonLd data={listSchema} />}
      <Reveal>
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            {t("events.eyebrow")}
          </p>
          <h1 className="mt-3 font-heading text-4xl font-bold tracking-tight sm:text-5xl">
            {t("events.title")}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            {t("events.subtitle")}
          </p>
        </div>
      </Reveal>

      <Reveal delay={80}>
        <p className="mt-8 max-w-3xl text-base leading-7 text-muted-foreground">
          {t("intros.events")}
        </p>
      </Reveal>

      {testimonials.length > 0 && (
        <Reveal delay={120}>
          <TestimonialsSection
            testimonials={testimonials}
            locale={locale}
            eyebrow={t("testimonials.eyebrow")}
            title={t("testimonials.title")}
            subtitle={t("testimonials.subtitle")}
            playLabel={t("testimonials.playLabel")}
            className="mt-16"
          />
        </Reveal>
      )}

      {events.length === 0 ? (
        <p className="mt-16 rounded-xl border border-dashed border-border p-16 text-center text-muted-foreground">
          {t("events.noUpcoming")}
        </p>
      ) : (
        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event, i) => {
            const titleKey = `title_${locale}` as keyof typeof event;
            const title = (event[titleKey] as string) || event.title_en;
            return (
              <Reveal key={event.id} delay={Math.min(i, 5) * 60} className="h-full">
              <a
                href={`${ticketsUrl}/${locale}/events/${event.slug}`}
                className="group block h-full overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
              >
                {event.cover_image_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={event.cover_image_url}
                    alt={title}
                    className="aspect-video w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex aspect-video items-center justify-center bg-linear-to-br from-primary/10 to-accent/10">
                    <span className="text-5xl text-primary">&#x1F3DB;</span>
                  </div>
                )}
                <div className="p-6">
                  <p className="text-xs font-medium uppercase tracking-wider text-primary">
                    {event.event_type}
                  </p>
                  <h3 className="mt-2 font-heading text-xl font-bold group-hover:text-primary">
                    {title}
                  </h3>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {new Date(event.starts_at).toLocaleDateString(locale, {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {event.venue_name}
                    {event.city && ` · ${event.city}`}
                  </p>
                </div>
              </a>
              </Reveal>
            );
          })}
        </div>
      )}

      <div className="mt-16 flex justify-center">
        <a
          href={ticketsUrl}
          className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold hover:bg-muted"
        >
          {t("nav.tickets")}
          <span aria-hidden>&rarr;</span>
        </a>
      </div>
    </div>
  );
}
