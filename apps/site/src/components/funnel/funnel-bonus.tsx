import { CheckCircle2 } from "lucide-react";

// "What's included beyond the ticket." Post-pricing reassurance block:
// cohort access, post-event WhatsApp, refund window. Handles the common
// objection — "is the ticket really worth it?" — before the FAQ has to.
export function FunnelBonus({
  title,
  items,
}: {
  title: string;
  items: { title: string; desc: string }[];
}) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="rounded-2xl border border-border bg-muted/30 p-6 sm:p-8">
        <h2 className="font-heading text-xl font-bold sm:text-2xl">{title}</h2>
        <ul className="mt-6 space-y-4">
          {items.map((item, i) => (
            <li key={i} className="flex gap-3">
              <CheckCircle2
                className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                strokeWidth={2}
              />
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                  {item.desc}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
