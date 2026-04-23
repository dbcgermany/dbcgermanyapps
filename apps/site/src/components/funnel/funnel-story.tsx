import { Reveal } from "@dbc/ui";

// Three-beat problem → agitation → solution. The conversion arc every
// long-form sales page relies on. Copy lives in the funnel's content blob
// so each angle (authority / outcome / community) speaks its own language.
export function FunnelStory({
  problem,
  agitation,
  solution,
  labels,
}: {
  problem: string;
  agitation: string;
  solution: string;
  labels: { problem: string; agitation: string; solution: string };
}) {
  const beats: Array<{ tag: string; body: string }> = [
    { tag: labels.problem, body: problem },
    { tag: labels.agitation, body: agitation },
    { tag: labels.solution, body: solution },
  ];
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="space-y-10 sm:space-y-12">
        {beats.map((b, i) => (
          <Reveal key={i} variant="fade-up" delay={i * 80}>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                {b.tag}
              </p>
              <p className="mt-3 font-heading text-2xl font-semibold leading-snug sm:text-3xl">
                {b.body}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
