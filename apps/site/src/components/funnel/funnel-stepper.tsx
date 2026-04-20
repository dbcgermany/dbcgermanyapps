// Sticky progress rail above each wizard page. A single continuous bar
// that smooth-fills as the applicant advances, plus an "X of N" counter.
// The width transition is a pure CSS property so it animates for free
// whenever `current` changes.
export function FunnelStepper({
  current,
  total,
  label,
}: {
  current: number;
  total: number;
  label: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round((current / total) * 100)));
  return (
    <div
      className="sticky top-[56px] z-30 border-b border-border bg-background/85 backdrop-blur"
      aria-label={label}
    >
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
        <div
          className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={current}
        >
          <span
            className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
          {label}
        </span>
      </div>
    </div>
  );
}
