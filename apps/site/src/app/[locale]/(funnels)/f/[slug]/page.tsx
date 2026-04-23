import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerClient } from "@dbc/supabase/server";
import type { FunnelContent, FunnelCtaType } from "@dbc/types";
import { FunnelHero } from "@/components/funnel/funnel-hero";
import { FunnelBenefits } from "@/components/funnel/funnel-benefits";
import { FunnelFaq } from "@/components/funnel/funnel-faq";
import { FunnelFooterCta } from "@/components/funnel/funnel-footer-cta";
import { FunnelCtaLink } from "@/components/funnel/funnel-cta-link";
import { FunnelContactForm } from "@/components/funnel/funnel-contact-form";
import { FunnelAnalyticsBoot } from "@/components/funnel/funnel-analytics";
import { FunnelStory } from "@/components/funnel/funnel-story";
import { FunnelProofStrip } from "@/components/funnel/funnel-proof-strip";
import { FunnelCountdown } from "@/components/funnel/funnel-countdown";
import {
  FunnelPricing,
  type FunnelTier,
} from "@/components/funnel/funnel-pricing";
import { FunnelBonus } from "@/components/funnel/funnel-bonus";
import { FunnelFinalCta } from "@/components/funnel/funnel-final-cta";
import { FunnelStickyCta } from "@/components/funnel/funnel-sticky-cta";
import { WizardShell } from "../../services/incubation/apply/wizard/wizard-shell";
import { buildPageMetadata } from "@/lib/seo";

// Revalidate the funnel page every minute so admin edits to copy, pricing,
// or linked events propagate without hammering the DB on every request.
// Admin writes also fire an on-demand revalidation ping (see Phase 7) so
// the visible delay for operators is typically sub-second.
export const revalidate = 60;

type PageLocale = "en" | "de" | "fr";

type FunnelRow = {
  id: string;
  slug: string;
  cta_type: FunnelCtaType;
  cta_href: string | null;
  hero_image_url: string | null;
  content_en: Partial<FunnelContent>;
  content_de: Partial<FunnelContent>;
  content_fr: Partial<FunnelContent>;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  linked_event_id: string | null;
};

type LinkedEvent = {
  id: string;
  slug: string;
  starts_at: string;
  tiers: FunnelTier[];
};

const STORY_LABELS: Record<
  PageLocale,
  { problem: string; agitation: string; solution: string }
> = {
  en: { problem: "The problem", agitation: "The cost", solution: "The room" },
  de: { problem: "Das Problem", agitation: "Die Kosten", solution: "Der Raum" },
  fr: { problem: "Le problème", agitation: "Le coût", solution: "La salle" },
};

const PRICING_LABELS: Record<PageLocale, { eyebrow: string; title: string }> = {
  en: { eyebrow: "Choose your seat", title: "Three ways to be in the room." },
  de: { eyebrow: "Wähle deinen Platz", title: "Drei Wege in den Raum." },
  fr: { eyebrow: "Choisis ta place", title: "Trois façons d'être dans la salle." },
};

const COUNTDOWN_EYEBROW: Record<PageLocale, string> = {
  en: "Doors open in",
  de: "Türen öffnen in",
  fr: "Ouverture dans",
};

const STARTING_PRICE_LABEL: Record<PageLocale, (price: string) => string> = {
  en: (p) => `From ${p}`,
  de: (p) => `Ab ${p}`,
  fr: (p) => `Dès ${p}`,
};

function formatPriceFrom(
  cents: number,
  currency: string,
  locale: PageLocale
): string {
  const symbol =
    currency === "EUR" ? "€" : currency === "USD" ? "$" : `${currency} `;
  const n = (cents / 100).toLocaleString(locale, {
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${n}`;
}

async function loadFunnel(slug: string): Promise<FunnelRow | null> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("funnels")
    .select(
      "id, slug, cta_type, cta_href, hero_image_url, content_en, content_de, content_fr, seo_title, seo_description, og_image_url, linked_event_id"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return (data as FunnelRow | null) ?? null;
}

async function loadLinkedEvent(
  eventId: string,
  locale: PageLocale
): Promise<LinkedEvent | null> {
  const supabase = await createServerClient();
  const { data: event } = await supabase
    .from("events")
    .select("id, slug, starts_at, is_published")
    .eq("id", eventId)
    .maybeSingle();
  if (!event || !event.is_published) return null;

  const { data: tiers } = await supabase
    .from("ticket_tiers")
    .select(
      "id, slug, name_en, name_de, name_fr, description_en, description_de, description_fr, price_cents, currency, max_quantity, quantity_sold, sales_start_at, sales_end_at, sort_order, is_public"
    )
    .eq("event_id", eventId)
    .eq("is_public", true)
    .order("sort_order", { ascending: true });

  const now = new Date();
  const mapped: FunnelTier[] = ((tiers ?? []) as Array<{
    id: string;
    slug: string;
    name_en: string;
    name_de: string | null;
    name_fr: string | null;
    description_en: string | null;
    description_de: string | null;
    description_fr: string | null;
    price_cents: number;
    currency: string;
    max_quantity: number | null;
    quantity_sold: number;
    sales_start_at: string | null;
    sales_end_at: string | null;
  }>)
    .filter((t) => {
      if (t.sales_start_at && new Date(t.sales_start_at) > now) return false;
      if (t.sales_end_at && new Date(t.sales_end_at) < now) return false;
      return true;
    })
    .map((t) => {
      const name =
        (locale === "de"
          ? t.name_de
          : locale === "fr"
            ? t.name_fr
            : t.name_en) || t.name_en;
      const description =
        locale === "de"
          ? t.description_de
          : locale === "fr"
            ? t.description_fr
            : t.description_en;
      const seatsLeft =
        t.max_quantity === null ? null : Math.max(0, t.max_quantity - t.quantity_sold);
      return {
        id: t.id,
        slug: t.slug,
        name,
        description: description ?? null,
        priceCents: t.price_cents,
        currency: t.currency,
        seatsLeft,
        maxQuantity: t.max_quantity,
      };
    });

  return {
    id: event.id,
    slug: event.slug,
    starts_at: event.starts_at,
    tiers: mapped,
  };
}

function pickContent(
  row: FunnelRow,
  locale: PageLocale
): Partial<FunnelContent> {
  const primary =
    locale === "de"
      ? row.content_de
      : locale === "fr"
        ? row.content_fr
        : row.content_en;
  if (primary && primary.hero?.title) return primary;
  return row.content_en;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const l: PageLocale =
    locale === "de" || locale === "fr" ? (locale as PageLocale) : "en";
  const row = await loadFunnel(slug);
  if (!row) return {};
  const content = pickContent(row, l);
  const hero = content.hero;
  const title = row.seo_title ?? hero?.title ?? "DBC Germany";
  const description = row.seo_description ?? hero?.subtitle ?? "";
  return buildPageMetadata({
    locale: l,
    pathSuffix: `/f/${slug}`,
    title,
    description,
    ogImageUrl: row.og_image_url ?? row.hero_image_url ?? undefined,
  });
}

export default async function FunnelBySlugPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const l: PageLocale =
    locale === "de" || locale === "fr" ? (locale as PageLocale) : "en";
  const row = await loadFunnel(slug);
  if (!row) notFound();

  const content = pickContent(row, l);
  const hero = content.hero;
  if (!hero?.title) notFound();

  const linkedEvent = row.linked_event_id
    ? await loadLinkedEvent(row.linked_event_id, l)
    : null;

  const ticketsOrigin =
    process.env.NEXT_PUBLIC_TICKETS_URL || "https://tickets.dbc-germany.com";

  const scrollAnchor = "apply";
  // External-link funnels without a linked event point the hero CTA straight
  // at cta_href. Linked-event funnels scroll to #pricing. Embedded (wizard /
  // contact) funnels scroll to #apply.
  const primaryCtaHref = linkedEvent
    ? "#pricing"
    : row.cta_type === "external_link" && row.cta_href
      ? row.cta_href
      : `#${scrollAnchor}`;

  // On funnels where the form lives on the same page (wizard / contact),
  // the full photo-hero + scroll-to-self CTA is visual noise — the form is
  // already there. Render a compact header instead and let the form own
  // the page.
  const isEmbeddedFunnel =
    row.cta_type === "incubation_wizard" || row.cta_type === "contact_form";

  const cheapestTier =
    linkedEvent && linkedEvent.tiers.length > 0
      ? linkedEvent.tiers.reduce((lo, t) =>
          t.priceCents < lo.priceCents ? t : lo
        )
      : null;

  return (
    <>
      <FunnelAnalyticsBoot funnelId={row.id} locale={l} />

      {isEmbeddedFunnel ? (
        <header className="mx-auto max-w-3xl px-4 pt-8 sm:px-6 sm:pt-12 lg:px-8">
          {hero.eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              {hero.eyebrow}
            </p>
          ) : null}
          <h1 className="mt-2 font-heading text-3xl font-bold leading-tight sm:text-4xl">
            {hero.title}
          </h1>
          {hero.subtitle ? (
            <p className="mt-3 text-base text-muted-foreground sm:text-lg">
              {hero.subtitle}
            </p>
          ) : null}
        </header>
      ) : (
        <FunnelHero
          eyebrow={hero.eyebrow ?? ""}
          title={hero.title}
          subtitle={hero.subtitle ?? ""}
          primaryCta={hero.primaryCta}
          primaryCtaHref={primaryCtaHref}
          imageUrl={row.hero_image_url ?? undefined}
        />
      )}

      {content.proof && content.proof.items.length > 0 && (
        <FunnelProofStrip items={content.proof.items} />
      )}

      {content.story && (
        <FunnelStory
          problem={content.story.problem}
          agitation={content.story.agitation}
          solution={content.story.solution}
          labels={STORY_LABELS[l]}
        />
      )}

      {linkedEvent && (
        <FunnelCountdown
          startsAt={linkedEvent.starts_at}
          locale={l}
          eyebrow={COUNTDOWN_EYEBROW[l]}
        />
      )}

      {content.benefits && content.benefits.items.length > 0 && (
        <FunnelBenefits
          eyebrow={content.benefits.eyebrow ?? ""}
          title={content.benefits.title ?? ""}
          items={content.benefits.items}
        />
      )}

      {linkedEvent && linkedEvent.tiers.length > 0 ? (
        <FunnelPricing
          tiers={linkedEvent.tiers}
          eventSlug={linkedEvent.slug}
          funnelSlug={row.slug}
          funnelId={row.id}
          ticketsOrigin={ticketsOrigin}
          locale={l}
          eyebrow={PRICING_LABELS[l].eyebrow}
          title={PRICING_LABELS[l].title}
        />
      ) : (
        <section id={scrollAnchor} className="scroll-mt-24">
          {row.cta_type === "incubation_wizard" ? (
            <WizardShell locale={l} funnelId={row.id} />
          ) : row.cta_type === "contact_form" ? (
            <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
              <FunnelContactForm
                funnelId={row.id}
                locale={l}
                cta={hero.primaryCta}
              />
            </div>
          ) : (
            <div className="mx-auto flex max-w-3xl justify-center px-4 py-16 sm:px-6 lg:px-8">
              <FunnelCtaLink
                funnelId={row.id}
                locale={l}
                href={row.cta_href ?? "#"}
                label={hero.primaryCta}
              />
            </div>
          )}
        </section>
      )}

      {content.bonus && content.bonus.items.length > 0 && (
        <FunnelBonus title={content.bonus.title} items={content.bonus.items} />
      )}

      {content.faq && content.faq.items.length > 0 && (
        <FunnelFaq title={content.faq.title} items={content.faq.items} />
      )}

      {content.finalCta && linkedEvent && (
        <FunnelFinalCta
          title={content.finalCta.title}
          subtitle={content.finalCta.subtitle}
          primaryCta={content.finalCta.primaryCta}
        />
      )}

      {content.footerCta?.email && content.footerCta.text && (
        <FunnelFooterCta
          text={content.footerCta.text}
          email={content.footerCta.email}
        />
      )}

      {linkedEvent && cheapestTier ? (
        <FunnelStickyCta
          startingPriceLabel={STARTING_PRICE_LABEL[l](
            formatPriceFrom(
              cheapestTier.priceCents,
              cheapestTier.currency,
              l
            )
          )}
          eventStartsAt={linkedEvent.starts_at}
          locale={l}
        />
      ) : null}
    </>
  );
}
