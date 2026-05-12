-- Seed: configure the June 2026 Richesses d'Afrique event for the new guest
-- infrastructure. Creates the hidden "Team Germany", "Team International",
-- and "Companion" tiers; updates the VIP tier with catering perks; wires the
-- per-event tier references on events; enables catering.
--
-- All values are admin-editable from the UI afterwards. This is a starting
-- shape, not a fixed configuration.

do $$
declare
  v_event_id uuid := '702183da-aadb-4bae-a5af-6b13f01aaf21'::uuid;
  v_starter_id uuid := 'bc17a8c4-3c43-4341-ba8e-3b8d6be18050'::uuid;
  v_vip_id uuid := '7ecfc999-05c1-4922-beb5-c232fe9da7e8'::uuid;
  v_team_de_id uuid;
  v_team_intl_id uuid;
  v_companion_id uuid;
begin
  -- 1. Update VIP tier copy + flags.
  update public.ticket_tiers set
    purpose = 'vip',
    catering_included = true,
    scanner_badge_label = 'VIP',
    description_de = 'Premium-Erlebnis mit allem Inklusive. Catering inklusive einem Hauptgericht zur Auswahl. Champagner-Empfang. Inkludierte Getränke. Reservierter Sitzplatz nahe der Bühne. VIP-Lounge-Zugang.',
    description_en = 'Premium all-inclusive experience. Catering with a main dish of your choice. Champagne reception. Drinks included. Reserved seating near the stage. VIP lounge access.',
    description_fr = 'Expérience premium tout inclus. Restauration avec plat principal au choix. Réception au champagne. Boissons incluses. Place réservée près de la scène. Accès au salon VIP.'
  where id = v_vip_id;

  -- 2. Create Team Germany tier (hidden, free, team flag, catering).
  select id into v_team_de_id from public.ticket_tiers
    where event_id = v_event_id and slug = 'team-de';
  if v_team_de_id is null then
    insert into public.ticket_tiers (
      event_id, slug, name_de, name_en, name_fr,
      description_de, description_en, description_fr,
      price_cents, currency, max_quantity, is_public, sort_order,
      purpose, catering_included, is_team, is_companion,
      counts_as_sold, scanner_badge_label
    ) values (
      v_event_id, 'team-de',
      'Team Germany', 'Team Germany', 'Équipe Allemagne',
      'Internes Team-Ticket für DBC Germany.',
      'Internal team ticket for DBC Germany.',
      'Billet d''équipe interne pour DBC Allemagne.',
      0, 'EUR', null, false, 100,
      'team_germany', true, true, false,
      false, 'TEAM (DE)'
    ) returning id into v_team_de_id;
  end if;

  -- 3. Team International tier.
  select id into v_team_intl_id from public.ticket_tiers
    where event_id = v_event_id and slug = 'team-intl';
  if v_team_intl_id is null then
    insert into public.ticket_tiers (
      event_id, slug, name_de, name_en, name_fr,
      description_de, description_en, description_fr,
      price_cents, currency, max_quantity, is_public, sort_order,
      purpose, catering_included, is_team, is_companion,
      counts_as_sold, scanner_badge_label
    ) values (
      v_event_id, 'team-intl',
      'Team International', 'Team International', 'Équipe Internationale',
      'Team-Ticket für DBC-Mitglieder anderer Chapter (Frankreich, Belgien, ...).',
      'Team ticket for DBC members from other chapters (France, Belgium, ...).',
      'Billet d''équipe pour les membres DBC d''autres chapitres (France, Belgique, ...).',
      0, 'EUR', null, false, 101,
      'team_external', true, true, false,
      false, 'TEAM (INT)'
    ) returning id into v_team_intl_id;
  end if;

  -- 4. Companion tier (no catering per user's eligibility decision).
  select id into v_companion_id from public.ticket_tiers
    where event_id = v_event_id and slug = 'companion';
  if v_companion_id is null then
    insert into public.ticket_tiers (
      event_id, slug, name_de, name_en, name_fr,
      description_de, description_en, description_fr,
      price_cents, currency, max_quantity, is_public, sort_order,
      purpose, catering_included, is_team, is_companion,
      counts_as_sold, scanner_badge_label
    ) values (
      v_event_id, 'companion',
      'Begleitung', 'Companion', 'Accompagnateur',
      'Kostenfreies Ticket für die Begleitperson eines Team-Mitglieds eines anderen Chapters.',
      'Free entrance ticket for the +1 companion of an external-chapter team member.',
      'Billet d''entrée gratuit pour l''accompagnateur d''un membre d''une autre chapitre.',
      0, 'EUR', null, false, 102,
      'companion', false, false, true,
      false, 'COMPANION'
    ) returning id into v_companion_id;
  end if;

  -- 5. Mark Starter tier as the team-friend target tier (€49).
  update public.ticket_tiers set
    purpose = 'public',
    scanner_badge_label = 'STARTER'
  where id = v_starter_id;

  -- 6. Wire per-event references and enable the programs.
  update public.events set
    team_invite_quota = 3,
    team_invite_tier_id = v_starter_id,
    chapter_delegate_tier_id = v_team_intl_id,
    chapter_companion_tier_id = v_companion_id,
    team_member_tier_id = v_team_de_id,
    chapter_delegate_program_enabled = true,
    catering_enabled = true,
    delegate_review_notify_email = 'realjaynka@gmail.com'
  where id = v_event_id;
end $$;
