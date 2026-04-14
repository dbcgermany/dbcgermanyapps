-- =============================================================================
-- DBC Germany — Editable site settings (single-row table)
-- Date: 2026-04-14
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.site_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  support_email text NOT NULL DEFAULT 'info@dbc-germany.com',
  press_email text NOT NULL DEFAULT 'jay@dbc-germany.com',
  maintenance_mode boolean NOT NULL DEFAULT false,
  maintenance_message_en text NOT NULL DEFAULT 'We''re back shortly.',
  maintenance_message_de text NOT NULL DEFAULT 'Wir sind gleich wieder da.',
  maintenance_message_fr text NOT NULL DEFAULT 'Nous revenons bientôt.',
  default_currency text NOT NULL DEFAULT 'EUR',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.site_settings IS
  'Single-row editable runtime settings. Admin dashboard writes; public site reads.';

-- Seed the single row if missing
INSERT INTO public.site_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

DROP TRIGGER IF EXISTS trg_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER trg_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.news_posts_set_updated_at();
