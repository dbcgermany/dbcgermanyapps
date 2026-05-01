-- Per-tier low-stock alert threshold expressed as a percentage of max_quantity.
-- The /api/cron/low-inventory cron previously fired off a hard-coded 20-seat
-- threshold for every tier; this column lets each tier set its own % gate
-- (e.g. small VIP tiers want a higher % gate than the general-admission tier).
-- Sub-buckets at 100/50/25% of this value re-trigger the alert as inventory
-- keeps falling.

ALTER TABLE public.ticket_tiers
  ADD COLUMN IF NOT EXISTS low_stock_threshold_pct integer NOT NULL DEFAULT 20
    CHECK (low_stock_threshold_pct BETWEEN 1 AND 100);

COMMENT ON COLUMN public.ticket_tiers.low_stock_threshold_pct IS
  'Percent of max_quantity remaining at which the low-inventory cron fires. Sub-buckets at 100/50/25 percent of this threshold trigger re-notifications as inventory drops further.';
