-- EMERGENCY REVERT of 20260427000007_enable_rls_everywhere.sql.
--
-- Mistaken assumption: server-side createServerClient() using the
-- service_role key with @supabase/ssr would bypass RLS. It doesn't —
-- @supabase/ssr treats cookies as the session source and uses the
-- user's JWT for DB queries regardless of the api key passed, so every
-- server action ran as the authenticated user, hit RLS with no matching
-- policy, and got empty results (or a throw on .single()).
--
-- Restoring the pre-migration state so login + admin app work. We'll
-- re-apply RLS in a separate migration once per-table policies match
-- the requireRole() logic that code already enforces.

ALTER TABLE public.analytics_events            DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log                   DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_categories          DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_category_links      DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts                    DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons                     DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_checklist_items       DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_checklist_templates   DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_email_sequences       DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_expenses              DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_media                 DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_runsheet_items        DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_runsheet_templates    DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_schedule_items        DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_sponsors              DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events                      DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.incubation_applications     DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications            DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_offers                  DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_snapshots               DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_posts                  DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_sends            DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletters                 DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications               DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders                      DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles                    DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_event_assignments     DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members                DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_tiers                DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets                     DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist_entries            DISABLE ROW LEVEL SECURITY;

-- Drop the notifications policy we added (it's harmless without RLS but
-- no longer needed; will be recreated alongside the proper policy set).
DROP POLICY IF EXISTS "users see own notifications" ON public.notifications;
