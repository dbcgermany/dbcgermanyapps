import Link from "next/link";

export function FunnelClosingCta({
  eyebrow,
  title,
  body,
  ctaHref,
  ctaLabel,
}: {
  eyebrow: string;
  title: string;
  body?: string | null;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <section className="mx-auto mt-20 max-w-4xl px-5 sm:px-8">
      <div className="overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 p-8 text-center shadow-sm sm:p-12">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {eyebrow}
        </p>
        <h2 className="mt-3 font-heading text-2xl font-bold leading-tight tracking-tight sm:text-4xl">
          {title}
        </h2>
        {body && (
          <p className="mx-auto mt-4 max-w-2xl whitespace-pre-wrap text-sm leading-7 text-foreground/80 sm:text-base">
            {body}
          </p>
        )}
        <div className="mt-8 flex justify-center">
          <Link
            href={ctaHref}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-lg sm:text-lg"
          >
            {ctaLabel}
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
