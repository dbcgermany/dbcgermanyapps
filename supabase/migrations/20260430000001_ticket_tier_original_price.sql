-- Add an optional "regular price" column to ticket_tiers, used by the
-- tickets-app event page to render the classic was/now price anchor
-- (~~€349~~ €299 · Save €50). NULL means "no discount displayed",
-- which is today's behaviour — the tier card renders a single price.
--
-- The CHECK constraint prevents a negative discount. Writes that set
-- the original price below the current price are rejected at the DB
-- layer; the admin editor also surfaces an inline validation message
-- so operators see the error immediately instead of a 500.

ALTER TABLE public.ticket_tiers
  ADD COLUMN IF NOT EXISTS original_price_cents integer
    CHECK (original_price_cents IS NULL OR original_price_cents >= price_cents);

COMMENT ON COLUMN public.ticket_tiers.original_price_cents IS
  'Optional anchor price shown struck through next to the real price. NULL = no anchor. Must be >= price_cents.';
