import Link from "next/link";
import { SpeakerCard, type SpeakerCardData } from "./speaker-card";

export function SpeakersGrid({
  speakers,
  hrefBase,
  eyebrow,
  title,
  subtitle,
  viewLabel,
  ctaLabel,
  ctaHref,
}: {
  speakers: SpeakerCardData[];
  hrefBase: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  viewLabel: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  if (speakers.length === 0) return null;

  return (
    <section className="mx-auto mt-16 max-w-6xl px-5 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
          <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              {subtitle}
            </p>
          )}
        </div>
        {ctaLabel && ctaHref && (
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80"
          >
            {ctaLabel}
            <span aria-hidden>→</span>
          </Link>
        )}
      </div>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {speakers.map((speaker, i) => (
          <SpeakerCard
            key={speaker.slug}
            speaker={speaker}
            hrefBase={hrefBase}
            viewLabel={viewLabel}
            revealDelay={i * 50}
          />
        ))}
      </div>
    </section>
  );
}
