import Link from "next/link";
import { getPublishedEvents } from "@/lib/queries";

export const revalidate = 60;

export default async function EventListingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const events = await getPublishedEvents();

  const t = {
    en: {
      tag: "International incubator · Europe chapter",
      title: "Richesses d'Afrique · Live events.",
      subtitle:
        "Masterclasses, conferences and meet-ups for founders, investors and operators building the EU ↔ Africa corridor.",
      noEvents: "No upcoming events at the moment. Check back soon.",
      cta: "Reserve your seat",
      soldOut: "Sold out",
    },
    de: {
      tag: "Internationaler Inkubator · Europa-Chapter",
      title: "Richesses d'Afrique · Live-Events.",
      subtitle:
        "Masterclasses, Konferenzen und Meet-ups für Gründer:innen, Investor:innen und Operator:innen, die den EU ↔ Afrika-Korridor gestalten.",
      noEvents: "Derzeit keine bevorstehenden Veranstaltungen. Schauen Sie bald wieder vorbei.",
      cta: "Platz reservieren",
      soldOut: "Ausverkauft",
    },
    fr: {
      tag: "Incubateur international · Chapitre Europe",
      title: "Richesses d'Afrique · Événements live.",
      subtitle:
        "Masterclasses, conférences et meet-ups pour les fondateur·ice·s, investisseur·euse·s et opérateur·ice·s qui bâtissent le corridor UE ↔ Afrique.",
      noEvents: "Aucun événement à venir pour le moment. Revenez bientôt.",
      cta: "Réserver ma place",
      soldOut: "Complet",
    },
  }[locale] ?? {
    tag: "",
    title: "Live events",
    subtitle: "",
    noEvents: "No upcoming events.",
    cta: "Reserve",
    soldOut: "Sold out",
  };

  function getLocalized(
    item: Record<string, unknown>,
    field: string
  ): string {
    return (
      (item[`${field}_${locale}`] as string) ||
      (item[`${field}_en`] as string) ||
      ""
    );
  }

  return (
    <main>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60% 60% at 15% 0%, rgba(200,16,46,0.10) 0%, transparent 60%), radial-gradient(50% 50% at 90% 20%, rgba(212,160,23,0.10) 0%, transparent 60%)",
          }}
        />
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20 lg:py-24">
          {t.tag && (
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {t.tag}
            </p>
          )}
          <h1 className="mt-5 font-heading text-[2.25rem] leading-[1.1] font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {t.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            {t.subtitle}
          </p>
        </div>
      </section>

      {/* EVENTS GRID */}
      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
        {events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground sm:p-16">
            {t.noEvents}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard
                key={event.id}
                locale={locale}
                slug={event.slug}
                title={getLocalized(event, "title")}
                eventType={event.event_type}
                venue={event.venue_name ?? ""}
                city={event.city ?? ""}
                startsAt={event.starts_at}
                cover={event.cover_image_url}
                cta={t.cta}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function EventCard({
  locale,
  slug,
  title,
  eventType,
  venue,
  city,
  startsAt,
  cover,
  cta,
}: {
  locale: string;
  slug: string;
  title: string;
  eventType: string;
  venue: string;
  city: string;
  startsAt: string;
  cover: string | null;
  cta: string;
}) {
  const dateLabel = new Date(startsAt).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const weekday = new Date(startsAt).toLocaleDateString(locale, {
    weekday: "long",
  });
  const timeLabel = new Date(startsAt).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Link
      href={`/${locale}/events/${slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        {cover ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={cover}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/15 via-background to-accent/15" />
        )}
        <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-background/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary shadow-sm backdrop-blur">
          <span
            aria-hidden
            className="h-1.5 w-1.5 rounded-full bg-primary"
          />
          {eventType}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {weekday} · {dateLabel} · {timeLabel}
        </p>
        <h3 className="mt-3 font-heading text-xl font-bold leading-snug group-hover:text-primary sm:text-2xl">
          {title}
        </h3>
        {(venue || city) && (
          <p className="mt-2 text-sm text-muted-foreground">
            {venue}
            {venue && city ? " · " : ""}
            {city}
          </p>
        )}
        <div className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
          {cta}
          <span
            aria-hidden
            className="transition-transform group-hover:translate-x-1"
          >
            &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}
