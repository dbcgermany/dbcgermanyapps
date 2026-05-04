-- Fix PGRST203 (multiple-choices) error on guest checkout.
--
-- Two copies of upsert_contact_from_checkout existed: the original 8-arg
-- version and a later 9-arg version that added p_extra_category_slugs for
-- bulk-invite CSV imports. PostgREST cannot choose between them when an
-- action calls with the named-arg subset shared by both, so every guest
-- checkout silently failed to upsert the buyer / attendee contact. The
-- ticket row was written with contact_id = NULL and downstream segmentation
-- (newsletter audiences, contact_event_involvements, sponsor invites)
-- had nothing to hook into.
--
-- Resolution: drop the older 8-arg overload. The 9-arg version covers the
-- same call sites because p_extra_category_slugs has a default of '{}'.

DROP FUNCTION IF EXISTS public.upsert_contact_from_checkout(
  text, text, text, text, date, text, text, text
);
