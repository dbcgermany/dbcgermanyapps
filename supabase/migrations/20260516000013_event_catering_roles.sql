-- Add 'institutional_guest' role to involvement_role enum (additive, opt-in).
alter type public.involvement_role add value if not exists 'institutional_guest';

-- Per-event list of involvement roles that grant catering access regardless
-- of ticket tier. Empty by default — admin opts in explicitly per event.
-- Resolved at catering-form load, invitation email build, and scan time.
alter table public.events
  add column if not exists catering_eligible_roles public.involvement_role[]
    not null default '{}'::public.involvement_role[];

comment on column public.events.catering_eligible_roles is
  'Per-event list of involvement roles that grant catering access regardless of ticket tier. Empty = tier+override only (current behavior). Admin-editable per event.';
