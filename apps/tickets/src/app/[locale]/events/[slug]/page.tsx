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
    return (
      (event[key] as string) ||
      (event[`${field}_en` as keyof typeof event] as string)
    );
  }

  function tierLoc(tier: (typeof tiers)[number], field: string) {
    const key = `${field}_${locale}` as keyof typeof tier;
    return (
      (tier[key] as string) ||
      (tier[`${field}_en` as keyof typeof tier] as string)
    );
  }

  function schedLoc(item: (typeof schedule)[number], field: string) {
    const key = `${field}_${locale}` as keyof typeof item;
    return (
      (item[key] as string) ||
      (item[`${field}_en` as keyof typeof item] as string)
    );
  }

  const now = new Date();
  const startsAt = new Date(event.starts_at);
  const endsAt = new Date(event.ends_at);

  const t = {
    en: {
      back: "All events",
      when: "Date & time",
      venue: "Venue",
      about: "About the masterclass",
      schedule: "Schedule",
      tickets: "Tickets",
      noTickets: "No tickets available yet.",
      free: "Free",
      soldOut: "Sold out",
      salesStart: "Sales open",
      salesEnded: "Sales closed",
      remaining: "left",
      available: "Available",
      getTickets: "Get tickets",
    },
    de: {
      back: "Alle Veranstaltungen",
      when: "Datum & Zeit",
      venue: "Veranstaltungsort",
      about: "Über die Masterclass",
      schedule: "Programm",
      tickets: "Tickets",
      noTickets: "Noch keine Tickets verfügbar.",
      free: "Kostenlos",
      soldOut: "Ausverkauft",
      salesStart: "Verkauf startet",
      salesEnded: "Verkauf beendet",
      remaining: "verbleibend",
      available: "Verfügbar",
      getTickets: "Tickets kaufen",
    },
    fr: {
      back: "Tous les événements",
      when: "Date & heure",
      venue: "Lieu",
      about: "À propos de la masterclass",
      schedule: "Programme",
      tickets: "Billets",
      noTickets: "Aucun billet disponible pour le moment.",
      free: "Gratuit",
      soldOut: "Complet",
      salesStart: "Vente à partir du",
      salesEnded: "Vente terminée",
      remaining: "restants",
      available: "Disponible",
      getTickets: "Réserver ma place",
    },
  }[locale] ?? {
    back: "All events", when: "Date & time", venue: "Venue",
    about: "About", schedule: "Schedule", tickets: "Tickets",
    noTickets: "No tickets", free: "Free", soldOut: "Sold out",
    salesStart: "Sales open", salesEnded: "Sales closed",
    remaining: "left", available: "Available", getTickets: "Get tickets",
  };

  function formatPrice(cents: number, currency: string) {
    if (cents === 0) return t.free;
    try {
      return (cents / 100).toLocaleString(locale, {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      });
    } catch {
      return `${(cents / 100).toFixed(0)} ${currency}`;
    }
  }

  return (
    <main className="pb-20">
      {/* HERO */}
      <section className="relative">
        <div className="relative aspect-[16/9] w-full overflow-hidden sm:aspect-[21/9] lg:aspect-[24/9]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              event.cover_image_url ??
              "https://diambilaybusinesscenter.org/images/2025_03_29_13_47_IMG_3075-copy.jpg"
            }
            alt={loc("title")}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"
          />
        </div>

        <div className="mx-auto -mt-10 max-w-6xl px-5 sm:-mt-16 sm:px-8 md:-mt-24">
          <Link
            href={`/${locale}`}
            className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <span aria-hidden>&larr;</span> {t.back}
          </Link>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xl backdrop-blur sm:p-10">
            <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              {event.event_type}
            </p>
            <h1 className="mt-4 font-heading text-3xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              {loc("title")}
            </h1>
            <div className="mt-6 grid gap-5 text-sm sm:grid-cols-2 sm:text-base">
              <InfoBlock
                label={t.when}
                primary={startsAt.toLocaleDateString(locale, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                secondary={`${startsAt.toLocaleTimeString(locale, {
                  hour: "2-digit",
                  minute: "2-digit",
                })} – ${endsAt.toLocaleTimeString(locale, {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`}
              />
              <InfoBlock
                label={t.venue}
                primary={event.venue_name ?? ""}
                secondary={[event.venue_address, event.city]
                  .filter(Boolean)
                  .join(" · ")}
              />
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <div className="mx-auto mt-12 max-w-6xl px-5 sm:mt-16 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          {/* LEFT: description + schedule */}
          <div className="space-y-12">
            {loc("description") && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  {t.about}
                </h2>
                <div className="prose-dbc mt-4 max-w-none whitespace-pre-wrap text-base leading-7 text-foreground sm:text-lg sm:leading-8">
                  {loc("description")}
                </div>
              </section>
            )}

            {schedule.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  {t.schedule}
                </h2>
                <ol className="mt-4 space-y-3">
                  {schedule.map((item) => (
                    <li
                      key={item.id}
                      className="flex gap-4 rounded-xl border border-border bg-card p-5 shadow-sm"
                    >
                      <div className="shrink-0">
                        <div className="rounded-md bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
                          {new Date(item.starts_at).toLocaleTimeString(
                            locale,
                            { hour: "2-digit", minute: "2-digit" }
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="font-heading text-base font-bold sm:text-lg">
                          {schedLoc(item, "title")}
                        </p>
                        {item.speaker_name && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {item.speaker_name}
                            {item.speaker_title &&
                              ` · ${item.speaker_title}`}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>

          {/* RIGHT: tickets */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
              <div className="border-b border-border bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 px-6 py-5">
                <h2 className="font-heading text-lg font-bold">
                  {t.tickets}
                </h2>
              </div>

              {tiers.length === 0 ? (
                <p className="px-6 py-10 text-center text-sm text-muted-foreground">
                  {t.noTickets}
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {tiers.map((tier) => {
                    const soldOut =
                      tier.max_quantity !== null &&
                      tier.quantity_sold >= tier.max_quantity;
                    const notOnSaleYet =
                      tier.sales_start_at &&
                      new Date(tier.sales_start_at) > now;
                    const salesEnded =
                      tier.sales_end_at &&
                      new Date(tier.sales_end_at) < now;
                    const unavailable =
                      soldOut || notOnSaleYet || salesEnded;
                    const description = tierLoc(tier, "description");
                    const remaining =
                      tier.max_quantity !== null
                        ? tier.max_quantity - tier.quantity_sold
                        : null;

                    return (
                      <div
                        key={tier.id}
                        className={`px-6 py-5 transition-colors ${
                          unavailable
                            ? "opacity-60"
                            : "hover:bg-muted/30"
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <p className="font-heading text-base font-bold">
                            {tierLoc(tier, "name")}
                          </p>
                          <p className="font-heading text-2xl font-bold text-primary sm:text-3xl">
                            {formatPrice(tier.price_cents, tier.currency)}
                          </p>
                        </div>

                        {description && (
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {description}
                          </p>
                        )}

                        <div className="mt-3">
                          {soldOut ? (
                            <div className="space-y-2">
                              <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                                {t.soldOut}
                              </span>
                              <WaitlistButton
                                eventId={event.id}
                                tierId={tier.id}
                                eventSlug={slug}
                                locale={locale}
                              />
                            </div>
                          ) : notOnSaleYet ? (
                            <span className="inline-flex items-center rounded-full bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
                              {t.salesStart}{" "}
                              {new Date(
                                tier.sales_start_at!
                              ).toLocaleDateString(locale, {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          ) : salesEnded ? (
                            <span className="inline-flex items-center rounded-full bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
                              {t.salesEnded}
                            </span>
                          ) : remaining !== null && remaining <= 20 ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                              {remaining} {t.remaining}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                              {t.available}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="border-t border-border bg-muted/30 p-5">
                <Link
                  href={`/${locale}/checkout/${slug}`}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-lg"
                >
                  {t.getTickets}
                  <span aria-hidden>&rarr;</span>
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function InfoBlock({
  label,
  primary,
  secondary,
}: {
  label: string;
  primary: string;
  secondary?: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1.5 font-heading text-base font-bold sm:text-lg">
        {primary}
      </p>
      {secondary && (
        <p className="mt-1 text-sm text-muted-foreground">{secondary}</p>
      )}
    </div>
  );
}
