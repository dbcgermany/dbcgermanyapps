-- =========================================================================
-- Dashboard ads — super-admin-only banner rotator at the top of /dashboard.
-- Trilingual copy + single image URL + optional CTA. Auto-scheduled via
-- starts_at / ends_at so ads can be queued in advance.
-- =========================================================================

CREATE TABLE IF NOT EXISTS dashboard_ads (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en        text NOT NULL,
  title_de        text,
  title_fr        text,
  subtitle_en     text,
  subtitle_de     text,
  subtitle_fr     text,
  cta_label_en    text,
  cta_label_de    text,
  cta_label_fr    text,
  cta_url         text,
  image_url       text NOT NULL,
  accent_color    text,              -- optional hex override for tint/gradient
  is_active       boolean NOT NULL DEFAULT true,
  sort_order      integer NOT NULL DEFAULT 0,
  starts_at       timestamptz,        -- null = always on
  ends_at         timestamptz,        -- null = never expires
  created_by      uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dashboard_ads_active_sort
  ON dashboard_ads (is_active, sort_order);

-- auto-bump updated_at on any row change
CREATE OR REPLACE FUNCTION dashboard_ads_touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS dashboard_ads_touch_updated_at ON dashboard_ads;
CREATE TRIGGER dashboard_ads_touch_updated_at
  BEFORE UPDATE ON dashboard_ads
  FOR EACH ROW
  EXECUTE FUNCTION dashboard_ads_touch_updated_at();

-- RLS: any authenticated staff can READ active, in-window ads (dashboard display);
-- only super_admin can write.
ALTER TABLE dashboard_ads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff read active dashboard_ads"   ON dashboard_ads;
DROP POLICY IF EXISTS "super_admin read all dashboard_ads" ON dashboard_ads;
DROP POLICY IF EXISTS "super_admin write dashboard_ads"   ON dashboard_ads;

-- Read path for every logged-in staff member (team_member+) who hits /dashboard.
CREATE POLICY "staff read active dashboard_ads" ON dashboard_ads
  FOR SELECT
  USING (
    is_active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at   IS NULL OR ends_at   >  now())
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('team_member','manager','admin','super_admin')
    )
  );

-- Super-admin sees everything (including drafts / expired) for management UI.
CREATE POLICY "super_admin read all dashboard_ads" ON dashboard_ads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

CREATE POLICY "super_admin write dashboard_ads" ON dashboard_ads
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );
