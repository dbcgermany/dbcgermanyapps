-- Upgrades to event_expenses for proper budget tracking:
-- 1. due_date         — the planned 'échéance' so we can flag overdue lines
-- 2. provider_contact_id — link to a service provider in the contacts table
-- 3. description_en/_de/_fr — trilingual descriptions like every other content table
-- 4. notes            — free-text operator notes (e.g. negotiation status)
--
-- paid_at keeps its real meaning: timestamp when the expense was actually paid.
-- The new due_date is the planned deadline. Together they let the UI flag
-- overdue / due-soon / paid / scheduled lines.

ALTER TABLE public.event_expenses
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS provider_contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS description_de text,
  ADD COLUMN IF NOT EXISTS description_fr text,
  ADD COLUMN IF NOT EXISTS notes text;

-- Partial index for the "what's overdue?" query path.
CREATE INDEX IF NOT EXISTS event_expenses_due_unpaid_idx
  ON public.event_expenses (event_id, due_date)
  WHERE paid_at IS NULL;

-- New contact category so the provider picker on the budget page can
-- filter contacts down to known service providers (hotels, caterers,
-- printers, AV crews, etc.). Existing pattern: contacts can carry many
-- categories via contact_category_links — we don't migrate any contacts
-- here, that's an operator task.
INSERT INTO public.contact_categories
  (slug, name_en, name_de, name_fr, description_en, is_system, sort_order, color)
VALUES
  ('service_providers', 'Service Providers', 'Dienstleister', 'Prestataires',
   'Vendors and contractors that supply event services (venue, catering, AV, transport, hotels).',
   true, 75, '#7f5af0')
ON CONFLICT (slug) DO NOTHING;
