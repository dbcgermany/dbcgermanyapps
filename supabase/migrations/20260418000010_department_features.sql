-- Department-driven feature tables: checklist, expenses, sponsors, runsheet
-- Plus columns for reminders, sales targets, tax rate, feedback survey

-- 1. Event checklist templates (reusable defaults)
CREATE TABLE IF NOT EXISTS event_checklist_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL,
  description text,
  default_offset_days integer NOT NULL,
  estimated_cost_cents integer,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true
);

-- 2. Event checklist items (per-event, populated from templates)
CREATE TABLE IF NOT EXISTS event_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending',
  due_date date,
  estimated_cost_cents integer,
  actual_cost_cents integer,
  assigned_to uuid REFERENCES profiles(id),
  completed_at timestamptz,
  completed_by uuid REFERENCES profiles(id),
  notes text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 3. Event expenses
CREATE TABLE IF NOT EXISTS event_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'other',
  description text NOT NULL,
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  vendor_name text,
  vendor_contact text,
  paid_at timestamptz,
  receipt_url text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Event sponsors
CREATE TABLE IF NOT EXISTS event_sponsors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  contact_name text,
  contact_email text,
  contact_phone text,
  tier text NOT NULL DEFAULT 'partner',
  deal_value_cents integer DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  status text NOT NULL DEFAULT 'lead',
  logo_url text,
  website_url text,
  deliverables text,
  notes text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. Event run sheet items
CREATE TABLE IF NOT EXISTS event_runsheet_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  title text NOT NULL,
  description text,
  responsible_person text,
  location_note text,
  sort_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- 6. Additional columns
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;
ALTER TABLE events ADD COLUMN IF NOT EXISTS feedback_survey_url text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS sales_target_tickets integer;
ALTER TABLE events ADD COLUMN IF NOT EXISTS sales_target_revenue_cents integer;
ALTER TABLE company_info ADD COLUMN IF NOT EXISTS default_tax_rate_pct numeric(5,2) DEFAULT 19.00;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;

-- 7. Seed default checklist templates
INSERT INTO event_checklist_templates (title, category, default_offset_days, estimated_cost_cents, sort_order) VALUES
  ('Confirm venue booking', 'venue', -90, NULL, 10),
  ('Sign venue contract', 'venue', -60, NULL, 20),
  ('Venue walkthrough & technical check', 'venue', -14, NULL, 30),
  ('Design event cover image & poster', 'marketing', -60, 20000, 40),
  ('Write event description (EN/DE/FR)', 'marketing', -45, NULL, 50),
  ('Launch social media campaign', 'marketing', -30, NULL, 60),
  ('Send announcement newsletter', 'marketing', -14, NULL, 70),
  ('Final reminder newsletter', 'marketing', -3, NULL, 80),
  ('Book photographer', 'production', -30, 80000, 90),
  ('Book AV / sound equipment', 'production', -21, 50000, 100),
  ('Prepare signage & banners', 'production', -7, 15000, 110),
  ('Print badges / name tags', 'production', -5, 10000, 120),
  ('Set ticket prices & tiers', 'finance', -45, NULL, 130),
  ('Configure payment methods', 'finance', -30, NULL, 140),
  ('Confirm sponsor payments received', 'finance', -14, NULL, 150),
  ('Order catering', 'logistics', -21, 200000, 160),
  ('Arrange transport / parking', 'logistics', -14, NULL, 170),
  ('Prepare welcome packs', 'logistics', -3, 30000, 180),
  ('Recruit volunteers', 'staffing', -30, NULL, 190),
  ('Brief event team', 'staffing', -7, NULL, 200),
  ('Assign on-site roles', 'staffing', -3, NULL, 210),
  ('Finalize schedule & speakers', 'content', -14, NULL, 220),
  ('Brief speakers', 'content', -7, NULL, 230),
  ('Prepare presentations / slides', 'content', -3, NULL, 240)
ON CONFLICT DO NOTHING;
