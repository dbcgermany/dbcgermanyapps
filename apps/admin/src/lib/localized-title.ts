/**
 * Pulls the localized title from any entity that has `title_en`, `title_de`,
 * `title_fr` columns. Falls back to `title_en` when the locale-specific value
 * is empty. Pre-existing duplicated inline pattern across 20+ admin pages.
 *
 * Usage:
 *   const title = getLocalizedTitle(event, locale);
 */
export function getLocalizedTitle<
  E extends { title_en: string | null } & Record<string, unknown>,
>(entity: E, locale: string): string {
  const key = `title_${locale}` as const;
  const value = entity[key];
  if (typeof value === "string" && value.trim().length > 0) return value;
  return entity.title_en ?? "";
}

/** Same shape but for `name_en/de/fr` columns (tiers, categories, etc.). */
export function getLocalizedName<
  E extends { name_en: string | null } & Record<string, unknown>,
>(entity: E, locale: string): string {
  const key = `name_${locale}` as const;
  const value = entity[key];
  if (typeof value === "string" && value.trim().length > 0) return value;
  return entity.name_en ?? "";
}
