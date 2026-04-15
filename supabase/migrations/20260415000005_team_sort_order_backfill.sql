-- =============================================================================
-- DBC Germany — Team display order
-- Ruth Bambi → Vanessa Bambi → Ruth Mayala → Jay → Micael
-- Date: 2026-04-15
-- =============================================================================
-- Slugs are the source of truth; sort_order values use 10-step gaps to leave
-- room for admin drag-drop reorders to insert between rows without rewriting
-- every row each time.

UPDATE public.team_members
  SET sort_order = CASE slug
    WHEN 'ruth-bambi'    THEN 10
    WHEN 'vanessa-bambi' THEN 20
    WHEN 'ruth-mayala'   THEN 30
    WHEN 'jay-n-kalala'  THEN 40
    WHEN 'micael'        THEN 50
    ELSE sort_order
  END
WHERE slug IN (
  'ruth-bambi',
  'vanessa-bambi',
  'ruth-mayala',
  'jay-n-kalala',
  'micael'
);
