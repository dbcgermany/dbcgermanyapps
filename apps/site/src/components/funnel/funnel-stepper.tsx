// Sticky progress rail shown above each wizard page. Segmented bar (one
// bead per visible step) + "Step X of N" counter. Visible steps can be
// fewer than the max 7 when the applicant skips the conditional idea /
// diaspora pages, which is why the active/total counts are both props.
export function FunnelStepper({
  current,
  total,
  label,
}: {
  current: number;
  total: number;
  label: string;
}) {
  const segments = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <div
      className="sticky top-[56px] z-30 border-b border-border bg-background/85 backdrop-blur"
      aria-label={label}
    >
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
        <div className="flex flex-1 items-center gap-1.5">
          {segments.map((n) => (
            <span
              key={n}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                n <= current ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
          {label}
        </span>
      </div>
    </div>
  );
}
