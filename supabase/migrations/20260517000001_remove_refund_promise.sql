-- =============================================================================
-- 20260517000001  remove_refund_promise
-- =============================================================================
-- Strips refund language from Richesses-2026 funnel copy after the policy was
-- corrected: DBC Germany does not offer refunds. Tickets are transferable via
-- the /transfer flow only, locked 7 days before the event.
--
-- Targets the three funnel rows (room, outcome, community) and:
--   1. Removes any bonus.items entry whose title mentions refunds (EN/DE/FR).
--   2. On the "outcome" funnel only, replaces the refund FAQ item with the
--      no-refunds-but-transferable answer (also EN/DE/FR).
--
-- Idempotent: filtering by current text lets the migration run safely twice.
-- =============================================================================

-- 1. Remove "Full refund until May 30" bonus card from all three funnels × all locales.
UPDATE public.funnels
SET
  content_en = jsonb_set(
    content_en,
    '{bonus,items}',
    COALESCE(
      (SELECT jsonb_agg(item ORDER BY ord)
       FROM jsonb_array_elements(content_en->'bonus'->'items')
            WITH ORDINALITY AS x(item, ord)
       WHERE COALESCE(item->>'title', '') !~* '(refund|r(ü|ue)ckerstatt|remboursement)'),
      '[]'::jsonb
    )
  ),
  content_de = jsonb_set(
    content_de,
    '{bonus,items}',
    COALESCE(
      (SELECT jsonb_agg(item ORDER BY ord)
       FROM jsonb_array_elements(content_de->'bonus'->'items')
            WITH ORDINALITY AS x(item, ord)
       WHERE COALESCE(item->>'title', '') !~* '(refund|r(ü|ue)ckerstatt|remboursement)'),
      '[]'::jsonb
    )
  ),
  content_fr = jsonb_set(
    content_fr,
    '{bonus,items}',
    COALESCE(
      (SELECT jsonb_agg(item ORDER BY ord)
       FROM jsonb_array_elements(content_fr->'bonus'->'items')
            WITH ORDINALITY AS x(item, ord)
       WHERE COALESCE(item->>'title', '') !~* '(refund|r(ü|ue)ckerstatt|remboursement)'),
      '[]'::jsonb
    )
  )
WHERE slug IN (
  'richesses-2026-room',
  'richesses-2026-outcome',
  'richesses-2026-community'
);

-- 2. Replace the "Refunds?" FAQ on the "outcome" funnel with the
--    no-refunds-but-transferable answer (EN/DE/FR).
UPDATE public.funnels
SET
  content_en = jsonb_set(
    content_en,
    '{faq,items}',
    COALESCE(
      (SELECT jsonb_agg(item ORDER BY ord)
       FROM jsonb_array_elements(content_en->'faq'->'items')
            WITH ORDINALITY AS x(item, ord)
       WHERE item->>'q' NOT IN ('Refunds?', 'Can I get my money back?')),
      '[]'::jsonb
    ) || '[{"q": "Can I get my money back?", "a": "Tickets are non-refundable. If your plans change, you can transfer your ticket to someone else through your account dashboard up to 7 days before the event."}]'::jsonb
  ),
  content_de = jsonb_set(
    content_de,
    '{faq,items}',
    COALESCE(
      (SELECT jsonb_agg(item ORDER BY ord)
       FROM jsonb_array_elements(content_de->'faq'->'items')
            WITH ORDINALITY AS x(item, ord)
       WHERE item->>'q' NOT IN ('Erstattung?', 'Kann ich mein Geld zurückbekommen?')),
      '[]'::jsonb
    ) || '[{"q": "Kann ich mein Geld zurückbekommen?", "a": "Tickets sind nicht erstattungsfähig. Wenn sich deine Pläne ändern, kannst du dein Ticket bis 7 Tage vor dem Event über dein Konto an jemand anderen übertragen."}]'::jsonb
  ),
  content_fr = jsonb_set(
    content_fr,
    '{faq,items}',
    COALESCE(
      (SELECT jsonb_agg(item ORDER BY ord)
       FROM jsonb_array_elements(content_fr->'faq'->'items')
            WITH ORDINALITY AS x(item, ord)
       WHERE item->>'q' NOT IN ('Remboursement ?', 'Puis-je me faire rembourser ?')),
      '[]'::jsonb
    ) || '[{"q": "Puis-je me faire rembourser ?", "a": "Les billets ne sont pas remboursables. Si tes plans changent, tu peux transférer ton billet à quelqu''un d''autre via ton compte jusqu''à 7 jours avant l''événement."}]'::jsonb
  )
WHERE slug = 'richesses-2026-outcome';

-- Smoke check: ensure no bonus.items still mentions refund language across all three locales.
DO $$
DECLARE
  v_remaining int;
BEGIN
  SELECT COUNT(*) INTO v_remaining
  FROM public.funnels f,
       LATERAL (
         SELECT item FROM jsonb_array_elements(f.content_en->'bonus'->'items') item
         UNION ALL
         SELECT item FROM jsonb_array_elements(f.content_de->'bonus'->'items') item
         UNION ALL
         SELECT item FROM jsonb_array_elements(f.content_fr->'bonus'->'items') item
       ) AS all_bonus(item)
  WHERE f.slug IN (
          'richesses-2026-room',
          'richesses-2026-outcome',
          'richesses-2026-community'
        )
    AND COALESCE(item->>'title', '') ~* '(refund|r(ü|ue)ckerstatt|remboursement)';

  IF v_remaining > 0 THEN
    RAISE EXCEPTION 'remove_refund_promise: % refund bonus item(s) still present after migration', v_remaining;
  END IF;
END $$;
