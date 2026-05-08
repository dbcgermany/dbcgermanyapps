import { TestimonialsGrid, type TestimonialItem } from "@dbc/ui";
import type { SiteTestimonialRow } from "@/lib/site-testimonials";

function pickRole(row: SiteTestimonialRow, locale: "en" | "de" | "fr"): string | null {
  if (locale === "de") return row.author_role_de ?? row.author_role_en;
  if (locale === "fr") return row.author_role_fr ?? row.author_role_en;
  return row.author_role_en;
}

function pickQuote(row: SiteTestimonialRow, locale: "en" | "de" | "fr"): string {
  if (locale === "de") return row.quote_de ?? row.quote_en;
  if (locale === "fr") return row.quote_fr ?? row.quote_en;
  return row.quote_en;
}

export function TestimonialsSection({
  testimonials,
  locale,
  eyebrow,
  title,
  subtitle,
  playLabel,
  className,
}: {
  testimonials: SiteTestimonialRow[];
  locale: string;
  eyebrow: string;
  title: string;
  subtitle?: string | null;
  playLabel: string;
  className?: string;
}) {
  if (testimonials.length === 0) return null;
  const l = (locale === "de" || locale === "fr" ? locale : "en") as "en" | "de" | "fr";
  const items: TestimonialItem[] = testimonials.map((t) => ({
    id: t.id,
    authorName: t.author_name,
    authorRole: pickRole(t, l),
    authorPhotoUrl: t.author_photo_url,
    quote: pickQuote(t, l),
    videoUrl: t.video_url,
    rating: t.rating,
  }));
  return (
    <TestimonialsGrid
      testimonials={items}
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle ?? null}
      playLabel={playLabel}
      className={className}
    />
  );
}
