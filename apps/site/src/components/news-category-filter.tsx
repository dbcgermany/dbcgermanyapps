import Link from "next/link";

export type FilterCategory = { slug: string; name: string };

/**
 * Token-only, mobile-friendly category filter strip for the news archive +
 * category landing pages. Renders an "All" link plus one pill per category;
 * the active pill (or "All") uses the primary token, the rest are muted.
 */
export function NewsCategoryFilter({
  locale,
  categories,
  activeSlug,
  allLabel,
}: {
  locale: string;
  categories: FilterCategory[];
  activeSlug: string | null;
  allLabel: string;
}) {
  if (categories.length === 0) return null;
  const pill =
    "rounded-full border px-3 py-1.5 text-sm transition-colors whitespace-nowrap";
  const active = "border-primary bg-primary/10 text-primary";
  const idle = "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30";
  return (
    <div className="mt-8 flex flex-wrap gap-2">
      <Link
        href={`/${locale}/news`}
        className={`${pill} ${activeSlug === null ? active : idle}`}
      >
        {allLabel}
      </Link>
      {categories.map((c) => (
        <Link
          key={c.slug}
          href={`/${locale}/news/category/${c.slug}`}
          className={`${pill} ${activeSlug === c.slug ? active : idle}`}
        >
          {c.name}
        </Link>
      ))}
    </div>
  );
}
