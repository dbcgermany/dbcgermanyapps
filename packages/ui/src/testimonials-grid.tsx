import Image from "next/image";
import { Play, Star } from "lucide-react";

export type TestimonialItem = {
  id: string;
  authorName: string;
  authorRole: string | null;
  authorPhotoUrl: string | null;
  quote: string;
  videoUrl: string | null;
  rating: number | null;
  sourceUrl?: string | null;
  sourceLabel?: string | null;
};

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function TestimonialsGrid({
  testimonials,
  eyebrow,
  title,
  subtitle,
  playLabel,
  viaLabel,
  className,
}: {
  testimonials: TestimonialItem[];
  eyebrow: string;
  title: string;
  subtitle?: string | null;
  playLabel: string;
  viaLabel: string;
  className?: string;
}) {
  if (testimonials.length === 0) return null;

  return (
    <section className={className ?? "mx-auto mt-16 max-w-6xl px-5 sm:px-8"}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
          {subtitle}
        </p>
      )}
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((t) => (
          <article
            key={t.id}
            className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm"
          >
            <div className="flex items-center gap-3">
              {t.authorPhotoUrl ? (
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full">
                  <Image
                    src={t.authorPhotoUrl}
                    alt={t.authorName}
                    fill
                    sizes="56px"
                    className="object-cover object-top"
                    referrerPolicy="no-referrer"
                  />
                  {t.videoUrl && (
                    <a
                      href={t.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={playLabel}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition-opacity hover:opacity-100"
                    >
                      <Play className="h-6 w-6" fill="currentColor" />
                    </a>
                  )}
                </div>
              ) : (
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 font-heading text-base font-bold text-primary"
                  aria-hidden
                >
                  {initialsOf(t.authorName)}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-heading text-sm font-bold">{t.authorName}</p>
                {t.authorRole && (
                  <p className="text-xs leading-5 text-muted-foreground">
                    {t.authorRole}
                  </p>
                )}
              </div>
            </div>
            {t.rating != null && (
              <div className="flex gap-0.5" aria-label={`${t.rating} out of 5`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < t.rating! ? "fill-warning-strong text-warning-strong" : "text-muted"
                    }`}
                  />
                ))}
              </div>
            )}
            <blockquote className="text-sm leading-6 text-foreground">
              &ldquo;{t.quote}&rdquo;
            </blockquote>
            {t.sourceUrl && t.sourceLabel && (
              <a
                href={t.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80"
              >
                {viaLabel} {t.sourceLabel}
                <span aria-hidden>&rarr;</span>
              </a>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
