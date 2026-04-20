/**
 * Single source of truth for money formatting across admin / tickets / site.
 *
 * Stored values are bigint-cents in the DB; presentation is always derived
 * here so every screen renders € amounts identically. Never call
 * `(cents / 100).toFixed(2)` in a component — use `formatMoney()`.
 */

export interface FormatMoneyOptions {
  /** BCP-47 locale string. Defaults to "en". */
  locale?: string;
  /** ISO 4217 currency code. Defaults to "EUR". */
  currency?: string;
  /** Override fraction digits. Defaults to 2. */
  fractionDigits?: number;
}

export function formatMoney(
  cents: number,
  options: FormatMoneyOptions = {}
): string {
  const { locale = "en", currency = "EUR", fractionDigits = 2 } = options;
  const amount = cents / 100;
  try {
    return amount.toLocaleString(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
  } catch {
    // Fallback when Intl rejects an unusual locale/currency combination.
    return `${amount.toFixed(fractionDigits)} ${currency}`;
  }
}

/**
 * Short Euro formatter for dashboards where compact sums matter more than
 * exact cents. Example: 12 345 cents → "€123" (no fractional part).
 */
export function formatEurCompact(
  cents: number,
  locale: string = "en"
): string {
  return `\u20AC${Math.round(cents / 100).toLocaleString(locale, {
    maximumFractionDigits: 0,
  })}`;
}
