-- Relax NO ACTION foreign keys to ON DELETE SET NULL so a hard-delete of
-- an auth user (via the new staff lifecycle admin features) doesn't get
-- blocked by stale ownership references. Matches the pattern already used
-- by tickets.checked_in_by and team_members.profile_id.
--
-- Authorship is preserved via audit_log entries written before the delete,
-- so dropping the FK pointer doesn't lose accountability — it loses only
-- the "who originally owned this row" hint.

alter table public.event_checklist_items
  drop constraint event_checklist_items_assigned_to_fkey,
  add  constraint event_checklist_items_assigned_to_fkey
    foreign key (assigned_to) references public.profiles(id) on delete set null;

alter table public.event_checklist_items
  drop constraint event_checklist_items_completed_by_fkey,
  add  constraint event_checklist_items_completed_by_fkey
    foreign key (completed_by) references public.profiles(id) on delete set null;

alter table public.event_expenses
  drop constraint event_expenses_created_by_fkey,
  add  constraint event_expenses_created_by_fkey
    foreign key (created_by) references public.profiles(id) on delete set null;

alter table public.event_sponsors
  drop constraint event_sponsors_created_by_fkey,
  add  constraint event_sponsors_created_by_fkey
    foreign key (created_by) references public.profiles(id) on delete set null;

alter table public.contact_category_links
  drop constraint contact_category_links_added_by_fkey,
  add  constraint contact_category_links_added_by_fkey
    foreign key (added_by) references public.profiles(id) on delete set null;

alter table public.orders
  drop constraint orders_buyer_id_fkey,
  add  constraint orders_buyer_id_fkey
    foreign key (buyer_id) references auth.users(id) on delete set null;

alter table public.tickets
  drop constraint tickets_buyer_id_fkey,
  add  constraint tickets_buyer_id_fkey
    foreign key (buyer_id) references auth.users(id) on delete set null;
