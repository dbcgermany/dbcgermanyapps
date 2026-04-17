"use server";

import { createServerClient, requireRole, notifyAdmins } from "@dbc/supabase/server";
import { revalidatePath } from "next/cache";
import Stripe from "stripe";

// Lazy-initialised so the module can be imported during `next build`
// (page-data collection) without STRIPE_SECRET_KEY being set in the env.
let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-03-25.dahlia",
    });
  }
  return _stripe;
}

export async function getOrders(filter?: {
  eventId?: string;
  status?: string;
}) {
  await requireRole("manager");
  const supabase = await createServerClient();

  let query = supabase
    .from("orders")
    .select(
      "id, event_id, total_cents, discount_cents, status, acquisition_type, payment_method, recipient_name, recipient_email, locale, created_at, email_sent_at, stripe_payment_intent_id"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (filter?.eventId) query = query.eq("event_id", filter.eventId);
  if (filter?.status) query = query.eq("status", filter.status);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  // Enrich with event titles
  const eventIds = [...new Set((data ?? []).map((o) => o.event_id))];
  const { data: events } = await supabase
    .from("events")
    .select("id, title_en, title_de, title_fr")
    .in("id", eventIds);

  const eventMap = new Map((events ?? []).map((e) => [e.id, e]));

  return (data ?? []).map((o) => ({
    ...o,
    event: eventMap.get(o.event_id) ?? null,
  }));
}

export async function getOrdersEvents() {
  await requireRole("manager");
  const supabase = await createServerClient();

  const { data } = await supabase
    .from("events")
    .select("id, title_en, title_de, title_fr")
    .order("starts_at", { ascending: false });

  return data ?? [];
}

/**
 * Fetch a single order with all related data for the detail page.
 */
export async function getOrder(orderId: string) {
  await requireRole("manager");
  const supabase = await createServerClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `id, event_id, contact_id, coupon_id, subtotal_cents, discount_cents,
       total_cents, currency, status, acquisition_type, payment_method,
       recipient_name, recipient_email, locale, created_at, email_sent_at,
       stripe_payment_intent_id`
    )
    .eq("id", orderId)
    .single();

  if (error || !order) throw new Error("Order not found");

  const [ticketsRes, eventRes, contactRes, couponRes] = await Promise.all([
    supabase
      .from("tickets")
      .select(
        `id, ticket_token, attendee_name, attendee_email, checked_in_at,
         tier:ticket_tiers(id, name_en, name_de, name_fr, price_cents)`
      )
      .eq("order_id", orderId)
      .order("created_at", { ascending: true }),
    supabase
      .from("events")
      .select("id, title_en, title_de, title_fr, starts_at, ends_at, venue_name")
      .eq("id", order.event_id)
      .single(),
    order.contact_id
      ? supabase
          .from("contacts")
          .select("id, email, first_name, last_name")
          .eq("id", order.contact_id)
          .single()
      : Promise.resolve({ data: null }),
    order.coupon_id
      ? supabase
          .from("coupons")
          .select("id, code, discount_type, discount_value")
          .eq("id", order.coupon_id)
          .single()
      : Promise.resolve({ data: null }),
  ]);

  // Normalize tier from Supabase join (may come as array or object depending on FK)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tickets = (ticketsRes.data ?? []).map((t: any) => ({
    ...t,
    tier: Array.isArray(t.tier) ? t.tier[0] ?? null : t.tier ?? null,
  }));

  return {
    order,
    tickets,
    event: eventRes.data,
    contact: contactRes.data,
    coupon: couponRes.data,
  };
}

/**
 * Issues a refund via Stripe and marks the order + tickets as refunded.
 * Restores ticket inventory for each refunded tier.
 */
export async function refundOrder(orderId: string, locale: string) {
  const user = await requireRole("admin");
  const supabase = await createServerClient();

  // Fetch order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(
      "id, status, total_cents, stripe_payment_intent_id, event_id, acquisition_type"
    )
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return { error: "Order not found" };
  }

  if (order.status === "refunded") {
    return { error: "Order is already refunded" };
  }

  if (order.status !== "paid" && order.status !== "comped") {
    return { error: `Cannot refund ${order.status} order` };
  }

  // Issue Stripe refund if it was a paid order with a Stripe payment
  if (order.status === "paid" && order.stripe_payment_intent_id) {
    try {
      await getStripe().refunds.create({
        payment_intent: order.stripe_payment_intent_id,
        amount: order.total_cents,
      });
    } catch (err) {
      return {
        error: `Stripe refund failed: ${(err as Error).message}`,
      };
    }
  }

  // Fetch tickets to restore inventory
  const { data: tickets } = await supabase
    .from("tickets")
    .select("id, tier_id")
    .eq("order_id", orderId);

  // Restore inventory per tier
  if (tickets) {
    const tierCounts: Record<string, number> = {};
    for (const ticket of tickets) {
      tierCounts[ticket.tier_id] = (tierCounts[ticket.tier_id] || 0) + 1;
    }

    for (const [tierId, qty] of Object.entries(tierCounts)) {
      // Decrement quantity_sold (opposite of reserve_tickets)
      const { data: currentTier } = await supabase
        .from("ticket_tiers")
        .select("quantity_sold")
        .eq("id", tierId)
        .single();

      if (currentTier) {
        await supabase
          .from("ticket_tiers")
          .update({
            quantity_sold: Math.max(0, currentTier.quantity_sold - qty),
          })
          .eq("id", tierId);
      }
    }
  }

  // Mark order as refunded
  await supabase
    .from("orders")
    .update({ status: "refunded" })
    .eq("id", orderId);

  // Audit log
  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "refund_order",
    entity_type: "orders",
    entity_id: orderId,
    details: {
      amount_cents: order.total_cents,
      stripe_refund: order.status === "paid",
    },
  });

  // Notify other admins
  await notifyAdmins(supabase, {
    type: "refund_issued",
    title: `Refund issued`,
    body: `\u20AC${(order.total_cents / 100).toFixed(2)} refunded for order #${orderId.slice(0, 8).toUpperCase()}`,
    data: { order_id: orderId, amount_cents: order.total_cents },
  });

  revalidatePath(`/${locale}/orders`);
  return { success: true };
}
