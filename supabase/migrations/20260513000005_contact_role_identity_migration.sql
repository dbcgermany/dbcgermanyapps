-- Disambiguate Category vs. Event Role.
--
-- Categories answer "who is this person, durable, across all events?"
-- (founder, investor, mentor, partners, press, …).
-- Event roles answer "what are they doing at THIS event?"
-- (attendee, speaker, moderator, volunteer, staff, contractor, vip, …).
--
-- Today the two overlap on `sponsor` / `partner` / `press`. The UI filter
-- treats those as identities (via the CATEGORY_TO_ROLES bridge) but the
-- enum still carries them as event-bound roles. This migration normalises
-- by backfilling every legacy (sponsor|partner|press) involvement row
-- into the corresponding `contact_category_links` identity, so the
-- category bucket becomes the canonical filter point. Involvement rows
-- are LEFT in place — they still record what the contact did at a
-- specific event, which is useful per-event detail.

INSERT INTO public.contact_category_links (contact_id, category_id, added_at)
SELECT DISTINCT
       inv.contact_id,
       cat.id,
       now()
  FROM public.contact_event_involvements inv
  JOIN public.contact_categories cat
    ON cat.slug = CASE
         WHEN inv.role IN ('sponsor', 'partner') THEN 'partners'
         WHEN inv.role = 'press'                 THEN 'press'
         ELSE NULL
       END
 WHERE inv.role IN ('sponsor', 'partner', 'press')
ON CONFLICT (contact_id, category_id) DO NOTHING;
