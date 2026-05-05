-- Add two narrow event-ops roles between buyer and team_member:
--   • scanner    — door volunteer who only checks QR codes
--   • door_sales — walk-in cashier (door sale + scan)
--
-- Linear hierarchy is preserved; inclusion holds (scanner ⊂ door_sales ⊂ team_member).
-- Mirrors ROLE_HIERARCHY in packages/types/src/index.ts (now 7 levels: 0..6).

-- 1. Extend the enum. ALTER TYPE … ADD VALUE must run outside a transaction
--    block, but Supabase auto-wraps each migration; the IF NOT EXISTS guard
--    keeps it idempotent on re-run.
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'scanner' BEFORE 'team_member';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'door_sales' BEFORE 'team_member';

-- 2. Update has_role() to know about the new levels.
CREATE OR REPLACE FUNCTION public.has_role(p_min public.user_role)
  RETURNS boolean
  LANGUAGE sql
  SECURITY DEFINER
  STABLE
  SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
     WHERE p.id = auth.uid()
       AND (
         CASE p.role
           WHEN 'super_admin' THEN 6
           WHEN 'admin'       THEN 5
           WHEN 'manager'     THEN 4
           WHEN 'team_member' THEN 3
           WHEN 'door_sales'  THEN 2
           WHEN 'scanner'     THEN 1
           WHEN 'buyer'       THEN 0
         END
       ) >= (
         CASE p_min
           WHEN 'super_admin' THEN 6
           WHEN 'admin'       THEN 5
           WHEN 'manager'     THEN 4
           WHEN 'team_member' THEN 3
           WHEN 'door_sales'  THEN 2
           WHEN 'scanner'     THEN 1
           WHEN 'buyer'       THEN 0
         END
       )
  );
$$;

COMMENT ON FUNCTION public.has_role(public.user_role) IS
  'Returns true when the current auth.uid() profile has a role >= p_min. Mirrors ROLE_HIERARCHY from packages/types/src/index.ts (7 levels: buyer=0, scanner=1, door_sales=2, team_member=3, manager=4, admin=5, super_admin=6).';
