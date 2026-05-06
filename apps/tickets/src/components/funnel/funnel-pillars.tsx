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

export type FunnelPillar = {
  id: string;
  icon: string | null;
  title: string;
  description: string | null;
};

export function FunnelPillars({
  pillars,
  eyebrow,
  title,
}: {
  pillars: FunnelPillar[];
  eyebrow: string;
  title: string;
}) {
  if (pillars.length === 0) return null;

  return (
    <section className="mx-auto mt-16 max-w-6xl px-5 sm:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
        {title}
      </h2>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {pillars.map((p) => {
          const Icon = (p.icon && ICON_MAP[p.icon]) || Sparkles;
          return (
            <div
              key={p.id}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="font-heading text-lg font-bold leading-snug">
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
    </section>
  );
}
