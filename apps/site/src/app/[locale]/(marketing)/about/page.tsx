import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Reveal } from "@dbc/ui";
import type { AboutSections } from "@dbc/types";
import { createServerClient } from "@dbc/supabase/server";
import { seoFromI18n } from "@/lib/seo";
import { DBC } from "@/lib/dbc-assets";
import { JsonLd } from "@/lib/json-ld";
import { buildOrganizationJsonLd } from "@/lib/organization-jsonld";
import {
  AboutMission,
  AboutStory,
  AboutValues,
  AboutProofNumbers,
  AboutPressStrip,
  AboutFinalCta,
} from "@/components/about/about-sections";
import { TeamPreviewStrip } from "@/components/about/team-preview-strip";
import type { TeamMemberCardData } from "@/components/team/team-member-card";

// Admin edits to company_info / team_members fire pingRevalidate on
// /about so the minute TTL is mostly defensive.
export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return seoFromI18n({ locale, pathSuffix: "/about", pageKey: "about" });
}

type Locale = "en" | "de" | "fr";

type CompanyInfoRow = {
  brand_name: string | null;
  legal_name: string | null;
  brand_tagline_en: string | null;
  brand_tagline_de: string | null;
  brand_tagline_fr: string | null;
  logo_dark_url: string | null;
  logo_light_url: string | null;
  primary_email: string | null;
  office_line1: string | null;
  office_postal_code: string | null;
  office_city: string | null;
  office_country: string | null;
  parent_company_name: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  youtube_url: string | null;
  twitter_url: string | null;
  about_sections_en: Partial<AboutSections> | null;
  about_sections_de: Partial<AboutSections> | null;
  about_sections_fr: Partial<AboutSections> | null;
};

type FeaturedRow = {
  slug: string;
  name: string;
  role_en: string;
  role_de: string | null;
  role_fr: string | null;
  photo_url: string | null;
};

async function loadCompanyInfo(): Promise<CompanyInfoRow | null> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("company_info")
    .select(
      "brand_name, legal_name, brand_tagline_en, brand_tagline_de, brand_tagline_fr, logo_dark_url, logo_light_url, primary_email, office_line1, office_postal_code, office_city, office_country, parent_company_name, linkedin_url, instagram_url, facebook_url, youtube_url, twitter_url, about_sections_en, about_sections_de, about_sections_fr"
    )
    .eq("id", 1)
    .maybeSingle();
  return (data as CompanyInfoRow | null) ?? null;
}

async function loadFeaturedTeam(locale: Locale): Promise<TeamMemberCardData[]> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("team_members")
    .select("slug, name, role_en, role_de, role_fr, photo_url")
    .eq("visibility", "public")
    .eq("featured_on_about", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })
    .limit(6);
  const rows = (data as FeaturedRow[] | null) ?? [];
  return rows.map((m) => ({
    slug: m.slug,
    name: m.name,
    photoUrl: m.photo_url,
    role:
      (locale === "de" ? m.role_de : locale === "fr" ? m.role_fr : m.role_en) ||
      m.role_en,
  }));
}

function pickSections(
  company: CompanyInfoRow | null,
  locale: Locale
): Partial<AboutSections> {
  if (!company) return {};
  const primary =
    locale === "de"
      ? company.about_sections_de
      : locale === "fr"
        ? company.about_sections_fr
        : company.about_sections_en;
  const fallback = company.about_sections_en ?? {};
  // Merge per-key: if DE/FR have some sections but not others, the
  // missing ones fall back to EN. Admins often translate one section at
  // a time — this avoids blank holes.
  return { ...fallback, ...(primary ?? {}) };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = (locale === "de" || locale === "fr" ? locale : "en") as Locale;
  const t = await getTranslations({ locale, namespace: "site" });

  const [company, featured] = await Promise.all([
    loadCompanyInfo(),
    loadFeaturedTeam(l),
  ]);
  const sections = pickSections(company, l);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dbc-germany.com";
  const socials = [
    company?.linkedin_url,
    company?.instagram_url,
    company?.facebook_url,
    company?.youtube_url,
    company?.twitter_url,
  ].filter((s): s is string => !!s && s.length > 0);
  const tagline =
    (l === "de"
      ? company?.brand_tagline_de
      : l === "fr"
        ? company?.brand_tagline_fr
        : company?.brand_tagline_en) ?? company?.brand_tagline_en ?? null;
  const orgJsonLd = buildOrganizationJsonLd({
    siteUrl,
    name: company?.brand_name || "DBC Germany",
    legalName: company?.legal_name ?? null,
    logoUrl: company?.logo_dark_url ?? company?.logo_light_url ?? null,
    tagline,
    primaryEmail: company?.primary_email ?? null,
    officeAddress: {
      streetAddress: company?.office_line1 ?? null,
      postalCode: company?.office_postal_code ?? null,
      addressLocality: company?.office_city ?? null,
      addressCountry: company?.office_country ?? null,
    },
    sameAs: socials,
    parentName:
      company?.parent_company_name ?? "Diambilay Business Center",
    parentUrl: "https://diambilaybusinesscenter.org",
  });

  const finalCtaFallback = {
    title:
      l === "de"
        ? "Lerne das Team kennen"
        : l === "fr"
          ? "Rencontre l'équipe"
          : "Meet the team",
    primaryCta:
      l === "de"
        ? "Zum Team"
        : l === "fr"
          ? "Voir l'équipe"
          : "See the team",
    primaryCtaHref: `/${locale}/team`,
  };

  return (
    <>
      <JsonLd data={orgJsonLd} />

      <section className="relative overflow-hidden border-b border-border">
        <Image
          src={DBC.photo.team}
          alt="The DBC Germany team"
          fill
          priority
          sizes="100vw"
          className="object-cover"
          referrerPolicy="no-referrer"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-linear-to-r from-background/95 via-background/85 to-background/60"
        />
        <div className="relative mx-auto max-w-4xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              {t("about.eyebrow")}
            </p>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-3 font-heading text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {t("about.title")}
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-8 text-lg leading-8 text-muted-foreground">
              {t("about.body")}
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
              <Image
                src={DBC.logo}
                alt="DBC Germany"
                width={18}
                height={18}
                className="h-4 w-4 object-contain"
                referrerPolicy="no-referrer"
              />
              {t("affiliation.badge")}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="grid items-center gap-12 md:grid-cols-[2fr_1fr]">
              <div>
                <h2 className="font-heading text-2xl font-bold">
                  {l === "de"
                    ? "Unser Gründer"
                    : l === "fr"
                      ? "Notre fondateur"
                      : "Our founder"}
                </h2>
                <p className="mt-4 text-base leading-7 text-muted-foreground">
                  {l === "de"
                    ? "Dr. Jean-Clément Diambilay gründete das Diambilay Business Center in Lubumbashi mit einer einfachen Überzeugung: Afrikas größte wirtschaftliche Ressource sind seine Menschen. DBC Germany trägt diese Überzeugung nach Europa und bringt jede Säule unseres Ökosystems zur afrikanischen Diaspora."
                    : l === "fr"
                      ? "Le Dr Jean-Clément Diambilay a fondé le Diambilay Business Center à Lubumbashi avec une conviction simple : la plus grande ressource économique de l'Afrique, ce sont ses peuples. DBC Germany porte cette conviction en Europe."
                      : "Dr. Jean-Clément Diambilay founded the Diambilay Business Center in Lubumbashi on one simple conviction: Africa's greatest economic asset is its people. DBC Germany carries that conviction to Europe and brings every pillar of our ecosystem to the African diaspora."}
                </p>
              </div>
              <figure className="flex flex-col gap-3">
                <div className="relative aspect-4/5 overflow-hidden rounded-2xl border border-border bg-muted shadow-sm">
                  <Image
                    src={DBC.photo.founder}
                    alt="Dr. Jean-Clément Diambilay"
                    fill
                    sizes="(min-width: 768px) 33vw, 80vw"
                    className="object-cover object-top"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <figcaption className="text-center">
                  <p className="font-heading text-base font-bold leading-tight">
                    Dr. Jean-Clément Diambilay
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                    {l === "de"
                      ? "Gründer · DBC Group"
                      : l === "fr"
                        ? "Fondateur · DBC Group"
                        : "Founder · DBC Group"}
                  </p>
                </figcaption>
              </figure>
            </div>
          </Reveal>
        </div>
      </section>

      <AboutMission data={sections.mission} />

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <blockquote className="border-l-4 border-primary bg-muted/30 px-6 py-8 sm:px-10">
              <p className="font-heading text-xl italic leading-relaxed text-foreground sm:text-2xl">
                “{t("about.conviction")}”
              </p>
              <footer className="mt-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                — {t("about.convictionAttribution")}
              </footer>
            </blockquote>
          </Reveal>
        </div>
      </section>

      <AboutProofNumbers data={sections.metrics} />
      <AboutStory data={sections.story} />

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="grid items-center gap-12 md:grid-cols-2">
              <div className="relative order-last aspect-4/3 overflow-hidden rounded-2xl md:order-first">
                <Image
                  src={DBC.photo.cohort}
                  alt="DBC Germany incubation cohort participants"
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h2 className="font-heading text-2xl font-bold">
                  {l === "de"
                    ? "Wo wir sind"
                    : l === "fr"
                      ? "Où nous sommes"
                      : "Where we operate"}
                </h2>
                <ul className="mt-4 space-y-3 text-base">
                  <li className="flex items-start gap-3">
                    <span aria-hidden className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <span>
                      <strong>Düsseldorf</strong> —{" "}
                      {l === "de"
                        ? "Sitz der DBC Germany: Inkubation, Investitionen, Operations."
                        : l === "fr"
                          ? "Siège de DBC Germany : incubation, investissements, opérations."
                          : "DBC Germany HQ: incubation, investments, operations."}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span aria-hidden className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary/70" />
                    <span>
                      <strong>Essen</strong> —{" "}
                      {l === "de"
                        ? "Veranstaltungsort Richesses d'Afrique 2026. Nur Event, kein Dauerstandort."
                        : l === "fr"
                          ? "Lieu de Richesses d'Afrique 2026. Événement ponctuel, pas de bureau permanent."
                          : "Venue for Richesses d'Afrique 2026. Event only, not a permanent office."}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span aria-hidden className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />
                    <span>
                      <strong>Lubumbashi, DR Congo</strong> —{" "}
                      {l === "de"
                        ? "Mutterorganisation · 378, Av Likasi · +243 820 121 513"
                        : l === "fr"
                          ? "Organisation mère · 378, Av Likasi · +243 820 121 513"
                          : "Parent organisation · 378, Av Likasi · +243 820 121 513"}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span aria-hidden className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent/70" />
                    <span>
                      <strong>Herblay-sur-Seine, France</strong> —{" "}
                      {"DBC France SAS (SIREN 940 839 145) · 43 Avenue du Gros Chêne"}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <AboutValues data={sections.values} />
      <AboutPressStrip data={sections.press} />

      <TeamPreviewStrip members={featured} locale={locale} />

      <AboutFinalCta data={sections.finalCta} fallback={finalCtaFallback} />
    </>
  );
}
