-- =============================================================================
-- Team-friend invite codes — flexible discount config (percent or fixed)
--
-- Previously the discount was derived from events.team_invite_tier_id: a team
-- member generated a code that resolved to a tier priced at X €, so the
-- discount was hardcoded as (retail_price - X). That model only allows fixed
-- amounts, can't express "50% off any standard ticket", and forces admins to
-- create a dedicated discounted tier per event.
--
-- New shape:
--   - events.team_invite_discount_type     ∈ {percent, fixed}
--   - events.team_invite_discount_value    cents when fixed, 0–100 when percent
--   - events.team_invite_applicable_tier_ids   uuid[] of tiers the code applies to
--     (empty array = applies to every public tier in the event)
--
-- Per-team-member override (admins can give Vanessa 50%, Anna 30% on the same
-- event) reuses event_team_member_quota_overrides — both override columns are
-- nullable; NULL means "inherit event-level config".
--
-- Migration safety:
--   - Existing team_invite_tier_id stays for now; the new fields default to
--     percent/0 so already-running events keep working until admins explicitly
--     set the new discount. The tier_id column will be dropped in a follow-up
--     migration once the action code is fully cut over.
--
-- Date: 2026-05-13
-- =============================================================================

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS team_invite_discount_type text NOT NULL DEFAULT 'percent'
    CHECK (team_invite_discount_type IN ('percent','fixed')),
  ADD COLUMN IF NOT EXISTS team_invite_discount_value integer NOT NULL DEFAULT 0
    CHECK (team_invite_discount_value >= 0),
  ADD COLUMN IF NOT EXISTS team_invite_applicable_tier_ids uuid[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.events.team_invite_discount_type IS
  'Discount model for team-friend invite codes. ''percent'' = whole-number percent off the retail price; ''fixed'' = euro cents off.';
COMMENT ON COLUMN public.events.team_invite_discount_value IS
  'Magnitude paired with team_invite_discount_type: cents when fixed, 0–100 when percent.';
COMMENT ON COLUMN public.events.team_invite_applicable_tier_ids IS
  'Which ticket_tiers the team-friend code is valid against at checkout. Empty array = all public tiers in the event.';

CREATE INDEX IF NOT EXISTS idx_events_team_invite_applicable_tier_ids
  ON public.events USING gin (team_invite_applicable_tier_ids)
  WHERE team_invite_applicable_tier_ids <> '{}';

ALTER TABLE public.event_team_member_quota_overrides
  ADD COLUMN IF NOT EXISTS discount_type text
    CHECK (discount_type IN ('percent','fixed')),
  ADD COLUMN IF NOT EXISTS discount_value integer
    CHECK (discount_value IS NULL OR discount_value >= 0);

COMMENT ON COLUMN public.event_team_member_quota_overrides.discount_type IS
  'Per-team-member override of the event-level discount type. NULL = inherit events.team_invite_discount_type.';
COMMENT ON COLUMN public.event_team_member_quota_overrides.discount_value IS
  'Per-team-member override magnitude. NULL = inherit events.team_invite_discount_value.';
