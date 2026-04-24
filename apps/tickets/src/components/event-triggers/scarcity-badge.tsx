// Small pill shown next to a tier's price when capacity is known and
// the display-remaining count (policy-adjusted) is worth flagging.
// Three visual weights:
//   ≤ 5        → red + pulsing dot, "Hurry, only X left"
//   ≤ 25 %     → orange, "Only X left"
//   else       → muted, "X left"
// For unlimited tiers (capacity NULL) the event-triggers server action
// hands back displayRemaining=null, which we treat as "don't render".

const DOT = "h-1.5 w-1.5 shrink-0 rounded-full";

export function ScarcityBadge({
  displayRemaining,
  capacity,
  labels,
}: {
  displayRemaining: number | null;
  capacity: number | null;
  labels: { only: string; hurry: string; left: string };
}) {
  if (displayRemaining == null || capacity == null) return null;
  if (displayRemaining <= 0) return null; // "sold out" is the existing status badge's job

  const pctGone = 1 - displayRemaining / capacity;
  const critical = displayRemaining <= 5;
  const low = !critical && pctGone >= 0.75;

  const classes = critical
    ? "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400"
    : low
      ? "border-orange-500/40 bg-orange-500/10 text-orange-600 dark:text-orange-400"
      : "border-border bg-muted/50 text-muted-foreground";
  const dotClasses = critical
    ? `${DOT} animate-pulse bg-red-500`
    : low
      ? `${DOT} bg-orange-500`
      : `${DOT} bg-muted-foreground/50`;

  const prefix = critical ? labels.hurry : labels.only;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium leading-none ${classes}`}
    >
      <span aria-hidden className={dotClasses} />
      {prefix} {displayRemaining} {labels.left}
    </span>
  );
}
