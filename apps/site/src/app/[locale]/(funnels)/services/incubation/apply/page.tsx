import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getResendDomainStatus } from "@dbc/email";
import { seoFromI18n } from "@/lib/seo";
import { FunnelHero } from "@/components/funnel/funnel-hero";
import { FunnelBenefits } from "@/components/funnel/funnel-benefits";
import { FunnelFaq } from "@/components/funnel/funnel-faq";
import { FunnelFooterCta } from "@/components/funnel/funnel-footer-cta";
import { WizardShell } from "./wizard/wizard-shell";

// Same hero photo as the auth background — pre-processed JPEG on the
// Supabase brand-assets bucket. Keeps this component framework-agnostic
// (no next/image required, works inside the pure CSS backdrop).
const HERO_IMAGE =
  "https://rcqgsexfuaoiiuqcqeka.supabase.co/storage/v1/object/public/brand-assets/dbc-bg.jpg";

type PageLocale = "en" | "de" | "fr";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return seoFromI18n({
    locale,
    pathSuffix: "/services/incubation/apply",
    pageKey: "servicesApply",
  });
}

export default async function IncubationApplyFunnelPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l: PageLocale =
    locale === "de" || locale === "fr" ? (locale as PageLocale) : "en";
  const t = await getTranslations({ locale: l, namespace: "incubationApply" });

  const pillarKeys = [
    "incubation",
    "courses",
    "investments",
    "mentorship",
    "events",
    "elearning",
    "consulting",
  ] as const;
  const pillars = pillarKeys.map((k) => ({
    key: k,
    title: t(`landing.pillars.items.${k}.title`),
    desc: t(`landing.pillars.items.${k}.desc`),
  }));

  const faqCount = 4;
  const faqItems = Array.from({ length: faqCount }, (_, i) => ({
    q: t(`landing.faq.items.${i}.q`),
    a: t(`landing.faq.items.${i}.a`),
  }));

  const { verified } = await getResendDomainStatus();

  return (
    <>
      <FunnelHero
        eyebrow={t("landing.eyebrow")}
        title={t("landing.title")}
        subtitle={t("landing.subtitle")}
        primaryCta={t("landing.primaryCta")}
        primaryCtaHref={`#${t("landing.scrollAnchor")}`}
        imageUrl={HERO_IMAGE}
      />
      <FunnelBenefits
        eyebrow={t("landing.pillars.eyebrow")}
        title={t("landing.pillars.title")}
        items={pillars}
      />
      <section id={t("landing.scrollAnchor")} className="scroll-mt-24">
        <WizardShell locale={l} />
      </section>
      <FunnelFaq title={t("landing.faq.title")} items={faqItems} />
      {verified ? (
        <FunnelFooterCta
          text={t("landing.footerCta.text")}
          email={t("landing.footerCta.email")}
        />
      ) : null}
    </>
  );
}
