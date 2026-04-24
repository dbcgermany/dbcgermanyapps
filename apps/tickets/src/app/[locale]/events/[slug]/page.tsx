import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventBySlug, getPublicTiers, getEventSchedule } from "@/lib/queries";
import { getEventTriggers, TRIGGER_POLICY } from "@/actions/triggers";
import { getCompanyInfo } from "@/lib/company-info";
import { WaitlistButton } from "./waitlist-button";
import { ShareButtons } from "./share-buttons";
import { Countdown } from "./countdown";
import { ScarcityBadge } from "@/components/event-triggers/scarcity-badge";
import { SocialProofBadge } from "@/components/event-triggers/social-proof-badge";
import { TierDeadlineCountdown } from "@/components/event-triggers/tier-deadline-countdown";
import { RecentBuyerTicker } from "@/components/event-triggers/recent-buyer-ticker";
import { PriceAnchor } from "@/components/event-triggers/price-anchor";

export const revalidate = 30;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return {};
  const l = locale === "de" || locale === "fr" ? locale : "en";
  const titleKey = `title_${l}` as "title_en" | "title_de" | "title_fr";
  const descKey = `description_${l}` as "description_en" | "description_de" | "description_fr";
  const title = (event.seo_title as string | null) ?? (event[titleKey] as string);
  const rawDesc = (event.seo_description as string | null) ?? (event[descKey] as string) ?? "";
  const description = rawDesc.length > 160 ? rawDesc.slice(0, 157) + "..." : rawDesc;
  const image = (event.og_image_url as string | null) ?? event.cover_image_url;
  const BASE = "https://tickets.dbc-germany.com";
  return {
    title,
    description: description || undefined,
    openGraph: {
      title,
      description: description || undefined,
      images: image ? [{ url: image }] : undefined,
      type: "website",
    },
    alternates: {
      canonical: `${BASE}/${locale}/events/${slug}`,
      languages: {
        en: `${BASE}/en/events/${slug}`,
        de: `${BASE}/de/events/${slug}`,
        fr: `${BASE}/fr/events/${slug}`,
      },
    },
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const eventOrNull = await getEventBySlug(slug);

  if (!eventOrNull) return notFound();

  const event = eventOrNull;
  const company = await getCompanyInfo();

  const triggerLocale = (locale === "de" || locale === "fr" ? locale : "en") as
    | "en"
    | "de"
    | "fr";

  const [tiers, schedule, triggers] = await Promise.all([
    getPublicTiers(event.id),
    getEventSchedule(event.id),
    getEventTriggers(event.id, triggerLocale),
  ]);

  const minPrice = tiers.length > 0
    ? Math.min(...tiers.map((t) => t.price_cents)) / 100
    : null;

  const eventJsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title_en,
    description: event.description_en ?? "",
    startDate: event.starts_at,
    endDate: event.ends_at,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    image: event.cover_image_url ?? undefined,
    location: event.venue_name ? {
      "@type": "Place",
      name: event.venue_name,
      address: { "@type": "PostalAddress", addressLocality: event.city ?? undefined, addressCountry: event.country ?? "DE" },
    } : undefined,
    organizer: { "@type": "Organization", name: company?.legal_name ?? "DBC Germany", url: "https://dbc-germany.com" },
    offers: minPrice != null ? {
      "@type": "Offer",
      url: `https://tickets.dbc-germany.com/en/events/${event.slug}`,
      price: minPrice,
      priceCurrency: tiers[0]?.currency ?? "EUR",
      availability: "https://schema.org/InStock",
    } : undefined,
  };

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
      organizer: "Organizer",
      viewOnMap: "View on map",
      scarcityOnly: "Only",
      scarcityHurry: "Hurry, only",
      scarcityLeft: "left",
      socialProofSuffix: "people secured their spot in the last 24 hours",
      saveLabel: "Save",
      deadlinePrefix: "Ends in",
      dayAbbr: "d",
      hourAbbr: "h",
      minAbbr: "m",
      tickerPrefixCity: "Someone from",
      tickerMiddleCity: "just bought a",
      tickerPrefixAnon: "Someone just bought a",
      tickerTicket: "ticket",
      tickerJustNow: "just now",
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
      organizer: "Veranstalter",
      viewOnMap: "Auf Karte anzeigen",
      scarcityOnly: "Nur noch",
      scarcityHurry: "Schnell sein — nur noch",
      scarcityLeft: "verfügbar",
      socialProofSuffix:
        "Personen haben sich in den letzten 24 Stunden ihren Platz gesichert",
      saveLabel: "Sparen",
      deadlinePrefix: "Endet in",
      dayAbbr: "T",
      hourAbbr: "Std",
      minAbbr: "Min",
      tickerPrefixCity: "Jemand aus",
      tickerMiddleCity: "hat gerade ein",
      tickerPrefixAnon: "Jemand hat gerade ein",
      tickerTicket: "Ticket gekauft",
      tickerJustNow: "gerade eben",
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
      organizer: "Organisateur",
      viewOnMap: "Voir sur la carte",
      scarcityOnly: "Plus que",
      scarcityHurry: "Vite, plus que",
      scarcityLeft: "disponibles",
      socialProofSuffix:
        "personnes ont réservé leur place dans les dernières 24 heures",
      saveLabel: "Économisez",
      deadlinePrefix: "Fin dans",
      dayAbbr: "j",
      hourAbbr: "h",
      minAbbr: "min",
      tickerPrefixCity: "Quelqu’un à",
      tickerMiddleCity: "vient d’acheter un billet",
      tickerPrefixAnon: "Quelqu’un vient d’acheter un billet",
      tickerTicket: "",
      tickerJustNow: "à l’instant",
    },
  }[locale] ?? {
    back: "All events", when: "Date & time", venue: "Venue",
    about: "About", schedule: "Schedule", tickets: "Tickets",
    noTickets: "No tickets", free: "Free", soldOut: "Sold out",
    salesStart: "Sales open", salesEnded: "Sales closed",
    remaining: "left", available: "Available", getTickets: "Get tickets",
    organizer: "Organizer", viewOnMap: "View on map",
    scarcityOnly: "Only", scarcityHurry: "Hurry, only", scarcityLeft: "left",
    socialProofSuffix: "people secured their spot in the last 24 hours",
    saveLabel: "Save",
    deadlinePrefix: "Ends in", dayAbbr: "d", hourAbbr: "h", minAbbr: "m",
    tickerPrefixCity: "Someone from", tickerMiddleCity: "just bought a",
    tickerPrefixAnon: "Someone just bought a", tickerTicket: "ticket",
    tickerJustNow: "just now",
  };

  const tickerLabels = {
    prefixWithCity: t.tickerPrefixCity,
    prefixAnon: t.tickerPrefixAnon,
    middleKnownCity: t.tickerMiddleCity,
    middleAnon: t.tickerPrefixAnon,
    ticketSuffix: t.tickerTicket,
    ago: {
      justNow: t.tickerJustNow,
      minutes: (n: number) =>
        locale === "de"
          ? `vor ${n} Min`
          : locale === "fr"
            ? `il y a ${n} min`
            : `${n} min ago`,
      hours: (n: number) =>
        locale === "de"
          ? `vor ${n} Std`
          : locale === "fr"
            ? `il y a ${n} h`
            : `${n}h ago`,
    },
  };

  return (
    <main className="pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
      />
      <div className="mx-auto max-w-6xl px-5 pt-6 sm:px-8 sm:pt-10">
        <Link
          href={`/${locale}`}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <span aria-hidden>&larr;</span> {t.back}
        </Link>

        {/* HERO IMAGE — boxed */}
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-muted shadow-sm sm:aspect-21/9">
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
        </div>

        {/* INFO CARD — boxed, no overlay */}
        <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-10">
          <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            {event.event_type}
          </p>
          <h1 className="mt-4 font-heading text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
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
            <div>
              <InfoBlock
                label={t.venue}
                primary={event.venue_name ?? ""}
                secondary={[event.venue_address, event.city]
                  .filter(Boolean)
                  .join(" · ")}
              />
              {event.venue_name && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([event.venue_name, event.venue_address, event.city].filter(Boolean).join(", "))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80"
                >
                  {t.viewOnMap} &rarr;
                </a>
              )}
            </div>
          </div>

          {/* Organizer */}
          <div className="mt-6 flex items-center gap-3 border-t border-border pt-5">
            {company?.logo_light_url && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={company.logo_light_url}
                alt=""
                className="h-8 w-8 rounded object-contain"
                referrerPolicy="no-referrer"
              />
            )}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {t.organizer}
              </p>
              <p className="text-sm font-medium">
                {company?.brand_name ?? "DBC Germany"}
              </p>
            </div>
          </div>

          {/* Share */}
          <div className="mt-5 border-t border-border pt-5">
            <ShareButtons
              url={`https://tickets.dbc-germany.com/${locale}/events/${slug}`}
              title={loc("title")}
              locale={locale}
            />
          </div>
        </div>

        {/* Countdown */}
        {startsAt > now && (
          <div className="mt-4">
            <Countdown startsAt={event.starts_at} locale={locale} />
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div className="mx-auto mt-10 max-w-6xl px-5 sm:mt-12 sm:px-8">
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

              {tiers.length > 0 && (
                <div className="space-y-2 border-b border-border px-6 py-4">
                  <SocialProofBadge
                    displayed={triggers.socialProof.displayed}
                    floored={triggers.socialProof.floored}
                    label={t.socialProofSuffix}
                  />
                  {triggers.recentBuyers.length > 0 && (
                    <RecentBuyerTicker
                      buyers={triggers.recentBuyers}
                      labels={tickerLabels}
                    />
                  )}
                </div>
              )}

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
                    const tierStats = triggers.tiers[tier.id];
                    const isFree = tier.price_cents === 0;

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
                          {isFree ? (
                            <p className="font-heading text-2xl font-bold text-primary sm:text-3xl">
                              {t.free}
                            </p>
                          ) : (
                            <PriceAnchor
                              priceCents={tier.price_cents}
                              originalPriceCents={tier.original_price_cents}
                              currency={tier.currency}
                              locale={locale}
                              saveLabel={t.saveLabel}
                            />
                          )}
                        </div>

                        {description && (
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {description}
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {soldOut ? (
                            <div className="w-full space-y-2">
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
                          ) : (
                            <>
                              {tierStats?.capacity != null ? (
                                <ScarcityBadge
                                  displayRemaining={tierStats.displayRemaining}
                                  capacity={tierStats.capacity}
                                  labels={{
                                    only: t.scarcityOnly,
                                    hurry: t.scarcityHurry,
                                    left: t.scarcityLeft,
                                  }}
                                />
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                  {t.available}
                                </span>
                              )}
                              <TierDeadlineCountdown
                                salesEndAt={tierStats?.salesEndAt ?? null}
                                warnHours={TRIGGER_POLICY.DEADLINE_WARN_HOURS}
                                labels={{
                                  prefix: t.deadlinePrefix,
                                  d: t.dayAbbr,
                                  h: t.hourAbbr,
                                  m: t.minAbbr,
                                }}
                              />
                            </>
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
