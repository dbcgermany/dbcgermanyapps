import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Card, Reveal } from "@dbc/ui";
import type { AboutSections } from "@dbc/types";

// All six DB-driven About sections live in one file — each is a small
// presentational block gated on its own content being present. Keeping
// them co-located makes edits easier and avoids a dozen import lines
// on the page. Each is a pure server component, zero client JS.

export function AboutMission({ data }: { data: AboutSections["mission"] }) {
  if (!data) return null;
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <h2 className="font-heading text-2xl font-bold sm:text-3xl">
            {data.title}
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            {data.body}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

export function AboutStory({ data }: { data: AboutSections["story"] }) {
  if (!data) return null;
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <h2 className="font-heading text-2xl font-bold sm:text-3xl">
            {data.title}
          </h2>
          <div className="mt-4 space-y-4 text-base leading-7 text-muted-foreground sm:text-lg">
            {data.body.split(/\n\s*\n/).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function AboutValues({ data }: { data: AboutSections["values"] }) {
  if (!data || data.items.length === 0) return null;
  return (
    <section className="py-16 sm:py-20 bg-muted/20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {data.title ? (
          <Reveal>
            <h2 className="text-center font-heading text-2xl font-bold sm:text-3xl">
              {data.title}
            </h2>
          </Reveal>
        ) : null}
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((v, i) => (
            <Reveal key={i} delay={Math.min(i, 5) * 60}>
              <Card padding="md" className="h-full">
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                    strokeWidth={2}
                  />
                  <div>
                    <p className="font-heading text-lg font-semibold">
                      {v.title}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {v.desc}
                    </p>
                  </div>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AboutProofNumbers({ data }: { data: AboutSections["metrics"] }) {
  if (!data || data.items.length === 0) return null;
  return (
    <section className="border-y border-border bg-muted/30">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-4 py-10 sm:grid-cols-4 sm:px-6 sm:py-12 lg:px-8">
        {data.items.map((m, i) => (
          <div key={i} className="text-center">
            <p className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              {m.value}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.15em] text-muted-foreground">
              {m.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function AboutPressStrip({ data }: { data: AboutSections["press"] }) {
  if (!data || data.logos.length === 0) return null;
  return (
    <section className="py-14 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {data.title ? (
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {data.title}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-8 sm:gap-12">
          {data.logos.map((p, i) => {
            const imgEl = (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.logoUrl}
                alt={p.name}
                className="h-8 w-auto opacity-70 grayscale transition-opacity hover:opacity-100 sm:h-10"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            );
            return p.href ? (
              <a
                key={i}
                href={p.href}
                target="_blank"
                rel="noopener"
                aria-label={p.name}
                className="inline-block"
              >
                {imgEl}
              </a>
            ) : (
              <span key={i} aria-label={p.name} className="inline-block">
                {imgEl}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function AboutFinalCta({
  data,
  fallback,
}: {
  data: AboutSections["finalCta"];
  fallback: { title: string; primaryCta: string; primaryCtaHref: string };
}) {
  const title = data?.title ?? fallback.title;
  const subtitle = data?.subtitle;
  const cta = data?.primaryCta ?? fallback.primaryCta;
  const href = data?.primaryCtaHref ?? fallback.primaryCtaHref;
  return (
    <section className="border-t border-border bg-gradient-to-b from-background via-muted/20 to-background">
      <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6 sm:py-18 lg:px-8">
        <h2 className="font-heading text-2xl font-bold leading-tight sm:text-3xl">
          {title}
        </h2>
        {subtitle ? (
          <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
        <div className="mt-6">
          <Link
            href={href}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-[1.02] active:scale-100"
          >
            {cta}
            <span aria-hidden className="ml-2">
              &rarr;
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
