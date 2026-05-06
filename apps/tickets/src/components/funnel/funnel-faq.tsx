export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export function FunnelFaq({
  faqs,
  eyebrow,
  title,
}: {
  faqs: FaqItem[];
  eyebrow: string;
  title: string;
}) {
  if (faqs.length === 0) return null;

  return (
    <section className="mx-auto mt-16 max-w-3xl px-5 sm:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
        {title}
      </h2>
      <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card shadow-sm">
        {faqs.map((f) => (
          <details key={f.id} className="group px-6 py-5">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-left font-heading text-base font-bold">
              <span>{f.question}</span>
              <span
                aria-hidden
                className="mt-1 shrink-0 text-primary transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
              {f.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
