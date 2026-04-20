import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LOCALES, type Locale } from "@dbc/types";
import { getCompanyInfo } from "@/lib/company-info";

/**
 * SSOT for per-page metadata across the marketing site.
 *
 * Every page's `generateMetadata()` should call this and nothing else —
 * it guarantees every page gets a canonical URL, a full trilingual
 * hreflang map, a locale-aware OG tag, and Twitter card metadata.
 *
 * Keep the shape stable; if a new page needs one-off overrides, add an
 * optional prop here rather than bypassing the helper in the page.
 */

const BASE_URL = "https://dbc-germany.com";

const OG_LOCALE: Record<Locale, string> = {
  en: "en_US",
  de: "de_DE",
  fr: "fr_FR",
};

export interface BuildPageMetadataInput {
  /** Locale of the current request ("en" | "de" | "fr"). */
  locale: string;
  /**
   * Path after the locale segment, starting with "/" (e.g. "/about",
   * "/services/incubation"). Use "" for the homepage.
   */
  pathSuffix: string;
  /**
   * Literal localized title (already translated). Kept under 60 chars for
   * best Google SERP display. The helper appends " — DBC Germany" unless
   * the caller already includes the brand.
   */
  title: string;
  /**
   * Literal localized description, 140–160 chars. Must start with the
   * hook, not throat-clearing like "Welcome to…".
   */
  description: string;
  /** Optional per-page OG image URL (absolute). Falls back to company default. */
  ogImageUrl?: string | null;
  /** OG type; default "website". Set "article" on news detail etc. */
  ogType?: "website" | "article" | "profile";
  /** Let detail pages override the canonical when slugs vary per locale. */
  canonicalOverride?: string;
  /** Let detail pages provide pre-computed hreflang targets (different slug per locale). */
  languagesOverride?: Partial<Record<Locale | "x-default", string>>;
}

export async function buildPageMetadata(
  input: BuildPageMetadataInput
): Promise<Metadata> {
  const {
    locale,
    pathSuffix,
    title,
    description,
    ogImageUrl,
    ogType = "website",
    canonicalOverride,
    languagesOverride,
  } = input;

  const l = normalize(locale);
  const company = await getCompanyInfo();
  const brandName = company?.brand_name ?? "DBC Germany";

  const canonical =
    canonicalOverride ?? `${BASE_URL}/${l}${pathSuffix}`;

  const languages: Record<string, string> =
    languagesOverride != null
      ? Object.fromEntries(
          Object.entries(languagesOverride).filter(([, v]) => typeof v === "string")
        ) as Record<string, string>
      : {
          en: `${BASE_URL}/en${pathSuffix}`,
          de: `${BASE_URL}/de${pathSuffix}`,
          fr: `${BASE_URL}/fr${pathSuffix}`,
          "x-default": `${BASE_URL}/en${pathSuffix}`,
        };

  const ogImage =
    ogImageUrl ?? company?.og_default_image_url ?? null;

  const brandedTitle = title.includes(brandName)
    ? title
    : `${title} — ${brandName}`;

  return {
    title: brandedTitle,
    description,
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      title: brandedTitle,
      description,
      url: canonical,
      siteName: brandName,
      type: ogType,
      locale: OG_LOCALE[l],
      alternateLocale: LOCALES.filter((x) => x !== l).map((x) => OG_LOCALE[x]),
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: brandedTitle,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

function normalize(locale: string): Locale {
  return LOCALES.includes(locale as Locale) ? (locale as Locale) : "en";
}

/**
 * Convenience wrapper — resolves title & description from the
 * `site.seo.{pageKey}` namespace in the trilingual catalogs before
 * calling `buildPageMetadata()`. Use this on every static page.
 */
export async function seoFromI18n({
  locale,
  pathSuffix,
  pageKey,
  ogImageUrl,
  ogType,
}: {
  locale: string;
  pathSuffix: string;
  pageKey: string;
  ogImageUrl?: string | null;
  ogType?: "website" | "article" | "profile";
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "site.seo" });
  return buildPageMetadata({
    locale,
    pathSuffix,
    title: t(`${pageKey}.title`),
    description: t(`${pageKey}.description`),
    ogImageUrl,
    ogType,
  });
}
