-- app_secrets: super-admin managed application secrets (API keys, etc.)
-- Managed via the admin dashboard rather than requiring a Vercel redeploy
-- to rotate. Role enforcement is handled at the server-action layer
-- (requireRole("super_admin")) — consistent with the rest of the admin app.

create table if not exists public.app_secrets (
  key text primary key,
  value text not null,
  note text,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

comment on table public.app_secrets is
  'Application-level secrets (API keys, provider tokens). Super-admin only.';
comment on column public.app_secrets.key is
  'Canonical key name, e.g. ANTHROPIC_API_KEY, RESEND_API_KEY';
comment on column public.app_secrets.value is
  'The secret value. Stored plain in DB — access is gated at the action layer.';

-- Index lookups already O(1) on PK; no additional indexes needed.

-- Auto-update updated_at on write.
create or replace function public.set_app_secret_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists app_secrets_set_updated_at on public.app_secrets;
create trigger app_secrets_set_updated_at
  before update on public.app_secrets
  for each row
  execute function public.set_app_secret_updated_at();
