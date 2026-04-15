-- =============================================================================
-- DBC Germany — Company Info (single-row config consumed by admin + public site)
-- Sections: legal / contact / brand / social / SEO / banking
-- Date: 2026-04-15
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.company_info (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),

  -- Legal (German Impressum)
  legal_name text NOT NULL DEFAULT 'DBC Germany',
  legal_form text,
  registered_address text,
  registered_postal_code text,
  registered_city text,
  registered_country text DEFAULT 'Germany',
  hrb_number text,
  hrb_court text,
  vat_id text,
  tax_id text,
  managing_directors text,
  responsible_person text,

  -- France entity (DBC France SAS)
  fr_legal_name text DEFAULT 'DBC France SAS',
  fr_siren text DEFAULT '940 839 145',
  fr_registered_address text DEFAULT '43 Avenue du Gros Chêne, Herblay-sur-Seine',

  -- Contact
  primary_email text NOT NULL DEFAULT 'info@dbc-germany.com',
  support_email text NOT NULL DEFAULT 'info@dbc-germany.com',
  press_email text NOT NULL DEFAULT 'jay@dbc-germany.com',
  phone text,
  office_address text DEFAULT 'Speditionstraße 15a, 40221 Düsseldorf',
  office_hours text,

  -- Brand
  brand_name text NOT NULL DEFAULT 'DBC Germany',
  brand_tagline_en text,
  brand_tagline_de text,
  brand_tagline_fr text,
  logo_light_url text,
  logo_dark_url text,
  logo_wordmark_url text,
  favicon_url text,
  og_default_image_url text,
  primary_color text DEFAULT '#c8102e',

  -- Social
  linkedin_url text,
  instagram_url text,
  facebook_url text,
  whatsapp_url text,
  youtube_url text,
  twitter_url text,

  -- SEO defaults (per locale)
  seo_title_en text,
  seo_title_de text,
  seo_title_fr text,
  seo_description_en text,
  seo_description_de text,
  seo_description_fr text,

  -- Banking
  bank_name text,
  account_holder text,
  iban text,
  bic text,

  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.company_info IS
  'Single-row company info consumed by admin UI, public marketing site (footer, Impressum, SEO defaults), and email templates.';

-- Seed the single row
INSERT INTO public.company_info (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Reuse the shared updated_at trigger
DROP TRIGGER IF EXISTS trg_company_info_updated_at ON public.company_info;
CREATE TRIGGER trg_company_info_updated_at
  BEFORE UPDATE ON public.company_info
  FOR EACH ROW EXECUTE FUNCTION public.news_posts_set_updated_at();

-- RLS: anyone can read (public site needs it), only admins can write
ALTER TABLE public.company_info ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "company_info_read_all" ON public.company_info;
CREATE POLICY "company_info_read_all"
  ON public.company_info FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "company_info_admin_write" ON public.company_info;
CREATE POLICY "company_info_admin_write"
  ON public.company_info FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );
