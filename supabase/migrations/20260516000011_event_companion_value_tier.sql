-- Per-event reference tier for chapter-delegate +1 companions.
-- Drives the value/price shown on the public register page AND the
-- access tier resolved at scan/catering time for companion tickets.
-- The +1 is still issued the operational chapter_companion_tier_id (free €0 tier).

alter table public.events
  add column if not exists chapter_companion_value_tier_id uuid
    references public.ticket_tiers(id) on delete set null;

comment on column public.events.chapter_companion_value_tier_id is
  'Per-event reference tier for chapter-delegate +1 companions. Display value + access flags inherit from this tier when set. NULL = behave as today.';
