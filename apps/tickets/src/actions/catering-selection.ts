"use server";

import { headers } from "next/headers";
import { createServerClient } from "@dbc/supabase/server";
import {
  resolveTicketAccess,
  type InvolvementRole,
  type TierRow,
} from "@dbc/supabase";
import { revalidatePath } from "next/cache";

const RATE_WINDOW_SECONDS = 5;
const RATE_MAX_PER_TOKEN = 1;

export interface CateringMenuItem {
  id: string;
  category: string;
  name_en: string;
  name_de: string;
  name_fr: string;
  description_en: string | null;
  description_de: string | null;
  description_fr: string | null;
  is_vegetarian: boolean | null;
  is_vegan: boolean | null;
  is_halal: boolean | null;
  allergens: string[] | null;
  sort_order: number | null;
  max_selections_per_event: number | null;
  selections_count: number;
}

export interface CateringContext {
  status:
    | "ok"
    | "ticket_not_found"
    | "ticket_revoked"
    | "catering_disabled_for_event"
    | "not_eligible_for_this_ticket";
  ticketId?: string;
  attendeeName?: string;
  attendeeEmail?: string;
  eventTitle?: string;
  eventLocale?: string;
  tierName?: string;
  menu?: CateringMenuItem[];
  currentSelections?: { id: string; menu_item_id: string; notes: string | null }[];
  notesDefault?: string;
}

export async function loadCateringContextForToken(
  token: string
): Promise<CateringContext> {
  const supabase = await createServerClient();
  const trimmed = token.trim();
  if (!/^[0-9a-f-]{30,}$/i.test(trimmed)) {
    return { status: "ticket_not_found" };
  }

  const { data: ticket } = await supabase
    .from("tickets")
    .select(
      `id, event_id, contact_id, attendee_name, attendee_email, attendee_first_name, attendee_last_name, revoked_at, catering_eligible_override,
       ticket_tiers!inner(id, name_en, name_de, name_fr, price_cents, currency, scanner_badge_label, purpose, is_team, is_companion, catering_included),
       events!inner(id, title_en, title_de, title_fr, catering_enabled, chapter_companion_value_tier_id, catering_eligible_roles)`
    )
    .eq("ticket_token", trimmed)
    .maybeSingle();
  if (!ticket) return { status: "ticket_not_found" };
  if (ticket.revoked_at) return { status: "ticket_revoked" };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const event = (ticket as any).events;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tier = (ticket as any).ticket_tiers as TierRow | null;
  if (!event?.catering_enabled) {
    return { status: "catering_disabled_for_event" };
  }

  // Resolve the reference tier (for companion +1 dynamic access) and the
  // active roles for this contact on this event. Both are optional — when
  // null/empty, the helper falls through to the legacy tier+override path.
  let referenceTier: TierRow | null = null;
  if (event.chapter_companion_value_tier_id) {
    const { data: refTier } = await supabase
      .from("ticket_tiers")
      .select(
        "id, name_en, name_de, name_fr, price_cents, currency, scanner_badge_label, purpose, is_team, is_companion, catering_included"
      )
      .eq("id", event.chapter_companion_value_tier_id)
      .maybeSingle();
    referenceTier = (refTier as TierRow | null) ?? null;
  }

  let activeRoles: InvolvementRole[] = [];
  if (ticket.contact_id) {
    const { data: involvements } = await supabase
      .from("contact_event_involvements")
      .select("role, status")
      .eq("contact_id", ticket.contact_id)
      .eq("event_id", ticket.event_id);
    activeRoles = ((involvements ?? []) as { role: string; status: string | null }[])
      .filter((i) => i.status === "active" || i.status === null)
      .map((i) => i.role as InvolvementRole);
  }

  const access = resolveTicketAccess({
    locale: "en",
    issuedTier: tier,
    event: {
      chapter_companion_value_tier_id: event.chapter_companion_value_tier_id ?? null,
      catering_eligible_roles:
        (event.catering_eligible_roles as InvolvementRole[] | null) ?? [],
    },
    referenceTier,
    cateringOverride: ticket.catering_eligible_override ?? null,
    activeRoles,
  });
  const eligible = access.cateringIncluded;
  if (!eligible) {
    return {
      status: "not_eligible_for_this_ticket",
      attendeeName:
        [ticket.attendee_first_name, ticket.attendee_last_name]
          .filter(Boolean)
          .join(" ") || ticket.attendee_name || "",
      eventTitle:
        event.title_en ?? event.title_de ?? event.title_fr ?? "",
      tierName: tier?.name_en ?? tier?.name_de ?? "",
    };
  }

  const { data: menu } = await supabase
    .from("catering_menu_items")
    .select(
      "id, category, name_en, name_de, name_fr, description_en, description_de, description_fr, is_vegetarian, is_vegan, is_halal, allergens, sort_order, max_selections_per_event, selections_count"
    )
    .eq("event_id", ticket.event_id)
    .eq("is_active", true)
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true });

  const { data: existing } = await supabase
    .from("ticket_catering_selections")
    .select("id, menu_item_id, notes")
    .eq("ticket_id", ticket.id);

  return {
    status: "ok",
    ticketId: ticket.id,
    attendeeName:
      [ticket.attendee_first_name, ticket.attendee_last_name]
        .filter(Boolean)
        .join(" ") || ticket.attendee_name || "",
    attendeeEmail: ticket.attendee_email,
    eventTitle: event.title_en ?? event.title_de ?? event.title_fr ?? "",
    tierName: tier?.name_en ?? tier?.name_de ?? "",
    menu: (menu ?? []) as CateringMenuItem[],
    currentSelections: (existing ?? []).map((s) => ({
      id: s.id,
      menu_item_id: s.menu_item_id,
      notes: s.notes,
    })),
    notesDefault: existing?.find((s) => s.notes)?.notes ?? "",
  };
}

export interface SubmitCateringInput {
  token: string;
  selectedItemIds: string[];
  notes?: string;
  honeypot?: string;
}

export async function submitCateringSelection(
  input: SubmitCateringInput
): Promise<{ success?: true; error?: string }> {
  // Honeypot silent-success.
  if (input.honeypot && input.honeypot.trim().length > 0) {
    return { success: true };
  }
  const trimmed = input.token.trim();
  if (!/^[0-9a-f-]{30,}$/i.test(trimmed)) {
    return { error: "Invalid ticket link." };
  }

  const supabase = await createServerClient();
  const hdrs = await headers();
  const ipRaw =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    hdrs.get("x-real-ip") ??
    null;

  // Token-scoped rate limit (1 submission per 5s) to discourage abuse.
  const since = new Date(Date.now() - RATE_WINDOW_SECONDS * 1000).toISOString();
  const { count } = await supabase
    .from("abuse_events")
    .select("id", { count: "exact", head: true })
    .eq("scope", "catering")
    .eq("key", trimmed)
    .gte("occurred_at", since);
  if ((count ?? 0) >= RATE_MAX_PER_TOKEN) {
    return { error: "Please wait a moment before re-submitting." };
  }
  await supabase
    .from("abuse_events")
    .insert({ scope: "catering", key: trimmed, ip: ipRaw });

  const ctx = await loadCateringContextForToken(trimmed);
  if (ctx.status !== "ok" || !ctx.ticketId) {
    return { error: "Catering isn't available for this ticket." };
  }
  const menuById = new Map((ctx.menu ?? []).map((m) => [m.id, m]));
  const cleanIds = Array.from(new Set(input.selectedItemIds)).filter((id) =>
    menuById.has(id)
  );
  if (cleanIds.length === 0) {
    // Allow clearing selections; delete current rows.
    await supabase
      .from("ticket_catering_selections")
      .delete()
      .eq("ticket_id", ctx.ticketId);
    return { success: true };
  }

  // Enforce per-item cap. If reaching the cap would push selections_count over
  // max_selections_per_event AND this ticket didn't already have it selected,
  // refuse with a clear error.
  const existingIds = new Set(
    (ctx.currentSelections ?? []).map((s) => s.menu_item_id)
  );
  for (const id of cleanIds) {
    const item = menuById.get(id);
    if (!item) continue;
    if (item.max_selections_per_event == null) continue;
    if (item.selections_count >= item.max_selections_per_event && !existingIds.has(id)) {
      return {
        error: `"${item.name_en}" is sold out — please pick another option.`,
      };
    }
  }

  const noteClean = (input.notes ?? "").trim().slice(0, 500) || null;

  // Diff-based upsert: delete removed, insert added, refresh notes on existing.
  const toDelete = (ctx.currentSelections ?? [])
    .filter((s) => !cleanIds.includes(s.menu_item_id))
    .map((s) => s.menu_item_id);
  const toInsert = cleanIds.filter((id) => !existingIds.has(id));

  if (toDelete.length > 0) {
    await supabase
      .from("ticket_catering_selections")
      .delete()
      .eq("ticket_id", ctx.ticketId)
      .in("menu_item_id", toDelete);
  }
  if (toInsert.length > 0) {
    await supabase.from("ticket_catering_selections").insert(
      toInsert.map((id) => ({
        ticket_id: ctx.ticketId!,
        menu_item_id: id,
        notes: noteClean,
      }))
    );
  }
  if (noteClean !== null) {
    await supabase
      .from("ticket_catering_selections")
      .update({ notes: noteClean, updated_at: new Date().toISOString() })
      .eq("ticket_id", ctx.ticketId);
  }

  revalidatePath(`/[locale]/tickets/${trimmed}/catering`, "layout");
  return { success: true };
}
