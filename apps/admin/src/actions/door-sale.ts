"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { revalidatePath } from "next/cache";

export async function createDoorSale(formData: FormData) {
  const user = await requireRole("team_member");
  const supabase = await createServerClient();

  const eventId = formData.get("event_id") as string;
  const tierId = formData.get("tier_id") as string;
  const attendeeName = formData.get("attendee_name") as string;
  const attendeeEmail =
    (formData.get("attendee_email") as string) || `door-sale-${Date.now()}@no-email.local`;
  const paymentMethod = formData.get("payment_method") as string;
  const locale = formData.get("locale") as string;

  if (!attendeeName.trim()) {
    return { error: "Attendee name is required." };
  }

  // Fetch tier to get price and validate availability
  const { data: tier, error: tierError } = await supabase
    .from("ticket_tiers")
    .select("id, event_id, price_cents, max_quantity, quantity_sold, name_en")
    .eq("id", tierId)
    .single();

  if (tierError || !tier || tier.event_id !== eventId) {
    return { error: "Invalid ticket tier." };
  }

  // Atomic reservation
  const { data: reserved } = await supabase.rpc("reserve_tickets", {
    p_tier_id: tierId,
    p_quantity: 1,
  });

  if (!reserved) {
    return { error: `"${tier.name_en}" is sold out.` };
  }

  // Create order (status: paid, marked as door_sale)
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      buyer_id: null,
      event_id: eventId,
      subtotal_cents: tier.price_cents,
      discount_cents: 0,
      total_cents: tier.price_cents,
      status: "paid",
      acquisition_type: "door_sale",
      payment_method: paymentMethod,
      recipient_email: attendeeEmail,
      recipient_name: attendeeName,
      locale,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    // Rollback: decrement the tier
    await supabase
      .from("ticket_tiers")
      .update({ quantity_sold: tier.quantity_sold })
      .eq("id", tierId);
    return { error: "Failed to create order." };
  }

  // Create ticket (already paid, ready for immediate entry)
  const { error: ticketError } = await supabase.from("tickets").insert({
    order_id: order.id,
    event_id: eventId,
    tier_id: tierId,
    attendee_name: attendeeName,
    attendee_email: attendeeEmail,
  });

  if (ticketError) {
    return { error: "Failed to create ticket." };
  }

  // Audit log
  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "door_sale",
    entity_type: "orders",
    entity_id: order.id,
    details: {
      attendee: attendeeName,
      tier: tier.name_en,
      amount_cents: tier.price_cents,
      payment_method: paymentMethod,
    },
  });

  revalidatePath(`/${locale}/door-sale`);
  return { success: true, orderId: order.id };
}

export async function getDoorSaleEvents() {
  await requireRole("team_member");
  const supabase = await createServerClient();

  // Events happening today or in the next 7 days
  const { data } = await supabase
    .from("events")
    .select(
      "id, title_en, title_de, title_fr, starts_at, ends_at, venue_name"
    )
    .gte("ends_at", new Date().toISOString())
    .lte("starts_at", new Date(Date.now() + 7 * 86400000).toISOString())
    .order("starts_at", { ascending: true });

  return data ?? [];
}

export async function getEventTiers(eventId: string) {
  await requireRole("team_member");
  const supabase = await createServerClient();

  const { data } = await supabase
    .from("ticket_tiers")
    .select("id, name_en, name_de, name_fr, price_cents, max_quantity, quantity_sold")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });

  return data ?? [];
}
