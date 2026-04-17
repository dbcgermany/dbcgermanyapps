-- Job offers + job applications tables.
-- Job offers are managed in admin, published ones shown on dbc-germany.com/careers.
-- Applications submitted via the public careers form.

CREATE TABLE IF NOT EXISTS public.job_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en text NOT NULL,
  title_de text,
  title_fr text,
  description_en text NOT NULL,
  description_de text,
  description_fr text,
  requirements_en text,
  requirements_de text,
  requirements_fr text,
  location text NOT NULL DEFAULT 'Remote',
  employment_type text NOT NULL DEFAULT 'full_time',
  department text,
  is_published boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_offer_id uuid REFERENCES public.job_offers(id) ON DELETE SET NULL,
  applicant_name text NOT NULL,
  applicant_email text NOT NULL,
  applicant_phone text,
  cover_letter text,
  resume_url text,
  linkedin_url text,
  portfolio_url text,
  locale text DEFAULT 'en',
  status text DEFAULT 'new',
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.job_offers IS 'Admin-managed job postings. Published ones shown on dbc-germany.com/careers.';
COMMENT ON TABLE public.job_applications IS 'Applications submitted via the public careers page form.';
