import { formatMoney } from "@dbc/ui";

// The "was / now" anchor for a single tier. Render rule: only show
// the strikethrough + savings chip when originalPriceCents is a real
// number strictly greater than priceCents. Otherwise behave like the
// page did yesterday — one bold price, no chip. This keeps visual
// parity for tiers that don't have an anchor configured in admin.

export function PriceAnchor({
  priceCents,
  originalPriceCents,
  currency,
  locale,
  saveLabel,
}: {
  priceCents: number;
  originalPriceCents: number | null;
  currency: string;
  locale: string;
  saveLabel: string;
}) {
  const hasDiscount =
    originalPriceCents != null && originalPriceCents > priceCents;
  const savingsCents = hasDiscount
    ? (originalPriceCents as number) - priceCents
    : 0;

  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className="font-heading text-lg font-bold text-foreground">
        {formatMoney(priceCents, { currency, locale })}
      </span>
      {hasDiscount && (
        <>
          <span className="text-sm text-muted-foreground line-through">
            {formatMoney(originalPriceCents as number, { currency, locale })}
          </span>
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold leading-none text-emerald-700 dark:text-emerald-400">
            {saveLabel} {formatMoney(savingsCents, { currency, locale })}
          </span>
        </>
      )}
    </div>
  );
}
