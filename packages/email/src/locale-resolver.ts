/**
 * Single source of truth for resolving the locale every email send call
 * should use. Replaces the ad-hoc `resolveLocale` in apps/admin/.../staff.ts
 * and `normalizeLocale` in apps/site/.../newsletter.ts.
 *
 * The chain is intentionally explicit: profile preference wins (someone who
 * went to Personal Preferences and set a language really means it), then the
 * contact's stored locale (what they last submitted on a form), then any
 * locale captured on a specific transaction (order, form submission), then
 * the country-derived guess, and finally a caller-supplied fallback (defaults
 * to 'en'). Each layer can pass `null`/`undefined` to mean "skip me".
 *
 * This module has zero runtime deps so it can live in @dbc/email without
 * dragging anything else into the admin / site / tickets bundles.
 */

export type Locale = "en" | "de" | "fr";

export const SUPPORTED_LOCALES: readonly Locale[] = ["en", "de", "fr"] as const;

export function isSupportedLocale(value: unknown): value is Locale {
  return value === "en" || value === "de" || value === "fr";
}

/**
 * Normalize an arbitrary string into a supported Locale, defaulting to 'en'
 * for unknown / empty / non-string input. Use this when you have a single
 * input source (e.g. a form field) and just want to coerce it.
 */
export function resolveLocale(value: string | null | undefined): Locale {
  return isSupportedLocale(value) ? value : "en";
}

/**
 * Map ISO 3166-1 alpha-2 country codes to a likely audience locale.
 * Returns `null` when no confident mapping exists; the caller then falls
 * through to the next layer of `resolveRecipientLocale`.
 *
 * Logic:
 *  - 'DE' / 'AT' → de
 *  - Major francophone countries (FR, BE, CH-leaning-fr, CD, SN, CI, GA, CM,
 *    ML, BF, NE, TG, BJ, LU, MC) → fr
 *  - Everything else → null (caller decides)
 */
export function localeFromCountry(
  iso2: string | null | undefined
): Locale | null {
  if (!iso2) return null;
  const code = iso2.trim().toUpperCase();
  if (code === "DE" || code === "AT" || code === "LI") return "de";
  // Francophone audience: France + Belgium + selected African chapters where
  // French is the working language for DBC events + Luxembourg/Monaco.
  if (
    [
      "FR",
      "BE",
      "LU",
      "MC",
      "CD", // DR Congo
      "SN", // Senegal
      "CI", // Côte d'Ivoire
      "GA", // Gabon
      "CM", // Cameroon
      "ML", // Mali
      "BF", // Burkina Faso
      "NE", // Niger
      "TG", // Togo
      "BJ", // Benin
      "CG", // Republic of Congo
      "MG", // Madagascar
      "GN", // Guinea
      "DJ", // Djibouti
      "RW", // Rwanda (FR + EN — leans FR for DBC)
      "BI", // Burundi
    ].includes(code)
  ) {
    return "fr";
  }
  return null;
}

export interface ResolveRecipientLocaleInput {
  /** profiles.locale — set explicitly via Personal Preferences. Highest priority. */
  profileLocale?: string | null;
  /** contacts.locale — captured the last time the contact submitted a form. */
  contactLocale?: string | null;
  /** orders.locale — locale at the moment of purchase. */
  orderLocale?: string | null;
  /** form locale — the URL prefix of the page that fired the action. */
  formLocale?: string | null;
  /** ISO 3166-1 alpha-2 country code (contacts.country, chapter_country, …). */
  country?: string | null;
  /** Fallback when nothing matches. Defaults to 'en'. */
  fallback?: Locale;
}

/**
 * Walk the layered locale chain in priority order and return the first match.
 * NULL / unsupported values are skipped silently so callers can pass whatever
 * shape they have without pre-filtering.
 */
export function resolveRecipientLocale(
  input: ResolveRecipientLocaleInput
): Locale {
  if (isSupportedLocale(input.profileLocale)) return input.profileLocale;
  if (isSupportedLocale(input.contactLocale)) return input.contactLocale;
  if (isSupportedLocale(input.orderLocale)) return input.orderLocale;
  if (isSupportedLocale(input.formLocale)) return input.formLocale;
  const fromCountry = localeFromCountry(input.country ?? null);
  if (fromCountry) return fromCountry;
  return input.fallback ?? "en";
}
