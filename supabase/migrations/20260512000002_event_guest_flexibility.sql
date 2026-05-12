-- Event guest infrastructure — flexible / per-event configurable.
--
-- The principle: tier flags + per-event tier references become the
-- configuration surface for everything (catering eligibility, team/companion
-- scanner badges, revenue counting, delegate program, etc.). Admin / super_admin
-- launch future events with different shapes by editing rows, not code.

-- 1. Tier flags — the heart of the flexibility model.
alter table public.ticket_tiers
  add column if not exists purpose text not null default 'public',
  add column if not exists catering_included boolean not null default false,
  add column if not exists is_team boolean not null default false,
  add column if not exists is_companion boolean not null default false,
  add column if not exists counts_as_sold boolean not null default true,
  add column if not exists scanner_badge_label text;

comment on column public.ticket_tiers.purpose is
  'public | vip | speaker | team_germany | team_external | companion | team_friend | press | other';
comment on column public.ticket_tiers.counts_as_sold is
  'false = excluded from sold-tickets + revenue counts. Used for comp / team / companion tiers.';
comment on column public.ticket_tiers.is_team is
  'true = scanner shows green TEAM badge.';
comment on column public.ticket_tiers.is_companion is
  'true = scanner shows muted COMPANION badge.';
comment on column public.ticket_tiers.catering_included is
  'true = tickets in this tier can submit catering selections.';

-- 2. Per-event configuration — admin picks which tier plays which role
-- + the broader event flexibility knobs.
alter table public.events
  add column if not exists team_invite_quota integer not null default 3,
  add column if not exists team_invite_tier_id uuid references public.ticket_tiers(id) on delete set null,
  add column if not exists chapter_delegate_tier_id uuid references public.ticket_tiers(id) on delete set null,
  add column if not exists chapter_companion_tier_id uuid references public.ticket_tiers(id) on delete set null,
  add column if not exists team_member_tier_id uuid references public.ticket_tiers(id) on delete set null,
  add column if not exists chapter_delegate_program_enabled boolean not null default true,
  add column if not exists catering_enabled boolean not null default false,
  add column if not exists delegate_review_notify_email text,
  -- Master switches
  add column if not exists door_sale_enabled boolean not null default true,
  add column if not exists coupons_enabled boolean not null default true,
  add column if not exists waitlist_enabled boolean not null default false,
  -- Ticket transfer policy
  add column if not exists ticket_transfer_enabled boolean not null default true,
  add column if not exists ticket_transfer_cutoff_hours integer not null default 24,
  -- Refund policy
  add column if not exists refund_policy_days integer not null default 14,
  add column if not exists refund_policy_text_de text,
  add column if not exists refund_policy_text_en text,
  add column if not exists refund_policy_text_fr text,
  -- Photo / video consent at checkout
  add column if not exists requires_photo_consent boolean not null default false,
  add column if not exists photo_consent_text_de text,
  add column if not exists photo_consent_text_en text,
  add column if not exists photo_consent_text_fr text,
  -- Email cadence
  add column if not exists reminder_emails_offsets_hours integer[] not null default '{168, 24, 2}',
  add column if not exists aftercare_emails_enabled boolean not null default true,
  -- Scanner / check-in window
  add column if not exists check_in_opens_minutes_before integer not null default 60,
  add column if not exists check_in_closes_minutes_after integer not null default 180,
  -- Overall venue capacity (in addition to per-tier caps)
  add column if not exists max_total_tickets integer,
  -- PDF + visual branding overrides
  add column if not exists ticket_pdf_hero_url text,
  add column if not exists funnel_brand_accent_hex text;

-- 3. Per-team-member quota override (rare — e.g. a manager gets 5 instead of 3).
create table if not exists public.event_team_member_quota_overrides (
  event_id uuid not null references public.events(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  quota integer not null check (quota >= 0),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  primary key (event_id, profile_id)
);

-- 4. Per-ticket override of tier-level catering eligibility (edge cases).
alter table public.tickets
  add column if not exists catering_eligible_override boolean,
  add column if not exists revoked_at timestamptz,
  add column if not exists revoked_by uuid references public.profiles(id) on delete set null,
  add column if not exists revocation_reason text;

comment on column public.tickets.catering_eligible_override is
  'null = inherit ticket_tier.catering_included; true = force on; false = force off.';
comment on column public.tickets.revoked_at is
  'When set, scanner refuses entry. Used by chapter-delegate revoke flow.';

-- 5. Track which team member owns each coupon (for revoke / display).
alter table public.coupons
  add column if not exists issued_to_profile_id uuid references public.profiles(id) on delete set null,
  add column if not exists purpose text;

comment on column public.coupons.purpose is
  'team_friend_invite | general | etc.';

-- 6. Chapter delegate + companion data on involvements.
-- Add missing enum values (Postgres requires per-value with `if not exists`).
alter type public.involvement_role add value if not exists 'chapter_delegate';
alter type public.involvement_role add value if not exists 'delegate_companion';
alter type public.involvement_role add value if not exists 'team_member_de';
alter type public.involvement_role add value if not exists 'team_member_external';

alter table public.contact_event_involvements
  add column if not exists chapter_country text,
  add column if not exists chapter_position text,
  add column if not exists companion_contact_id uuid references public.contacts(id) on delete set null,
  add column if not exists status text not null default 'active',
  add column if not exists submission_ip text,
  add column if not exists submission_metadata jsonb,
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists review_note text,
  add column if not exists chapter_lead_email text,
  add column if not exists chapter_lead_name text;

comment on column public.contact_event_involvements.status is
  'active | pending_approval | rejected | revoked. Chapter-delegate submissions land as pending_approval.';

create index if not exists idx_involvements_status
  on public.contact_event_involvements(status, event_id);
create index if not exists idx_involvements_companion
  on public.contact_event_involvements(companion_contact_id);
create index if not exists idx_involvements_chapter
  on public.contact_event_involvements(chapter_country, event_id);

-- 7. Catering (per-event menu + per-ticket selections).
do $$ begin
  if not exists (select 1 from pg_type where typname = 'catering_category') then
    create type public.catering_category as enum
      ('starter','main','dessert','drink_non_alcoholic','drink_alcoholic','snack');
  end if;
end $$;

create table if not exists public.catering_menu_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  category public.catering_category not null,
  name_en text not null,
  name_de text not null,
  name_fr text not null,
  description_en text,
  description_de text,
  description_fr text,
  is_vegetarian boolean default false,
  is_vegan boolean default false,
  is_halal boolean default false,
  allergens text[] default '{}',
  sort_order integer default 0,
  is_active boolean not null default true,
  max_selections_per_event integer,
  selections_count integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_catering_menu_event
  on public.catering_menu_items(event_id, sort_order);

create table if not exists public.ticket_catering_selections (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  menu_item_id uuid not null references public.catering_menu_items(id) on delete restrict,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (ticket_id, menu_item_id)
);
create index if not exists idx_ticket_catering_ticket
  on public.ticket_catering_selections(ticket_id);

-- Counter trigger: keep catering_menu_items.selections_count in sync so the
-- public catering page can show "X of Y remaining" without an aggregate query.
create or replace function public.tg_bump_catering_selection_count()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update public.catering_menu_items
       set selections_count = selections_count + 1,
           updated_at = now()
     where id = new.menu_item_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.catering_menu_items
       set selections_count = greatest(0, selections_count - 1),
           updated_at = now()
     where id = old.menu_item_id;
    return old;
  end if;
  return null;
end $$;

drop trigger if exists trg_catering_selection_count
  on public.ticket_catering_selections;
create trigger trg_catering_selection_count
  after insert or delete on public.ticket_catering_selections
  for each row execute function public.tg_bump_catering_selection_count();

-- 8. Enable RLS on the new tables. service_role bypasses; admin code uses it.
alter table public.event_team_member_quota_overrides enable row level security;
alter table public.catering_menu_items enable row level security;
alter table public.ticket_catering_selections enable row level security;
