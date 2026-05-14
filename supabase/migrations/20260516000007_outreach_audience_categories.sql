-- =============================================================================
-- 20260516000007  outreach_audience_categories
-- =============================================================================
-- Adds the 5 contact-category slugs needed to segment the 9 outreach audiences
-- in the v6 template pack (sponsor_pitch, press_pitch, speaker_pitch,
-- institutional_bodies, chambers_of_commerce, investors, diaspora_associations,
-- corporates, vips_and_protocol).
--
-- Mapping (audience → existing or new category):
--   sponsor_pitch          → partners              (sponsors = partners, same bucket; existing)
--   press_pitch            → press                 (existing)
--   speaker_pitch          → speakers              ← NEW
--   institutional_bodies   → institutional_bodies  ← NEW
--   chambers_of_commerce   → chambers_of_commerce  ← NEW
--   investors              → investors             (existing)
--   diaspora_associations  → diaspora              (existing — community bucket covers associations)
--   corporates             → corporates            ← NEW
--   vips_and_protocol      → vips_and_protocol     ← NEW
--
-- Brand voice: masculine generic in DE/FR (Sprecher not Sprecher:innen,
-- Intervenants not Intervenant·e·s) — diverges from the existing seed which
-- used inclusive forms, but matches the locked brand-voice rule for all new
-- content shipping from May 2026 onwards.
--
-- ON CONFLICT (slug) DO NOTHING — re-runs are no-ops; admin label edits made
-- via the contacts UI are preserved.
-- =============================================================================

INSERT INTO public.contact_categories
  (slug, name_en, name_de, name_fr, description_en, is_system, sort_order, color)
VALUES
  ('speakers',
   'Speakers',
   'Sprecher',
   'Intervenants',
   'Confirmed and prospect speakers for DBC events.',
   true, 110, '#1f6feb'),
  ('institutional_bodies',
   'Institutional bodies',
   'Institutionen',
   'Institutions',
   'Ministries, embassies, multilaterals, development agencies.',
   true, 120, '#0b5394'),
  ('chambers_of_commerce',
   'Chambers of commerce',
   'Handelskammern',
   'Chambres de commerce',
   'IHKs, AHKs, bilateral chambers.',
   true, 130, '#674ea7'),
  ('corporates',
   'Corporates',
   'Konzerne',
   'Grands groupes',
   'DAX/MDAX-listed and Mittelstand corporates with Africa interest.',
   true, 140, '#b45f06'),
  ('vips_and_protocol',
   'VIPs & protocol',
   'VIPs & Protokoll',
   'VIP et protocole',
   'Government officials, heads of state, ambassadors, high-protocol guests.',
   true, 150, '#cc0000')
ON CONFLICT (slug) DO NOTHING;
