"use client";

import { useFunnelCtaTracker } from "./funnel-analytics";

// Each tier is a card; the middle tier gets the "Most popular" ribbon,
// and any tier with < SCARCITY_THRESHOLD seats left shows a red chip.
// Buttons deep-link into /checkout/[event]?tier=[slug]&fn=[funnel] so the
// visitor lands in the attendee form with the right tier pre-selected.

const SCARCITY_THRESHOLD = 50;

export type FunnelTier = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  priceCents: number;
  currency: string;
  seatsLeft: number | null;
  maxQuantity: number | null;
};

const LABELS = {
  en: {
    mostPopular: "Most popular",
    onlyLeft: (n: number) => `Only ${n} left`,
    seats: "seats",
    buy: "Get ",
    freeLabel: "Free",
    soldOut: "Sold out",
  },
  de: {
    mostPopular: "Am beliebtesten",
    onlyLeft: (n: number) => `Nur ${n} übrig`,
    seats: "Plätze",
    buy: "Hol dir ",
    freeLabel: "Kostenlos",
    soldOut: "Ausverkauft",
  },
  fr: {
    mostPopular: "Le plus choisi",
    onlyLeft: (n: number) => `Plus que ${n}`,
    seats: "places",
    buy: "Obtenir ",
    freeLabel: "Gratuit",
    soldOut: "Épuisé",
  },
} as const;

function formatPrice(cents: number, currency: string, locale: string, free: string) {
  if (cents === 0) return free;
  const symbol = currency === "EUR" ? "€" : currency === "USD" ? "$" : currency + " ";
  const n = (cents / 100).toLocaleString(locale, {
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${n}`;
}

export function FunnelPricing({
  tiers,
  eventSlug,
  funnelSlug,
  funnelId,
  ticketsOrigin,
  locale,
  eyebrow,
  title,
}: {
  tiers: FunnelTier[];
  eventSlug: string;
  funnelSlug: string;
  funnelId: string;
  ticketsOrigin: string;
  locale: "en" | "de" | "fr";
  eyebrow?: string;
  title?: string;
}) {
  const t = LABELS[locale];
  const tracker = useFunnelCtaTracker(funnelId, locale);
  const mostPopularIdx = tiers.length >= 3 ? 1 : -1;

  return (
    <section id="pricing" className="scroll-mt-24">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        {eyebrow ? (
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        {title ? (
          <h2 className="mt-2 text-center font-heading text-3xl font-bold sm:text-4xl">
            {title}
          </h2>
        ) : null}

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {tiers.map((tier, i) => {
            const isPopular = i === mostPopularIdx;
            const isSoldOut = tier.seatsLeft === 0;
            const lowStock =
              tier.seatsLeft !== null &&
              tier.seatsLeft > 0 &&
              tier.seatsLeft <= SCARCITY_THRESHOLD;
            const href = `${ticketsOrigin}/${locale}/checkout/${eventSlug}?tier=${tier.slug}&fn=${funnelSlug}`;
            const price = formatPrice(tier.priceCents, tier.currency, locale, t.freeLabel);

            return (
              <div
                key={tier.id}
                className={`relative flex flex-col rounded-2xl border bg-background p-6 shadow-sm transition-transform ${
                  isPopular
                    ? "border-primary ring-1 ring-primary/60 md:-translate-y-4 md:scale-[1.02]"
                    : "border-border"
                }`}
              >
                {isPopular ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground shadow-sm">
                    {t.mostPopular}
                  </div>
                ) : null}

                <h3 className="font-heading text-xl font-bold">{tier.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-heading text-4xl font-bold tracking-tight">
                    {price}
                  </span>
                </div>
                {tier.description ? (
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {tier.description}
                  </p>
                ) : null}

                {lowStock ? (
                  <p className="mt-4 inline-flex w-fit items-center rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-600 dark:text-red-400">
                    {t.onlyLeft(tier.seatsLeft!)}
                  </p>
                ) : tier.maxQuantity !== null ? (
                  <p className="mt-4 text-xs text-muted-foreground">
                    {tier.maxQuantity} {t.seats}
                  </p>
                ) : null}

                <div className="mt-auto pt-6">
                  {isSoldOut ? (
                    <div className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-border bg-muted px-6 text-sm font-semibold text-muted-foreground">
                      {t.soldOut}
                    </div>
                  ) : (
                    <a
                      href={href}
                      onClick={tracker}
                      className={`inline-flex min-h-12 w-full items-center justify-center rounded-full px-6 text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-100 ${
                        isPopular
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                          : "border border-border bg-background text-foreground hover:bg-muted"
                      }`}
                    >
                      {t.buy}
                      {tier.name}
                      <span aria-hidden className="ml-2">
                        &rarr;
                      </span>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
