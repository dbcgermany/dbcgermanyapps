import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Sanitize a string into a URL-safe slug.
 * - lowercase
 * - strips diacritics (Événement → evenement)
 * - replaces anything non-alphanumeric with a hyphen
 * - collapses multiple hyphens, trims leading/trailing hyphens
 * - falls back to `fallback` (default "item") for empty inputs
 */
export function slugify(text: string, fallback = "item"): string {
  const normalized = text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, ""); // strip combining accent marks
  const slug = normalized
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 80);
  return slug || fallback;
}

/**
 * Given a base slug and a target table, return a slug that doesn't collide
 * with any existing row's slug. Collisions get "-2", "-3", etc., tried up
 * to 20 times before giving up and falling back to a timestamp suffix.
 *
 * Pass `excludeId` so that editing a row doesn't collide with its own slug.
 */
export async function uniqueSlug(
  supabase: SupabaseClient,
  table: string,
  baseSlug: string,
  excludeId?: string
): Promise<string> {
  const clean = slugify(baseSlug);
  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = attempt === 0 ? clean : `${clean}-${attempt + 1}`;
    let query = supabase.from(table).select("id").eq("slug", candidate).limit(1);
    if (excludeId) query = query.neq("id", excludeId);
    const { data } = await query;
    if (!data || data.length === 0) return candidate;
  }
  // Extreme fallback only if 20 numbered variants are all taken.
  return `${clean}-${Date.now().toString(36)}`;
}
