-- Add title (salutation) column to contacts for formal invitation addressing.
-- Values: 'mr', 'mrs', 'ms', 'dr', 'prof', or custom text.

ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS title text;

COMMENT ON COLUMN public.contacts.title IS 'Salutation title: mr, mrs, ms, dr, prof, or custom text. Used in formal invitation emails.';
