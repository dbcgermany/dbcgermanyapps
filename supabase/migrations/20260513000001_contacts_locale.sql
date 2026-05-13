-- =============================================================================
-- contacts.locale — store the contact's preferred language alongside their email
--
-- Why: today the locale they submitted on a public form (newsletter / contact /
-- job application / chapter-delegate form) is captured at the moment of the
-- confirmation email and then lost. The next outreach to that contact has no
-- stored preference, so the system has to fall back to country / 'en'. With
-- this column, resolveRecipientLocale (in @dbc/email/locale-resolver) can use
-- contacts.locale as a strong signal once any layer above it (profiles.locale,
-- orders.locale) hasn't already won.
--
-- Date: 2026-05-13
-- =============================================================================

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS locale text
    CHECK (locale IN ('en','de','fr'));

COMMENT ON COLUMN public.contacts.locale IS
  'Preferred language for outreach. Captured from the public-form URL prefix on first submission and never silently overwritten — only updated when the contact explicitly changes their preference.';

CREATE INDEX IF NOT EXISTS idx_contacts_locale
  ON public.contacts (locale)
  WHERE locale IS NOT NULL;
