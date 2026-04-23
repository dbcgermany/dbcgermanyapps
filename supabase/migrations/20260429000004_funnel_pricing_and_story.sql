-- =============================================================================
-- 20260429000004  funnel_pricing_and_story
-- =============================================================================
-- Lets a funnel optionally link to an event. When linked, the renderer
-- swaps its "external_link button" flow for a full conversion page with
-- countdown, 3-tier pricing, and per-tier buttons that deep-link into
-- /checkout/[event_slug]?tier=X — skipping the event landing page.
--
-- The story/proof/bonus/finalCta content sections are additive: they
-- live in the existing content_{en,de,fr} JSONB, validated in TS via
-- the FunnelContent SSOT type. No schema change needed for them.
-- =============================================================================

ALTER TABLE public.funnels
  ADD COLUMN IF NOT EXISTS linked_event_id uuid
    REFERENCES public.events(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS funnels_linked_event_idx
  ON public.funnels(linked_event_id);

COMMENT ON COLUMN public.funnels.linked_event_id IS
  'Optional event this funnel sells tickets for. When set, the /f/[slug] renderer shows a pricing table pulled from public.ticket_tiers and CTAs deep-link to /checkout/[event_slug]?tier=X.';
