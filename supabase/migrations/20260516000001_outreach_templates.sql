-- =============================================================================
-- 20260516000001  outreach_templates
-- =============================================================================
-- Database-backed, admin-editable outreach pitch templates (sponsor / press /
-- speaker — extendable). Each row carries subject + body per locale (en/de/fr)
-- and a Reply-To pool address so the recipient's reply lands in the inbox the
-- right team staffs (sponsors@ / press@ / speakers@ …).
--
-- Why DB-stored:
--   • Copy churns weekly during outreach season; admin needs to tweak a
--     sentence without a deploy.
--   • Same `is_system` flag the contact_categories table uses — managers
--     can edit copy of seeded rows; only admins can delete or create rows.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.outreach_templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text UNIQUE NOT NULL,
  name        text NOT NULL,
  description text,
  reply_to    text NOT NULL,
  subject_en  text NOT NULL,
  subject_de  text NOT NULL,
  subject_fr  text NOT NULL,
  body_en     text NOT NULL,
  body_de     text NOT NULL,
  body_fr     text NOT NULL,
  is_system   boolean NOT NULL DEFAULT false,
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  -- Reply-To must be a syntactically valid email address.
  CONSTRAINT outreach_templates_reply_to_chk
    CHECK (reply_to ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$')
);

CREATE INDEX IF NOT EXISTS idx_outreach_templates_sort_order
  ON public.outreach_templates (sort_order, name);

COMMENT ON TABLE public.outreach_templates IS
  'Reusable outreach pitch templates the admin edits via /outreach/templates. Pulled into the per-contact compose dialog with variable interpolation. Replies route to per-template pool inboxes.';

COMMENT ON COLUMN public.outreach_templates.is_system IS
  'true = seeded by a migration; admin can edit copy but not delete the row.';

-- Auto-stamp updated_at on every UPDATE.
CREATE OR REPLACE FUNCTION public.outreach_templates_touch_updated_at()
  RETURNS trigger
  LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS outreach_templates_touch_updated_at ON public.outreach_templates;
CREATE TRIGGER outreach_templates_touch_updated_at
  BEFORE UPDATE ON public.outreach_templates
  FOR EACH ROW EXECUTE FUNCTION public.outreach_templates_touch_updated_at();

ALTER TABLE public.outreach_templates ENABLE ROW LEVEL SECURITY;

-- Managers can read templates so the compose dialog can pull them.
DROP POLICY IF EXISTS outreach_templates_read ON public.outreach_templates;
CREATE POLICY outreach_templates_read ON public.outreach_templates
  FOR SELECT
  USING (public.has_role('manager'));

-- Admins can insert / update / delete via the admin editor.
DROP POLICY IF EXISTS outreach_templates_write ON public.outreach_templates;
CREATE POLICY outreach_templates_write ON public.outreach_templates
  FOR ALL
  USING (public.has_role('admin'))
  WITH CHECK (public.has_role('admin'));

-- ---------------------------------------------------------------------------
-- Tag the existing contact_messages row with the template that produced it,
-- so the per-contact profile timeline can show "Sent: Sponsor pitch (DE) by
-- Jay on 2026-05-16" instead of just "Sent message".
-- ---------------------------------------------------------------------------
ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS template_slug text;

CREATE INDEX IF NOT EXISTS idx_contact_messages_template_slug
  ON public.contact_messages (template_slug)
  WHERE template_slug IS NOT NULL;

COMMENT ON COLUMN public.contact_messages.template_slug IS
  'Slug of the outreach_templates row used to generate this message (NULL for free-form sends).';
