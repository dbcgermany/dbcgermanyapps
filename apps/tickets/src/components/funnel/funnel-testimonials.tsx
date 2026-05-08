import { TestimonialsGrid, type TestimonialItem } from "@dbc/ui";

export type { TestimonialItem };

export function FunnelTestimonials({
  testimonials,
  eyebrow,
  title,
  playLabel,
}: {
  testimonials: TestimonialItem[];
  eyebrow: string;
  title: string;
  playLabel: string;
}) {
  return (
    <TestimonialsGrid
      testimonials={testimonials}
      eyebrow={eyebrow}
      title={title}
      playLabel={playLabel}
    />
  );
}
