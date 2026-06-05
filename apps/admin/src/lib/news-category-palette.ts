// Fixed category-color vocabulary. These are token-palette KEYS, not hex —
// rendering maps them to theme tokens (SSOT design rule: no raw colors).
export const NEWS_CATEGORY_COLORS = [
  "red",
  "gold",
  "blue",
  "teal",
  "purple",
  "green",
  "orange",
  "slate",
] as const;

export type NewsCategoryColor = (typeof NEWS_CATEGORY_COLORS)[number];
