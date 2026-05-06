import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { formatMoney } from "@dbc/ui";
import {
  getEventBySlug,
  getEventSpeakers,
  getPublicTiers,
} from "@/lib/queries";
import { getEventTriggers } from "@/actions/triggers";
import { SpeakersGrid } from "@/components/speakers/speakers-grid";
import { EventStickyCta } from "@/components/funnel/event-sticky-cta";
import type { SpeakerCardData } from "@/components/speakers/speaker-card";

export const revalidate = 300;

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
  const t = await getTranslations({
    locale,
    namespace: "tickets.speakers.archive",
  });
  return {
    title: `${t("title")} — ${event[titleKey]}`,
    alternates: {
      canonical: `https://tickets.dbc-germany.com/${locale}/events/${slug}/speakers`,
    },
  };
}

export default async function EventSpeakersPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return notFound();

  const triggerLocale = (locale === "de" || locale === "fr" ? locale : "en") as
    | "en"
    | "de"
    | "fr";

  const [eventSpeakers, tiers, triggers] = await Promise.all([
    getEventSpeakers(event.id),
    getPublicTiers(event.id),
    getEventTriggers(event.id, triggerLocale),
  ]);

  const t = await getTranslations({
    locale,
    namespace: "tickets.speakers.archive",
  });
  const f = await getTranslations({
    locale,
    namespace: "tickets.events.funnel",
  });

  const eff = (locale === "de" || locale === "fr" ? locale : "en") as
    | "en"
    | "de"
    | "fr";

  const speakerCards: SpeakerCardData[] = eventSpeakers.map((es) => {
    const tm = es.speakers.team_members;
    return {
      slug: es.speakers.slug,
      fullName: `${es.speakers.first_name} ${es.speakers.last_name}`.trim(),
      title:
        (es.speakers[`title_${eff}` as const] as string | null) ||
        es.speakers.title_en ||
        (tm?.[`role_${eff}` as const] as string | null) ||
        tm?.role_en ||
        null,
      company:
        (es.speakers[`company_${eff}` as const] as string | null) ||
        es.speakers.company_en,
      photoUrl: es.speakers.photo_url || tm?.photo_url || null,
      roleLabel:
        (es[`role_label_${eff}` as const] as string | null) || es.role_label_en,
      isFeatured: es.is_featured,
    };
  });

  const minPrice =
    tiers.length > 0
      ? Math.min(...tiers.map((tier) => tier.price_cents)) / 100
      : null;
  const minPriceCurrency = tiers[0]?.currency ?? "EUR";

  const startsAt = new Date(event.starts_at);
  const checkoutHref = `/${locale}/checkout/${slug}`;

  // Pick the most urgent on-sale tier deadline + scarcity for the sticky bar
  const nowDate = new Date();
  const onSaleTiers = tiers.filter((tier) => {
    const notYet = tier.sales_start_at && new Date(tier.sales_start_at) > nowDate;
    const ended = tier.sales_end_at && new Date(tier.sales_end_at) < nowDate;
    const soldOut =
      tier.max_quantity !== null && tier.quantity_sold >= tier.max_quantity;
    return !notYet && !ended && !soldOut;
  });
  const activeDeadlineTier = onSaleTiers
    .filter((tier) => tier.sales_end_at)
    .sort(
      (a, b) =>
        new Date(a.sales_end_at!).getTime() - new Date(b.sales_end_at!).getTime(),
    )[0];
  const scarcityThreshold = (event.scarcity_threshold as number | null) ?? 20;
  const scarcestTier = onSaleTiers
    .map((tier) => ({ tier, stats: triggers.tiers[tier.id] }))
    .filter(
      ({ stats }) =>
        stats?.capacity != null &&
        stats.displayRemaining != null &&
        stats.displayRemaining > 0 &&
        stats.displayRemaining <= scarcityThreshold,
    )
    .sort((a, b) => (a.stats?.displayRemaining ?? 0) - (b.stats?.displayRemaining ?? 0))[0];

  return (
    <main className="pb-24">
      <div className="mx-auto max-w-6xl px-5 pt-6 sm:px-8 sm:pt-10">
        <Link
          href={`/${locale}/events/${slug}`}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <span aria-hidden>←</span> {t("back")}
        </Link>
        <h1 className="font-heading text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
          {t("subtitle")}
        </p>
      </div>

      <SpeakersGrid
        speakers={speakerCards}
        hrefBase={`/${locale}/events/${slug}/speakers`}
        eyebrow={f("featuredSpeakersEyebrow")}
        title={f("allSpeakersTitle")}
        subtitle={f("allSpeakersSubtitle")}
        viewLabel={t("viewProfile")}
      />

      {startsAt > nowDate && minPrice != null && (
        <EventStickyCta
          eventStartsAt={event.starts_at}
          ctaHref={checkoutHref}
          ctaLabel={f("stickyCtaLabel")}
          fromPriceLabel={f("stickyFromPrice", {
            price: formatMoney(Math.round(minPrice * 100), {
              currency: minPriceCurrency,
              locale,
            }),
          })}
          deadlineIso={activeDeadlineTier?.sales_end_at ?? null}
          deadlinePrefix={f("stickyDeadlinePrefix")}
          scarcityCount={scarcestTier?.stats?.displayRemaining ?? null}
          scarcityLabel={f("stickyScarcity")}
        />
      )}
    </main>
  );
}
