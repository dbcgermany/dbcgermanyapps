-- =============================================================================
-- Track where an order came from (door poster QR, newsletter, direct, ...).
-- Populated from the ?src= query param on checkout, falls back to NULL when
-- unknown. Used by per-event reports to measure channel conversion.
-- Date: 2026-04-17
-- =============================================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS source text;

CREATE INDEX IF NOT EXISTS idx_orders_source
  ON public.orders (source)
  WHERE source IS NOT NULL;

COMMENT ON COLUMN public.orders.source IS
  'Acquisition channel slug, e.g. door_poster, newsletter, direct. Null if unknown.';
