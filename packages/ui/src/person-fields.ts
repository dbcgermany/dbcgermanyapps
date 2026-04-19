/**
 * SSOT person-enum values shared across apps.
 *
 * Keep this file in lock-step with the `gender_identity` enum in
 * supabase/migrations/20260426000001_person_data_ssot.sql — if you add
 * a value here, also ALTER TYPE gender_identity ADD VALUE there, and
 * vice-versa.
 */

export const GENDER_VALUES = [
  "female",
  "male",
  "non_binary",
  "prefer_not_to_say",
] as const;
export type Gender = (typeof GENDER_VALUES)[number];

/**
 * Title prefix. Stored as plain text, not a Postgres enum (keeps room
 * for non-Western / academic titles without a migration). Admin copies
 * these values into their i18n labels; the canonical values are here so
 * every form writes the same strings.
 */
export const TITLE_VALUES = [
  "mr",
  "ms",
  "mrs",
  "mx",
  "dr",
  "prof",
  "excellency",
  "honourable",
  "rev",
] as const;
export type Title = (typeof TITLE_VALUES)[number];

/**
 * Only Mr/Ms/Mrs carry a gender implication. Neutral honorifics
 * (Dr, Prof, Mx, Excellency, Honourable, Rev) return null — those
 * can be held by any gender, so the UI must leave the gender control
 * free.
 */
export function impliedGenderFromTitle(title: Title | null | undefined): Gender | null {
  switch (title) {
    case "mr":
      return "male";
    case "ms":
    case "mrs":
      return "female";
    default:
      return null;
  }
}
