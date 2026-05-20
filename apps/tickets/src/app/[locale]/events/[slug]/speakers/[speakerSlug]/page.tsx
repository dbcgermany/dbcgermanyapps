import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { formatMoney, Reveal } from "@dbc/ui";
import { ExternalLink, Globe, Mail } from "lucide-react";
import {
  getEventBySlug,
  getEventSpeakerBySlug,
  getPublicTiers,
} from "@/lib/queries";
import { getEventTriggers } from "@/actions/triggers";
import { EventStickyCta } from "@/components/funnel/event-sticky-cta";

export const revalidate = 300;

const AVATAR_GRADIENT =
  "bg-gradient-to-br from-primary/25 via-primary/10 to-accent/25 text-primary ring-1 ring-primary/20";

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string; speakerSlug: string }>;
}): Promise<Metadata> {
  const { locale, slug, speakerSlug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return {};
  const speaker = await getEventSpeakerBySlug(event.id, speakerSlug);
  if (!speaker) return {};
  const fullName = `${speaker.speakers.first_name} ${speaker.speakers.last_name}`.trim();
  const eff = (locale === "de" || locale === "fr" ? locale : "en") as
    | "en"
    | "de"
    | "fr";
  const title =
    (speaker.speakers[`title_${eff}` as const] as string | null) ||
    speaker.speakers.title_en;
  return {
    title: `${fullName} — ${title ?? ""}`,
    alternates: {
      canonical: `https://tickets.dbc-germany.com/${locale}/events/${slug}/speakers/${speakerSlug}`,
    },
    openGraph: {
      title: fullName,
      description: title ?? undefined,
      images: speaker.speakers.photo_url
        ? [{ url: speaker.speakers.photo_url }]
        : undefined,
    },
  };
}

export default async function SpeakerProfilePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string; speakerSlug: string }>;
}) {
  const { locale, slug, speakerSlug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return notFound();

  const triggerLocale = (locale === "de" || locale === "fr" ? locale : "en") as
    | "en"
    | "de"
    | "fr";
  const [speaker, tiers, triggers] = await Promise.all([
    getEventSpeakerBySlug(event.id, speakerSlug),
    getPublicTiers(event.id),
    getEventTriggers(event.id, triggerLocale),
  ]);
  if (!speaker) return notFound();

  const t = await getTranslations({
    locale,
    namespace: "tickets.speakers.profile",
  });
  const f = await getTranslations({
    locale,
    namespace: "tickets.events.funnel",
  });

  const eff = (locale === "de" || locale === "fr" ? locale : "en") as
    | "en"
    | "de"
    | "fr";

  // When a speaker is linked to a team member, the team_members row is the
  // canonical source of bio / photo / contact. The speakers row only
  // overrides if explicitly filled (e.g. an event-specific bio/photo).
  // This avoids re-entering Diambilay's or Bambi's bio twice.
  const tm = speaker.speakers.team_members;

  const fullName =
    `${speaker.speakers.first_name} ${speaker.speakers.last_name}`.trim();

  // title: speakers.title_* wins (it's the public-facing event title); else
  // fall back to the team member's role.
  const title =
    (speaker.speakers[`title_${eff}` as const] as string | null) ||
    speaker.speakers.title_en ||
    (tm?.[`role_${eff}` as const] as string | null) ||
    tm?.role_en ||
    null;
  const company =
    (speaker.speakers[`company_${eff}` as const] as string | null) ||
    speaker.speakers.company_en;
  const bio =
    (speaker.speakers[`bio_${eff}` as const] as string | null) ||
    speaker.speakers.bio_en ||
    (tm?.[`bio_${eff}` as const] as string | null) ||
    tm?.bio_en ||
    null;
  const photoUrl = speaker.speakers.photo_url || tm?.photo_url || null;
  const email = speaker.speakers.email || tm?.email || null;
  const linkedinUrl =
    speaker.speakers.linkedin_url || tm?.linkedin_url || null;
  const roleLabel =
    (speaker[`role_label_${eff}` as const] as string | null) ||
    speaker.role_label_en;
  const teamMemberSlug = tm?.visibility === "public" ? tm.slug : null;

  const minPrice =
    tiers.length > 0
      ? Math.min(...tiers.map((tier) => tier.price_cents)) / 100
      : null;
  const minPriceCurrency = tiers[0]?.currency ?? "EUR";

  const startsAt = new Date(event.starts_at);
  const checkoutHref = `/${locale}/checkout/${slug}`;
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
  // Pin scarcity to the tier whose price drives "From €X" so the
  // sticky bar can never contradict the per-tier card on the event page.
  const entryTierStats = (() => {
    if (onSaleTiers.length === 0) return null;
    const minOnSaleCents = Math.min(
      ...onSaleTiers.map((tier) => tier.price_cents),
    );
    const candidates = onSaleTiers
      .filter((tier) => tier.price_cents === minOnSaleCents)
      .map((tier) => triggers.tiers[tier.id])
      .filter((stats): stats is NonNullable<typeof stats> => !!stats);
    if (candidates.length === 0) return null;
    return candidates.sort(
      (a, b) =>
        (a.displayRemaining ?? Infinity) - (b.displayRemaining ?? Infinity),
    )[0];
  })();
  const footerScarcityCount =
    entryTierStats?.capacity != null &&
    entryTierStats.displayRemaining != null &&
    entryTierStats.displayRemaining > 0 &&
    entryTierStats.displayRemaining <= scarcityThreshold
      ? entryTierStats.displayRemaining
      : null;

  return (
    <main className="pb-24">
      <div className="mx-auto max-w-5xl px-5 pt-6 sm:px-8 sm:pt-10">
        <Link
          href={`/${locale}/events/${slug}/speakers`}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <span aria-hidden>←</span> {t("back")}
        </Link>

        <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
          {/* LEFT: portrait card */}
          <Reveal>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              {photoUrl ? (
                <div className="relative aspect-square w-full overflow-hidden rounded-xl">
                  <Image
                    src={photoUrl}
                    alt={fullName}
                    fill
                    sizes="(min-width: 1024px) 280px, 100vw"
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div
                  className={`flex aspect-square w-full items-center justify-center rounded-xl font-heading text-4xl font-bold ${AVATAR_GRADIENT}`}
                  aria-hidden
                >
                  {initialsOf(fullName)}
                </div>
              )}
              {roleLabel && (
                <p className="mt-5 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
                  {roleLabel}
                </p>
              )}
              <h1 className="mt-3 font-heading text-2xl font-bold leading-tight">
                {fullName}
              </h1>
              {(title || company) && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {[title, company].filter(Boolean).join(" · ")}
                </p>
              )}
              {(linkedinUrl ||
                speaker.speakers.twitter_url ||
                speaker.speakers.website_url ||
                email ||
                teamMemberSlug) && (
                <div className="mt-5 border-t border-border pt-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {t("linksHeading")}
                  </p>
                  <ul className="mt-3 space-y-2 text-sm">
                    {linkedinUrl && (
                      <li>
                        <a
                          href={linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-primary hover:text-primary/80"
                        >
                          <ExternalLink className="h-4 w-4" /> {t("linkedin")}
                        </a>
                      </li>
                    )}
                    {speaker.speakers.twitter_url && (
                      <li>
                        <a
                          href={speaker.speakers.twitter_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-primary hover:text-primary/80"
                        >
                          <ExternalLink className="h-4 w-4" /> {t("twitter")}
                        </a>
                      </li>
                    )}
                    {speaker.speakers.website_url && (
                      <li>
                        <a
                          href={speaker.speakers.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-primary hover:text-primary/80"
                        >
                          <Globe className="h-4 w-4" /> {t("website")}
                        </a>
                      </li>
                    )}
                    {email && (
                      <li>
                        <a
                          href={`mailto:${email}`}
                          className="inline-flex items-center gap-2 text-primary hover:text-primary/80"
                        >
                          <Mail className="h-4 w-4" /> {t("email")}
                        </a>
                      </li>
                    )}
                    {teamMemberSlug && (
                      <li>
                        <a
                          href={`https://dbc-germany.com/${locale}/team/${teamMemberSlug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-primary hover:text-primary/80"
                        >
                          <ExternalLink className="h-4 w-4" /> {t("alsoOnTeam")}
                        </a>
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </Reveal>

          {/* RIGHT: bio */}
          <Reveal delay={120}>
            <article>
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                {t("bioHeading")}
              </h2>
              {bio ? (
                <div className="prose-dbc mt-4 max-w-none whitespace-pre-wrap text-base leading-7 text-foreground sm:text-lg sm:leading-8">
                  {bio}
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">—</p>
              )}
              <div className="mt-10">
                <Link
                  href={checkoutHref}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-lg"
                >
                  {f("closingCta")}
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </article>
          </Reveal>
        </div>
      </div>

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
          deadlineDisplayDate={
            activeDeadlineTier?.sales_end_at
              ? new Date(activeDeadlineTier.sales_end_at).toLocaleString(
                  locale,
                  {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                )
              : null
          }
          scarcityCount={footerScarcityCount}
          scarcityLabel={f("stickyScarcity")}
        />
      )}
    </main>
  );
}
