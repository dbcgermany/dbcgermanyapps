import Link from "next/link";
import { Reveal } from "@dbc/ui";

// Big, photo-backed hero with a single primary CTA. Designed for
// social-ad entry points — one clear value proposition, one action.
// Pure server component (no client deps). The wrapping link uses a
// #-anchor scroll so the page stays on-site.
export function FunnelHero({
  eyebrow,
  title,
  subtitle,
  primaryCta,
  primaryCtaHref,
  imageUrl,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCta: string;
  primaryCtaHref: string;
  imageUrl?: string;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-neutral-950 text-white">
      {imageUrl ? (
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-cover bg-center opacity-55"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
      ) : null}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/55 to-neutral-950"
      />
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-20 sm:px-6 sm:py-24 md:py-28 lg:px-8">
        <Reveal variant="fade-up">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
        </Reveal>
        <Reveal variant="fade-up" delay={80}>
          <h1 className="font-heading text-4xl font-bold leading-[1.05] sm:text-5xl md:text-6xl">
            {title}
          </h1>
        </Reveal>
        <Reveal variant="fade-up" delay={160}>
          <p className="max-w-2xl text-lg text-white/85 sm:text-xl">
            {subtitle}
          </p>
        </Reveal>
        <Reveal variant="fade-up" delay={240}>
          <Link
            href={primaryCtaHref}
            className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground shadow-lg shadow-black/30 transition-transform hover:scale-[1.02] active:scale-100"
          >
            {primaryCta}
            <span aria-hidden className="ml-2">
              &rarr;
            </span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
