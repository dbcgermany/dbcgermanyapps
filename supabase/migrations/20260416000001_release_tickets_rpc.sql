-- =============================================================================
-- Release reserved tickets back to inventory on reservation timeout.
-- Referenced by /api/cron/release-reservations but missing from schema until now.
-- Date: 2026-04-16
-- =============================================================================

DROP FUNCTION IF EXISTS public.release_tickets(uuid, integer);

CREATE OR REPLACE FUNCTION public.release_tickets(
  p_tier_id uuid,
  p_quantity integer
) RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.ticket_tiers
     SET quantity_sold = GREATEST(quantity_sold - COALESCE(p_quantity, 0), 0)
   WHERE id = p_tier_id;
$$;

GRANT EXECUTE ON FUNCTION public.release_tickets(uuid, integer) TO authenticated, service_role;
