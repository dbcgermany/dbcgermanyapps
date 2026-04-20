-- Phase E: shared RLS helper so policies can stop inlining
--   role IN ('manager','admin','super_admin')
-- (the same ROLE_HIERARCHY lives in packages/types/src/index.ts).
--
-- This migration only ADDS the function. Existing policies keep their
-- inline role lists and are untouched — a future migration can convert
-- them opportunistically. Blast radius: zero, since nothing calls this
-- function yet.

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
           WHEN 'super_admin' THEN 4
           WHEN 'admin'       THEN 3
           WHEN 'manager'     THEN 2
           WHEN 'team_member' THEN 1
           WHEN 'buyer'       THEN 0
         END
       ) >= (
         CASE p_min
           WHEN 'super_admin' THEN 4
           WHEN 'admin'       THEN 3
           WHEN 'manager'     THEN 2
           WHEN 'team_member' THEN 1
           WHEN 'buyer'       THEN 0
         END
       )
  );
$$;

COMMENT ON FUNCTION public.has_role(public.user_role) IS
  'Returns true when the current auth.uid() profile has a role >= p_min. Mirrors ROLE_HIERARCHY from packages/types/src/index.ts. Use in RLS policies: USING (public.has_role(''manager''))';

-- No REVOKE: function runs with definer privileges and is safe to expose
-- to authenticated + anon (returns false for anon since auth.uid() is null).
