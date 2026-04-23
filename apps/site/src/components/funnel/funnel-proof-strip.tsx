// Objective social proof — big numbers, small labels. Lives between
// hero and story beat; reassures the visitor this room is real before
// asking them to read the pitch.
export function FunnelProofStrip({
  items,
}: {
  items: { value: string; label: string }[];
}) {
  if (items.length === 0) return null;
  return (
    <section className="border-y border-border bg-muted/30">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-4 py-8 sm:grid-cols-4 sm:px-6 sm:py-10 lg:px-8">
        {items.map((it, i) => (
          <div key={i} className="text-center">
            <p className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              {it.value}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.15em] text-muted-foreground">
              {it.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
