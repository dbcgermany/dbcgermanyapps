-- Close the critical RLS gap: 31 tables had RLS DISABLED while the public
-- `anon` role kept default INSERT/SELECT/UPDATE/DELETE/TRUNCATE grants.
-- Anyone with NEXT_PUBLIC_SUPABASE_ANON_KEY (every client bundle) could
-- hit /rest/v1/{table} directly and read/modify orders, tickets, contacts,
-- profiles, audit_log, events, coupons, and 24 more.
--
-- Fix: enable RLS on every remaining public table. With RLS on and no
-- policies, the default is implicit-deny for anon + authenticated.
-- service_role bypasses RLS automatically, and all three apps (admin,
-- tickets, site) do their Next.js server-side DB reads using
-- SUPABASE_SERVICE_ROLE_KEY via packages/supabase/src/server-client.ts
-- — so this migration does not break any server path.
--
-- The ONLY client-side table read in any app is notification-bell.tsx,
-- which subscribes to realtime INSERT events on `notifications` via the
-- browser anon client. A scoped "user sees own notifications" policy is
-- added below so that stays working. All other client-side Supabase
-- usage is auth flows (signIn / MFA) which don't touch public tables.

-- =============================================================================
-- Enable RLS on every public table that doesn't have it yet
-- =============================================================================
ALTER TABLE public.analytics_events            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_categories          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_category_links      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_checklist_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_checklist_templates   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_email_sequences       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_expenses              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_media                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_runsheet_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_runsheet_templates    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_schedule_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_sponsors              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incubation_applications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_offers                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_snapshots               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_posts                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_sends            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletters                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_event_assignments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_tiers                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist_entries            ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- notifications realtime: authenticated users see their own rows
-- =============================================================================
-- The admin notification-bell subscribes via the browser anon client with the
-- user's JWT. Supabase realtime requires RLS + a SELECT policy that matches
-- the filter. Without this policy the dropdown would go silent.
DROP POLICY IF EXISTS "users see own notifications" ON public.notifications;
CREATE POLICY "users see own notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
