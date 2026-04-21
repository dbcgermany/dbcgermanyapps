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
import { WizardShell } from "../../services/incubation/apply/wizard/wizard-shell";
import { buildPageMetadata } from "@/lib/seo";

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
};

async function loadFunnel(slug: string): Promise<FunnelRow | null> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("funnels")
    .select(
      "id, slug, cta_type, cta_href, hero_image_url, content_en, content_de, content_fr, seo_title, seo_description, og_image_url"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return (data as FunnelRow | null) ?? null;
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
  // Fallback to en if the requested locale is empty / missing hero.
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
  const description =
    row.seo_description ??
    hero?.subtitle ??
    "";
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

  const scrollAnchor = "apply";
  // External-link funnels can point primary CTA straight at cta_href.
  // Wizard + contact-form funnels scroll to the embedded widget.
  const primaryCtaHref =
    row.cta_type === "external_link" && row.cta_href
      ? row.cta_href
      : `#${scrollAnchor}`;

  // On funnels where the form lives on the same page (wizard / contact),
  // the full photo-hero + scroll-to-self CTA is visual noise — the form is
  // already there. Render a compact header instead and let the form own
  // the page. The big hero only makes sense when the CTA navigates away
  // (external_link), where there's nothing else to see.
  const isEmbeddedFunnel =
    row.cta_type === "incubation_wizard" || row.cta_type === "contact_form";

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

      {content.benefits && content.benefits.items.length > 0 && (
        <FunnelBenefits
          eyebrow={content.benefits.eyebrow ?? ""}
          title={content.benefits.title ?? ""}
          items={content.benefits.items}
        />
      )}

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
          /* external_link: render a big CTA button as the middle section too,
             in case the hero CTA is hidden behind the fold on scroll. */
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

      {content.faq && content.faq.items.length > 0 && (
        <FunnelFaq title={content.faq.title} items={content.faq.items} />
      )}

      {content.footerCta?.email && content.footerCta.text && (
        <FunnelFooterCta
          text={content.footerCta.text}
          email={content.footerCta.email}
        />
      )}
    </>
  );
}
