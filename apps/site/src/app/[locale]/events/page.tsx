import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { getUpcomingEvents } from "@/lib/queries";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "site" });
  return { title: t("events.title") };
}

export default async function EventsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "site" });
  const events = await getUpcomingEvents(20);

  const ticketsUrl =
    process.env.NEXT_PUBLIC_TICKETS_URL ?? "https://ticket.dbc-germany.com";

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
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

      {events.length === 0 ? (
        <p className="mt-16 rounded-xl border border-dashed border-border p-16 text-center text-muted-foreground">
          {t("events.noUpcoming")}
        </p>
      ) : (
        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => {
            const titleKey = `title_${locale}` as keyof typeof event;
            const title = (event[titleKey] as string) || event.title_en;
            return (
              <a
                key={event.id}
                href={`${ticketsUrl}/${locale}/events/${event.slug}`}
                className="group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
              >
                {event.cover_image_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={event.cover_image_url}
                    alt={title}
                    className="aspect-video w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
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
