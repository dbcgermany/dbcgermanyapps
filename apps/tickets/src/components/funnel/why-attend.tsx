import Link from "next/link";
import {
  Award,
  Briefcase,
  GraduationCap,
  Handshake,
  Lightbulb,
  Mic,
  Network,
  Rocket,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  award: Award,
  briefcase: Briefcase,
  "graduation-cap": GraduationCap,
  handshake: Handshake,
  lightbulb: Lightbulb,
  mic: Mic,
  network: Network,
  rocket: Rocket,
  sparkles: Sparkles,
  star: Star,
  target: Target,
  "trending-up": TrendingUp,
  trophy: Trophy,
  users: Users,
};

export type WhyAttendPillar = {
  id: string;
  icon: string | null;
  title: string;
  description: string | null;
};

// The "ad block" right after the hero. Carries the conversion frame the
// info card cannot: eyebrow → big headline → emotional subhead → 4 benefit
// cards → primary CTA + urgency line. Visually loud (gradient surface,
// large type, prominent CTA) so the visitor reads the pitch before they
// scroll into the practical info card.
export function WhyAttend({
  eyebrow,
  headline,
  subhead,
  pillars,
  ctaHref,
  ctaLabel,
  urgencyLine,
}: {
  eyebrow: string;
  headline: string;
  subhead: string | null;
  pillars: WhyAttendPillar[];
  ctaHref: string;
  ctaLabel: string;
  urgencyLine?: string | null;
}) {
  const hasPillars = pillars.length > 0;

  return (
    <section className="mx-auto mt-8 max-w-6xl px-5 sm:mt-10 sm:px-8">
      <div className="overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 p-6 shadow-sm sm:p-10 lg:p-14">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {eyebrow}
        </p>
        <h2 className="mt-3 max-w-3xl text-balance font-heading text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
          {headline}
        </h2>
        {subhead && (
          <p className="mt-5 max-w-3xl whitespace-pre-wrap text-base leading-7 text-foreground/80 sm:text-lg sm:leading-8">
            {subhead}
          </p>
        )}

        {hasPillars && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map((p) => {
              const Icon = (p.icon && ICON_MAP[p.icon]) || Sparkles;
              return (
                <div
                  key={p.id}
                  className="flex flex-col gap-3 rounded-2xl border border-border bg-background/80 p-5 shadow-sm backdrop-blur"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-heading text-base font-bold leading-snug">
                    {p.title}
                  </h3>
                  {p.description && (
                    <p className="text-sm leading-6 text-muted-foreground">
                      {p.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-4 sm:mt-10">
          <Link
            href={ctaHref}
            className="animate-wiggle-cta inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-lg sm:text-lg"
          >
            {ctaLabel}
            <span aria-hidden>→</span>
          </Link>
          {urgencyLine && (
            <span className="text-sm text-muted-foreground">{urgencyLine}</span>
          )}
        </div>
      </div>
    </section>
  );
}
