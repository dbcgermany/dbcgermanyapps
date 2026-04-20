import { Reveal } from "@dbc/ui";

// Grid of benefit / pillar cards. For the incubation funnel this renders
// the seven DBC pillars (incubation, courses, investments, mentorship,
// events, e-learning, consulting) so applicants know the full catalogue
// before they choose on Page 5 of the wizard.
export function FunnelBenefits({
  eyebrow,
  title,
  items,
}: {
  eyebrow: string;
  title: string;
  items: { key: string; title: string; desc: string }[];
}) {
  return (
    <section className="bg-background py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal variant="fade-up">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
        </Reveal>
        <Reveal variant="fade-up" delay={80}>
          <h2 className="mt-3 font-heading text-3xl font-bold leading-tight sm:text-4xl">
            {title}
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, idx) => (
            <Reveal key={item.key} variant="fade-up" delay={80 * (idx % 3)}>
              <article className="h-full rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
                <h3 className="font-heading text-lg font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.desc}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
