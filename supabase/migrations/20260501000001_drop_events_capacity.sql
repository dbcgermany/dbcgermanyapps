-- Drop events.capacity. Total event capacity is now derived dynamically
-- from SUM(ticket_tiers.max_quantity) per event. The reservation RPC
-- already enforces only per-tier max_quantity, never the event-level
-- column, so this column was purely informational. All admin UI and
-- AI digest paths have been switched to compute from tiers.

ALTER TABLE public.events DROP COLUMN IF EXISTS capacity;
