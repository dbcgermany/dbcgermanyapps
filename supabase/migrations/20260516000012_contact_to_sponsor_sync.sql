-- Cascade contact-profile edits to denormalized event_sponsors columns.
-- Without this trigger, editing first_name/last_name/email/phone on a contact's
-- profile leaves stale data in event_sponsors and the sponsor admin view shows
-- the old manager's data even after the contact profile is updated.

create or replace function public.sync_contact_to_event_sponsors()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.first_name is distinct from old.first_name
     or new.last_name is distinct from old.last_name
     or new.email is distinct from old.email
     or new.phone is distinct from old.phone then
    update public.event_sponsors
       set contact_first_name = new.first_name,
           contact_last_name  = new.last_name,
           contact_email      = coalesce(new.email, contact_email),
           contact_phone      = coalesce(new.phone, contact_phone)
     where contact_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists contacts_sync_to_event_sponsors on public.contacts;
create trigger contacts_sync_to_event_sponsors
after update on public.contacts
for each row
execute function public.sync_contact_to_event_sponsors();

comment on function public.sync_contact_to_event_sponsors() is
  'Pushes contact-profile edits (first_name, last_name, email, phone) into denormalized event_sponsors columns. Coalesces email/phone to preserve existing values when new is NULL.';
