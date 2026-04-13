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
    en: { title: "Events", subtitle: "Discover upcoming conferences and masterclasses by DBC Germany.", noEvents: "No upcoming events at the moment. Check back soon!" },
    de: { title: "Veranstaltungen", subtitle: "Entdecken Sie kommende Konferenzen und Masterclasses von DBC Germany.", noEvents: "Derzeit keine bevorstehenden Veranstaltungen. Schauen Sie bald wieder vorbei!" },
    fr: { title: "\u00C9v\u00E9nements", subtitle: "D\u00E9couvrez les conf\u00E9rences et masterclasses \u00E0 venir de DBC Germany.", noEvents: "Aucun \u00E9v\u00E9nement \u00E0 venir pour le moment. Revenez bient\u00F4t !" },
  }[locale] ?? { title: "Events", subtitle: "Discover upcoming conferences and masterclasses by DBC Germany.", noEvents: "No upcoming events at the moment." };

  function getLocalized(item: Record<string, unknown>, field: string) {
    return (item[`${field}_${locale}`] as string) || (item[`${field}_en`] as string);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="font-heading text-4xl font-bold tracking-tight">
        {t.title}
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">{t.subtitle}</p>

      {events.length === 0 ? (
        <div className="mt-12 rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
          {t.noEvents}
        </div>
      ) : (
        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/${locale}/events/${event.slug}`}
              className="group overflow-hidden rounded-xl border border-border transition-all hover:border-primary/30 hover:shadow-lg"
            >
              {/* Cover image */}
              {event.cover_image_url ? (
                <div className="aspect-video bg-muted">
                  <img
                    src={event.cover_image_url}
                    alt={getLocalized(event, "title")}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex aspect-video items-center justify-center bg-muted">
                  <span className="text-4xl text-muted-foreground">
                    {event.event_type === "conference" ? "\u{1F3DB}" : "\u{1F393}"}
                  </span>
                </div>
              )}

              <div className="p-6">
                <p className="text-sm font-medium capitalize text-primary">
                  {event.event_type}
                </p>
                <h2 className="mt-1 font-heading text-xl font-bold group-hover:text-primary transition-colors">
                  {getLocalized(event, "title")}
                </h2>
                <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                  <p>
                    {new Date(event.starts_at).toLocaleDateString(locale, {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p>
                    {event.venue_name}
                    {event.city && `, ${event.city}`}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
