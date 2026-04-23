// Last-chance closer after the FAQ. Scrolls the visitor back up to the
// pricing section — by this point they've read the story, seen the
// numbers, moved past the objections, so a simple "ready? buy." works.
export function FunnelFinalCta({
  title,
  subtitle,
  primaryCta,
}: {
  title: string;
  subtitle?: string;
  primaryCta: string;
}) {
  return (
    <section className="border-t border-border bg-gradient-to-b from-background via-muted/20 to-background">
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
        <h2 className="font-heading text-3xl font-bold leading-tight sm:text-4xl">
          {title}
        </h2>
        {subtitle ? (
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            {subtitle}
          </p>
        ) : null}
        <div className="mt-8">
          <a
            href="#pricing"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-8 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-[1.02] active:scale-100"
          >
            {primaryCta}
            <span aria-hidden className="ml-2">
              &rarr;
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
