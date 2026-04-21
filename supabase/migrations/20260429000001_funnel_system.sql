-- =============================================================================
-- 20260429000001  funnel_system
-- =============================================================================
-- One dynamic funnel system. Admins CRUD rows from admin.dbc-germany.com;
-- the site app renders any row at dbc-germany.com/{locale}/f/{slug} via a
-- single dynamic route. Zero hardcoded funnels — every ad landing page the
-- client ships from here on is a row in this table.
--
-- Each row holds three JSONB content blobs (one per locale) that conform to
-- the FunnelContent type in packages/types/src/index.ts (hero / benefits /
-- faq / footerCta). The render path dispatches on cta_type to pick the
-- right terminal widget (external redirect, embedded wizard, contact form).
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.funnels (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text NOT NULL UNIQUE
                   CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  status          text NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft','published','archived')),
  cta_type        text NOT NULL
                   CHECK (cta_type IN ('external_link','incubation_wizard','contact_form')),
  -- Only meaningful when cta_type = 'external_link'. Ignored otherwise.
  cta_href        text,
  hero_image_url  text,
  -- Per-locale content. Empty {} falls back to en at render time.
  content_en      jsonb NOT NULL DEFAULT '{}'::jsonb,
  content_de      jsonb NOT NULL DEFAULT '{}'::jsonb,
  content_fr      jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- SEO overrides. NULL = auto-derive from content_*.hero.title / subtitle.
  seo_title       text,
  seo_description text,
  og_image_url    text,
  created_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  published_at    timestamptz
);

CREATE INDEX IF NOT EXISTS funnels_status_idx ON public.funnels(status);
CREATE INDEX IF NOT EXISTS funnels_slug_idx   ON public.funnels(slug);

-- Flat telemetry stream. One row per visitor interaction.
CREATE TABLE IF NOT EXISTS public.funnel_events (
  id            bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  funnel_id     uuid NOT NULL REFERENCES public.funnels(id) ON DELETE CASCADE,
  event_type    text NOT NULL
                  CHECK (event_type IN ('view','cta_click','conversion')),
  session_id    text NOT NULL,
  locale        text,
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  referrer      text,
  happened_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS funnel_events_funnel_happened_idx
  ON public.funnel_events(funnel_id, happened_at DESC);
CREATE INDEX IF NOT EXISTS funnel_events_type_idx
  ON public.funnel_events(event_type);
CREATE INDEX IF NOT EXISTS funnel_events_utm_source_idx
  ON public.funnel_events(funnel_id, utm_source);

-- updated_at trigger (match existing convention — cheap no-op function
-- already exists from earlier migrations, but declare here if missing).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'tg_set_updated_at'
  ) THEN
    CREATE FUNCTION public.tg_set_updated_at() RETURNS trigger
      LANGUAGE plpgsql AS $fn$
      BEGIN NEW.updated_at = now(); RETURN NEW; END;
    $fn$;
  END IF;
END $$;

DROP TRIGGER IF EXISTS funnels_set_updated_at ON public.funnels;
CREATE TRIGGER funnels_set_updated_at
  BEFORE UPDATE ON public.funnels
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- RLS
ALTER TABLE public.funnels       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;

-- Public reads only published rows; manager+ read + write everything.
DROP POLICY IF EXISTS "funnels public read published" ON public.funnels;
CREATE POLICY "funnels public read published"
  ON public.funnels FOR SELECT TO anon, authenticated
  USING (status = 'published' OR public.has_role('manager'));

DROP POLICY IF EXISTS "funnels manager write" ON public.funnels;
CREATE POLICY "funnels manager write"
  ON public.funnels FOR ALL TO authenticated
  USING (public.has_role('manager'))
  WITH CHECK (public.has_role('manager'));

-- Events: no direct public SELECT/INSERT. Ingestion is gated via the
-- insert_funnel_event RPC (SECURITY DEFINER) below; admins read via
-- the get_funnel_kpis RPC (also SECURITY DEFINER).
DROP POLICY IF EXISTS "funnel_events manager read" ON public.funnel_events;
CREATE POLICY "funnel_events manager read"
  ON public.funnel_events FOR SELECT TO authenticated
  USING (public.has_role('manager'));

CREATE OR REPLACE FUNCTION public.insert_funnel_event(
  p_funnel_id    uuid,
  p_event_type   text,
  p_session_id   text,
  p_locale       text,
  p_utm_source   text,
  p_utm_medium   text,
  p_utm_campaign text,
  p_referrer     text
) RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  IF p_event_type NOT IN ('view','cta_click','conversion') THEN
    RAISE EXCEPTION 'invalid event_type';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.funnels
    WHERE id = p_funnel_id AND status = 'published'
  ) THEN
    RAISE EXCEPTION 'funnel not published';
  END IF;
  INSERT INTO public.funnel_events (
    funnel_id, event_type, session_id, locale,
    utm_source, utm_medium, utm_campaign, referrer
  ) VALUES (
    p_funnel_id, p_event_type, p_session_id, p_locale,
    p_utm_source, p_utm_medium, p_utm_campaign, p_referrer
  );
END $$;

GRANT EXECUTE ON FUNCTION public.insert_funnel_event(
  uuid, text, text, text, text, text, text, text
) TO anon, authenticated;

-- Admin KPI aggregator. Returns { views, cta_clicks, conversions,
-- top_sources: [{source, clicks}] } for a funnel + window.
CREATE OR REPLACE FUNCTION public.get_funnel_kpis(
  p_funnel_id uuid,
  p_since     timestamptz DEFAULT (now() - interval '7 days')
) RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_views       bigint;
  v_cta_clicks  bigint;
  v_conversions bigint;
  v_top_sources jsonb;
BEGIN
  IF NOT public.has_role('manager') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT
    COUNT(*) FILTER (WHERE event_type = 'view'),
    COUNT(*) FILTER (WHERE event_type = 'cta_click'),
    COUNT(*) FILTER (WHERE event_type = 'conversion')
  INTO v_views, v_cta_clicks, v_conversions
  FROM public.funnel_events
  WHERE funnel_id = p_funnel_id
    AND happened_at >= p_since;

  SELECT COALESCE(jsonb_agg(row_to_jsonb(t) ORDER BY t.clicks DESC), '[]'::jsonb)
  INTO v_top_sources
  FROM (
    SELECT
      COALESCE(utm_source, '(direct)') AS source,
      COUNT(*) AS clicks
    FROM public.funnel_events
    WHERE funnel_id = p_funnel_id
      AND event_type = 'cta_click'
      AND happened_at >= p_since
    GROUP BY COALESCE(utm_source, '(direct)')
    ORDER BY COUNT(*) DESC
    LIMIT 10
  ) t;

  RETURN jsonb_build_object(
    'views',       v_views,
    'cta_clicks',  v_cta_clicks,
    'conversions', v_conversions,
    'top_sources', v_top_sources
  );
END $$;

GRANT EXECUTE ON FUNCTION public.get_funnel_kpis(uuid, timestamptz) TO authenticated;
