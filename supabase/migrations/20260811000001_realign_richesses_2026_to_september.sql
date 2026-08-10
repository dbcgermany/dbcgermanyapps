-- Realign every date-bearing row of Richesses d'Afrique MasterClass Germany
-- 2026 from the original 13 June slot to the actual 5 September slot.
--
-- The `events.starts_at` column was moved to 2026-09-05 at some point, but
-- three things were left behind on the old date:
--
--   1. the funnel / description copy (EN, DE, FR) still sold "13 June",
--      including the text Next.js renders into <meta description> and
--      og:description — so search results and link previews advertised a
--      date the countdown on the same page contradicted;
--   2. the 21 rows of `event_runsheet_items`, which carry both the internal
--      runsheet and — through the `event_schedule_items` view, which selects
--      the is_public rows — the public agenda block on the event page.
--
-- Copy is fixed with replace() rather than rewritten, so only the date token
-- changes and every other word stays exactly as authored. Timestamps are
-- shifted by the delta between the old and new event day (84 days) instead
-- of a hardcoded date, so the time-of-day of each item is preserved. Both
-- days fall inside CEST, so no DST correction is needed.
--
-- Idempotent: replace() finds nothing on a second run, and the timestamp
-- updates are scoped to rows still sitting on the old day.

do $$
declare
  v_event_id uuid;
  v_delta    int;
begin
  select id, (starts_at::date - date '2026-06-13')
    into v_event_id, v_delta
    from public.events
   where slug = 'richesses-dafrique-germany-2026';

  if v_event_id is null then
    raise notice 'event not found — nothing to realign';
    return;
  end if;

  if v_delta = 0 then
    raise notice 'event still sits on 2026-06-13 — refusing to shift';
    return;
  end if;

  -- 1. Copy: swap the localised date token only.
  update public.events
     set funnel_intro_en   = replace(funnel_intro_en,   '13 June',  '5 September'),
         funnel_closing_en = replace(funnel_closing_en, '13 June',  '5 September'),
         description_en    = replace(description_en,    '13 June',  '5 September'),
         funnel_intro_de   = replace(funnel_intro_de,   '13. Juni', '5. September'),
         funnel_closing_de = replace(funnel_closing_de, '13. Juni', '5. September'),
         description_de    = replace(description_de,    '13. Juni', '5. September'),
         funnel_intro_fr   = replace(funnel_intro_fr,   '13 juin',  '5 septembre'),
         funnel_closing_fr = replace(funnel_closing_fr, '13 juin',  '5 septembre'),
         description_fr    = replace(description_fr,    '13 juin',  '5 septembre'),
         updated_at        = now()
   where id = v_event_id;

  -- 2. Runsheet — this also moves the public agenda, which is the
  --    `event_schedule_items` view over the is_public rows of this table.
  update public.event_runsheet_items
     set starts_at  = starts_at + make_interval(days => v_delta),
         ends_at    = ends_at   + make_interval(days => v_delta),
         updated_at = now()
   where event_id = v_event_id
     and starts_at::date = date '2026-06-13';

  -- 3. The three published funnel landing pages. Their bodies are jsonb, so
  --    the swap runs over the serialised text and is cast back. The EN copy
  --    writes the date as "June 13", the DE/FR copy as "13. Juni"/"13 juin".
  update public.funnels
     set content_en      = replace(content_en::text, 'June 13',  'September 5')::jsonb,
         content_de      = replace(content_de::text, '13. Juni', '5. September')::jsonb,
         content_fr      = replace(content_fr::text, '13 juin',  '5 septembre')::jsonb,
         seo_description = replace(
                             replace(
                               replace(seo_description, 'June 13', 'September 5'),
                               '13. Juni', '5. September'),
                             '13 juin', '5 septembre'),
         updated_at      = now()
   where slug in (
           'richesses-2026-community',
           'richesses-2026-outcome',
           'richesses-2026-room'
         );
end $$;

-- Deliberately NOT touched:
--   · news_posts — four articles published on 2026-06-05 reference the then-
--     current June date. They are dated editorial, not live sales copy;
--     rewriting them would falsify the archive. Whether to amend or append a
--     correction is the editor's call.
--   · audit_log, contact_messages — historical records. Never rewritten.
