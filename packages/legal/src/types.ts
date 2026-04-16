import type { PublicCompanyInfo } from "./company";

export type LegalLocale = "en" | "de" | "fr";

export interface LegalContext {
  company: PublicCompanyInfo | null;
  locale: LegalLocale;
  /** Absolute URL to the current app host (used in canonical links) */
  siteUrl: string;
  /** Absolute URL to the marketing site (for cross-app links) */
  marketingSiteUrl: string;
  /** Absolute URL to the tickets app */
  ticketsSiteUrl: string;
}

export type LegalCopy<T> = Record<LegalLocale, T>;

export function t<T>(copy: LegalCopy<T>, locale: LegalLocale): T {
  return copy[locale] ?? copy.en;
}
