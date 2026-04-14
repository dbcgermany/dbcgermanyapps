-- Add Micael (Marketing) to the team roster.
INSERT INTO public.team_members
  (slug, name, role_en, role_de, role_fr, sort_order, visibility)
VALUES (
  'micael',
  'Micael',
  'Marketing',
  'Marketing',
  'Marketing',
  50,
  'public'
)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      role_en = EXCLUDED.role_en,
      role_de = EXCLUDED.role_de,
      role_fr = EXCLUDED.role_fr,
      sort_order = EXCLUDED.sort_order,
      visibility = 'public';
