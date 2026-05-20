-- =============================================================================
-- 20260520000001  ticket_tier_perks — structured headline + bullet list per tier
-- =============================================================================
-- The event-page sidebar shows each tier as one free-form sentence pulled from
-- description_{locale}. A visitor cannot scan "what's included" against price
-- — they have to read a paragraph, then guess what's different vs the next
-- tier up. The descriptions themselves had drifted: each ended with the
-- pre-launch price (€89/€169/€349) even though the live prices are
-- €49/€129/€299 after a launch discount.
--
-- Two new column types:
--
--   headline_{locale}  text       — short tagline under the price ("Everything
--                                   in Starter, plus a guaranteed seat close
--                                   to the stage.")
--   perks              jsonb      — { en: [], de: [], fr: [] } parallel
--                                   bullet lists ("Reserved premium seating,
--                                   close to the stage", …) rendered as a
--                                   checked <ul> in the sidebar.
--
-- Then seed the canonical copy for the three public Richesses 2026 tiers
-- (Starter / Premium / VIP). Premium intentionally has only two bullets:
-- "Everything in Starter" + "Reserved premium seating, close to the stage".
-- Per the user's clarification Premium has **no catering, no drinks, no
-- lunch** — the €80 step over Starter pays for a guaranteed close seat
-- instead of open seating. catering_included stays false on Premium.
--
-- VIP keeps catering_included = true and gets the hospitality bullets
-- (catering, champagne, drinks, front row, lounge).
--
-- description_{locale} is also refreshed to a tight one-liner so it no
-- longer contradicts the new bullets with stale prices.
-- =============================================================================

ALTER TABLE public.ticket_tiers
  ADD COLUMN IF NOT EXISTS headline_en text,
  ADD COLUMN IF NOT EXISTS headline_de text,
  ADD COLUMN IF NOT EXISTS headline_fr text,
  ADD COLUMN IF NOT EXISTS perks jsonb
    NOT NULL DEFAULT '{"en":[],"de":[],"fr":[]}'::jsonb;

-- Starter — €49 (was €89, save €40)
UPDATE public.ticket_tiers
SET
  headline_en = 'The full conference, your way.',
  headline_de = 'Die ganze Konferenz, ganz nach deinem Tempo.',
  headline_fr = 'Toute la conférence, à votre rythme.',
  description_en = 'Conference pass — all sessions.',
  description_de = 'Konferenzticket — alle Sessions.',
  description_fr = 'Billet conférence — toutes les sessions.',
  perks = jsonb_build_object(
    'en', jsonb_build_array(
      'Access to all keynotes, panels and masterclasses',
      'Starter Pack delivered with your ticket (goals worksheet, glossary, WhatsApp guide)',
      'Class of 2026 cohort + post-event WhatsApp channel',
      'Open seating'
    ),
    'de', jsonb_build_array(
      'Zugang zu allen Keynotes, Panels und Masterclasses',
      'Starter-Paket als PDF zum Ticket (Ziele-Workbook, Glossar, WhatsApp-Guide)',
      'Class of 2026 Cohort + Post-Event-WhatsApp-Kanal',
      'Freie Platzwahl'
    ),
    'fr', jsonb_build_array(
      'Accès à toutes les keynotes, panels et masterclasses',
      'Pack de démarrage en PDF avec votre billet (cahier d''objectifs, glossaire, guide WhatsApp)',
      'Promotion 2026 + canal WhatsApp post-événement',
      'Placement libre'
    )
  )
WHERE id = 'bc17a8c4-3c43-4341-ba8e-3b8d6be18050';

-- Premium — €129 (was €169, save €40) — seat upgrade only, no catering.
UPDATE public.ticket_tiers
SET
  headline_en = 'Everything in Starter, plus a guaranteed seat close to the stage.',
  headline_de = 'Alles aus Starter, plus garantierter Sitzplatz nah an der Bühne.',
  headline_fr = 'Tout le Starter, plus une place garantie près de la scène.',
  description_en = 'Starter + reserved premium seating, close to the stage.',
  description_de = 'Starter + reservierter Premium-Sitzplatz, nah an der Bühne.',
  description_fr = 'Starter + place Premium réservée, près de la scène.',
  perks = jsonb_build_object(
    'en', jsonb_build_array(
      'Everything in Starter',
      'Reserved premium seating, close to the stage'
    ),
    'de', jsonb_build_array(
      'Alles aus Starter',
      'Reservierter Premium-Sitzplatz, nah an der Bühne'
    ),
    'fr', jsonb_build_array(
      'Tout le Starter',
      'Place Premium réservée, près de la scène'
    )
  )
WHERE id = 'd088b479-7adf-4fd0-9e8a-d34109f9d7be';

-- VIP — €299 (was €349, save €50) — full hospitality.
UPDATE public.ticket_tiers
SET
  headline_en = 'Everything in Premium, plus full catering, drinks and lounge.',
  headline_de = 'Alles aus Premium, plus volles Catering, Getränke und VIP-Lounge.',
  headline_fr = 'Tout le Premium, plus la restauration complète, les boissons et le salon VIP.',
  description_en = 'Premium + catering, champagne, all drinks and VIP lounge.',
  description_de = 'Premium + Catering, Champagner, Getränke und VIP-Lounge.',
  description_fr = 'Premium + restauration, champagne, boissons et salon VIP.',
  perks = jsonb_build_object(
    'en', jsonb_build_array(
      'Everything in Premium',
      'Catering — main course of your choice',
      'Champagne reception',
      'All drinks included throughout the day',
      'Front-row reserved seating',
      'VIP lounge access between sessions'
    ),
    'de', jsonb_build_array(
      'Alles aus Premium',
      'Catering — Hauptgericht zur Auswahl',
      'Champagner-Empfang',
      'Getränke den ganzen Tag inklusive',
      'Front-Row-Sitzplatz',
      'VIP-Lounge-Zugang zwischen den Sessions'
    ),
    'fr', jsonb_build_array(
      'Tout le Premium',
      'Restauration — plat principal au choix',
      'Réception au champagne',
      'Boissons incluses toute la journée',
      'Place réservée au premier rang',
      'Accès au salon VIP entre les sessions'
    )
  )
WHERE id = '7ecfc999-05c1-4922-beb5-c232fe9da7e8';
