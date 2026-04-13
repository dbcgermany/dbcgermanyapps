import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventBySlug, getPublicTiers, getEventSchedule } from "@/lib/queries";
import { WaitlistButton } from "./waitlist-button";

export const revalidate = 30;

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const eventOrNull = await getEventBySlug(slug);

  if (!eventOrNull) return notFound();

  const event = eventOrNull;

  const [tiers, schedule] = await Promise.all([
    getPublicTiers(event.id),
    getEventSchedule(event.id),
  ]);

  function loc(field: string) {
    const key = `${field}_${locale}` as keyof typeof event;
    return (event[key] as string) || (event[`${field}_en` as keyof typeof event] as string);
  }

  function tierLoc(tier: (typeof tiers)[number], field: string) {
    const key = `${field}_${locale}` as keyof typeof tier;
    return (tier[key] as string) || (tier[`${field}_en` as keyof typeof tier] as string);
  }

  function schedLoc(item: (typeof schedule)[number], field: string) {
    const key = `${field}_${locale}` as keyof typeof item;
    return (item[key] as string) || (item[`${field}_en` as keyof typeof item] as string);
  }

  const now = new Date();

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      {/* Breadcrumb */}
      <Link
        href={`/${locale}`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; {locale === "de" ? "Alle Veranstaltungen" : locale === "fr" ? "Tous les \u00e9v\u00e9nements" : "All events"}
      </Link>

      {/* Hero */}
      <div className="mt-6">
        {event.cover_image_url && (
          <div className="aspect-[21/9] overflow-hidden rounded-xl bg-muted">
            <img
              src={event.cover_image_url}
              alt={loc("title")}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="mt-8">
          <p className="text-sm font-medium capitalize text-primary">
            {event.event_type}
          </p>
          <h1 className="mt-2 font-heading text-4xl font-bold tracking-tight">
            {loc("title")}
          </h1>
        </div>
      </div>

      <div className="mt-12 grid gap-12 lg:grid-cols-3">
        {/* Left: Event info */}
        <div className="lg:col-span-2 space-y-12">
          {/* Date & Venue */}
          <section className="grid gap-6 sm:grid-cols-2">
            <div>
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {locale === "de" ? "Datum & Zeit" : locale === "fr" ? "Date & Heure" : "Date & Time"}
              </h2>
              <p className="mt-2 text-lg font-medium">
                {new Date(event.starts_at).toLocaleDateString(locale, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p className="text-muted-foreground">
                {new Date(event.starts_at).toLocaleTimeString(locale, {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                &ndash;{" "}
                {new Date(event.ends_at).toLocaleTimeString(locale, {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {locale === "de" ? "Veranstaltungsort" : locale === "fr" ? "Lieu" : "Venue"}
              </h2>
              <p className="mt-2 text-lg font-medium">{event.venue_name}</p>
              <p className="text-muted-foreground">
                {event.venue_address}
                {event.city && `, ${event.city}`}
              </p>
            </div>
          </section>

          {/* Description */}
          {loc("description") && (
            <section>
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {locale === "de" ? "Beschreibung" : locale === "fr" ? "Description" : "About"}
              </h2>
              <div className="mt-4 whitespace-pre-wrap leading-relaxed">
                {loc("description")}
              </div>
            </section>
          )}

          {/* Schedule */}
          {schedule.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {locale === "de" ? "Programm" : locale === "fr" ? "Programme" : "Schedule"}
              </h2>
              <div className="mt-4 space-y-4">
                {schedule.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 rounded-lg border border-border p-4"
                  >
                    <div className="shrink-0 text-sm text-muted-foreground">
                      {new Date(item.starts_at).toLocaleTimeString(locale, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div>
                      <p className="font-medium">{schedLoc(item, "title")}</p>
                      {item.speaker_name && (
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {item.speaker_name}
                          {item.speaker_title && ` \u2014 ${item.speaker_title}`}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right: Ticket Tiers (sticky) */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <div className="rounded-xl border border-border p-6">
            <h2 className="font-heading text-lg font-bold">
              {locale === "de" ? "Tickets" : locale === "fr" ? "Billets" : "Tickets"}
            </h2>

            {tiers.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                {locale === "de"
                  ? "Keine Tickets verf\u00fcgbar."
                  : locale === "fr"
                    ? "Aucun billet disponible."
                    : "No tickets available."}
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {tiers.map((tier) => {
                  const soldOut =
                    tier.max_quantity !== null &&
                    tier.quantity_sold >= tier.max_quantity;
                  const notOnSaleYet =
                    tier.sales_start_at && new Date(tier.sales_start_at) > now;
                  const salesEnded =
                    tier.sales_end_at && new Date(tier.sales_end_at) < now;
                  const unavailable = soldOut || notOnSaleYet || salesEnded;

                  return (
                    <div
                      key={tier.id}
                      className={`rounded-lg border p-4 ${
                        unavailable
                          ? "border-border opacity-60"
                          : "border-primary/20 bg-primary/5"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{tierLoc(tier, "name")}</p>
                          {tierLoc(tier, "description") && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {tierLoc(tier, "description")}
                            </p>
                          )}
                        </div>
                        <p className="font-heading text-lg font-bold">
                          {tier.price_cents === 0
                            ? locale === "de"
                              ? "Kostenlos"
                              : locale === "fr"
                                ? "Gratuit"
                                : "Free"
                            : `\u20AC${(tier.price_cents / 100).toFixed(2)}`}
                        </p>
                      </div>

                      {/* Availability */}
                      <div className="mt-2 text-xs text-muted-foreground">
                        {soldOut
                          ? locale === "de"
                            ? "Ausverkauft"
                            : locale === "fr"
                              ? "\u00C9puis\u00E9"
                              : "Sold out"
                          : notOnSaleYet
                            ? `${locale === "de" ? "Verkauf startet am" : locale === "fr" ? "Vente \u00E0 partir du" : "Sales start"} ${new Date(tier.sales_start_at!).toLocaleDateString(locale)}`
                            : salesEnded
                              ? locale === "de"
                                ? "Verkauf beendet"
                                : locale === "fr"
                                  ? "Vente termin\u00E9e"
                                  : "Sales ended"
                              : tier.max_quantity
                                ? `${tier.max_quantity - tier.quantity_sold} ${locale === "de" ? "verbleibend" : locale === "fr" ? "restants" : "remaining"}`
                                : locale === "de"
                                  ? "Verf\u00fcgbar"
                                  : locale === "fr"
                                    ? "Disponible"
                                    : "Available"}
                      </div>

                      {/* Waitlist button (only on sold out) */}
                      {soldOut && (
                        <WaitlistButton
                          eventId={event.id}
                          tierId={tier.id}
                          eventSlug={slug}
                          locale={locale}
                        />
                      )}
                    </div>
                  );
                })}

                {/* Buy button */}
                <Link
                  href={`/${locale}/checkout/${slug}`}
                  className="mt-4 flex w-full items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
                >
                  {locale === "de"
                    ? "Tickets kaufen"
                    : locale === "fr"
                      ? "Acheter des billets"
                      : "Get Tickets"}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
