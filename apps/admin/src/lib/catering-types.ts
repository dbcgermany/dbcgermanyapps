// Catering categories + shared types. Kept in a non-"use server" file so
// the client UI can import the constant without triggering Turbopack's
// "use server file can only export async functions" guard.

export type CateringCategory =
  | "starter"
  | "main"
  | "dessert"
  | "drink_non_alcoholic"
  | "drink_alcoholic"
  | "snack";

export const CATERING_CATEGORIES: readonly CateringCategory[] = [
  "starter",
  "main",
  "dessert",
  "drink_non_alcoholic",
  "drink_alcoholic",
  "snack",
];

export interface CateringMenuItem {
  id: string;
  event_id: string;
  category: CateringCategory;
  name_en: string;
  name_de: string;
  name_fr: string;
  description_en: string | null;
  description_de: string | null;
  description_fr: string | null;
  is_vegetarian: boolean | null;
  is_vegan: boolean | null;
  is_halal: boolean | null;
  allergens: string[] | null;
  sort_order: number | null;
  is_active: boolean;
  max_selections_per_event: number | null;
  selections_count: number;
}

export interface CateringSelectionExportRow {
  ticketShortId: string;
  attendeeName: string;
  attendeeEmail: string;
  tierName: string;
  tierPurpose: string | null;
  category: CateringCategory;
  itemName: string;
  allergens: string[];
  dietary: string;
  notes: string;
  selectionCreatedAt: string;
}
