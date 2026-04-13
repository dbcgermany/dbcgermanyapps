import { NextResponse } from "next/server";
import { after } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { notifyAdmins } from "@dbc/supabase/server";
import { sendOrderReceipt } from "@dbc/email";
import { sendTicketsForOrder } from "@/lib/send-tickets-for-order";

// Lazy-initialised so the module can be imported during `next build`
// (page-data collection) without STRIPE_SECRET_KEY being set.
let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-03-25.dahlia",
    });
  }
  return _stripe;
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = getSupabase();

  // Idempotency: check if we've already processed this event
  const { data: existing } = await supabase
    .from("processed_webhooks")
    .select("id")
    .eq("id", event.id)
    .single();

  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Mark as processed BEFORE handling (prevents race conditions)
  await supabase
    .from("processed_webhooks")
    .insert({ id: event.id, source: "stripe" });

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.order_id;
    const eventId = session.metadata?.event_id;
    const couponId = session.metadata?.coupon_id;

    if (!orderId || !eventId) {
      console.error("Missing metadata in Stripe session:", session.id);
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    // Determine payment method
    let paymentMethod: string | null = null;
    if (session.payment_method_types?.includes("card")) paymentMethod = "card";
    if (session.payment_method_types?.includes("sepa_debit"))
      paymentMethod = "sepa";
    if (session.payment_method_types?.includes("paypal"))
      paymentMethod = "paypal";

    // Flip pending → paid and clear the reservation expiry so the sweeper
    // won't touch this order. The WHERE guard ensures we only promote
    // reservations that are still live — prevents duplicate fulfilment if
    // Stripe retries the webhook after we've already handled it (the
    // processed_webhooks check above is the primary defence; this is belt
    // and braces).
    const { data: promoted, error: orderError } = await supabase
      .from("orders")
      .update({
        status: "paid",
        payment_method: paymentMethod,
        stripe_payment_intent_id: session.payment_intent as string,
        reservation_expires_at: null,
      })
      .eq("id", orderId)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (orderError) {
      console.error("Failed to update order:", orderError);
      return NextResponse.json(
        { error: "Failed to update order" },
        { status: 500 }
      );
    }

    if (!promoted) {
      // Either the sweeper already released this order (rare, but
      // recoverable) or Stripe is re-delivering an old event for an order
      // that's already paid. If the sweeper got there first we need to
      // refund — the customer was charged for seats we already released.
      const { data: currentOrder } = await supabase
        .from("orders")
        .select("status, stripe_payment_intent_id")
        .eq("id", orderId)
        .single();

      if (currentOrder?.status === "cancelled") {
        console.error(
          `Order ${orderId} was swept before webhook — issuing refund for ${session.payment_intent}`
        );
        try {
          if (session.payment_intent) {
            await getStripe().refunds.create({
              payment_intent: session.payment_intent as string,
              reason: "requested_by_customer",
              metadata: { order_id: orderId, reason: "inventory_released" },
            });
          }
        } catch (err) {
          console.error(
            `CRITICAL: could not auto-refund swept order ${orderId}:`,
            err
          );
        }
        return NextResponse.json({ received: true, swept: true });
      }
      // Already paid or otherwise not-pending; nothing to do.
      return NextResponse.json({ received: true, duplicate: true });
    }

    // Atomic coupon redemption (inventory was already reserved at checkout
    // intent time; we don't touch ticket_tiers here any more).
    if (couponId) {
      await supabase.rpc("redeem_coupon", { p_coupon_id: couponId });
    }

    // Audit log: order_paid + one ticket_issued per ticket
    const { data: ticketsForAudit } = await supabase
      .from("tickets")
      .select("id, ticket_token, tier_id, attendee_email")
      .eq("order_id", orderId);

    const { data: amountRow } = await supabase
      .from("orders")
      .select("total_cents, currency")
      .eq("id", orderId)
      .single();

    const auditRows: Array<{
      action: string;
      entity_type: string;
      entity_id: string;
      details: Record<string, unknown>;
    }> = [
      {
        action: "order_paid",
        entity_type: "orders",
        entity_id: orderId,
        details: {
          event_id: eventId,
          total_cents: amountRow?.total_cents ?? null,
          currency: amountRow?.currency ?? "EUR",
          payment_method: paymentMethod,
          stripe_payment_intent_id: session.payment_intent ?? null,
          stripe_event_id: event.id,
        },
      },
    ];
    for (const ticket of ticketsForAudit ?? []) {
      auditRows.push({
        action: "ticket_issued",
        entity_type: "tickets",
        entity_id: ticket.id,
        details: {
          order_id: orderId,
          event_id: eventId,
          attendee_email: ticket.attendee_email,
          tier_id: ticket.tier_id,
        },
      });
    }
    if (auditRows.length > 0) {
      await supabase.from("audit_log").insert(auditRows);
    }

    // Generate PDF tickets, send emails, and notify admins AFTER the response is
    // sent (Stripe expects 200 within 10s; PDF rendering + batch emails are slow).
    after(async () => {
      try {
        await sendTicketsForOrder(supabase, orderId);
      } catch (err) {
        console.error(`Failed to send tickets for order ${orderId}:`, err);
      }

      // Fetch order details for admin notification + receipt.
      const { data: order } = await supabase
        .from("orders")
        .select(
          "recipient_name, recipient_email, total_cents, subtotal_cents, discount_cents, currency, locale, payment_method, event_id"
        )
        .eq("id", orderId)
        .single();

      const { data: eventRow } = await supabase
        .from("events")
        .select("title_en, title_de, title_fr")
        .eq("id", eventId)
        .single();

      const { data: orderTickets } = await supabase
        .from("tickets")
        .select("attendee_name, tier_id")
        .eq("order_id", orderId);

      const { data: tierRows } = await supabase
        .from("ticket_tiers")
        .select("id, name_en, name_de, name_fr, price_cents")
        .in("id", [...new Set((orderTickets ?? []).map((t) => t.tier_id))]);

      const ticketCount = orderTickets?.length ?? 0;

      // Send order receipt to buyer. Keep failures non-fatal so ticket
      // delivery still wins.
      if (order && eventRow) {
        try {
          const locale = (order.locale as "en" | "de" | "fr") || "en";
          const eventTitle =
            (eventRow[`title_${locale}` as keyof typeof eventRow] as string) ||
            eventRow.title_en;
          const ticketsBaseUrl =
            process.env.NEXT_PUBLIC_TICKETS_URL ??
            "https://ticket.dbc-germany.com";
          const currency = (order.currency || "EUR").toUpperCase();

          const fmt = (cents: number) =>
            (cents / 100).toLocaleString(locale, {
              style: "currency",
              currency,
            });

          const tierMap = new Map((tierRows ?? []).map((t) => [t.id, t]));
          const lineItems = (orderTickets ?? []).map((t) => {
            const tier = tierMap.get(t.tier_id);
            const tierName = tier
              ? ((tier[`name_${locale}` as keyof typeof tier] as string) ||
                tier.name_en)
              : "Ticket";
            const amount = tier ? fmt(tier.price_cents) : "";
            return {
              description: `${tierName}${t.attendee_name ? ` \u2014 ${t.attendee_name}` : ""}`,
              amount,
            };
          });

          const receipt = await sendOrderReceipt({
            to: order.recipient_email,
            recipientName: order.recipient_name,
            orderShortId: orderId.slice(0, 8).toUpperCase(),
            eventTitle,
            subtotalFormatted: fmt(order.subtotal_cents),
            discountFormatted:
              order.discount_cents > 0 ? `-${fmt(order.discount_cents)}` : null,
            totalFormatted: fmt(order.total_cents),
            paymentMethod: order.payment_method ?? paymentMethod,
            orderUrl: `${ticketsBaseUrl}/${locale}/confirmation/${orderId}`,
            lineItems,
            locale,
          });
          if (receipt?.id) {
            await supabase
              .from("orders")
              .update({ receipt_email_message_id: receipt.id })
              .eq("id", orderId);
          }
        } catch (err) {
          console.error(`Failed to send order receipt for ${orderId}:`, err);
        }
      }

      if (order && eventRow) {
        await notifyAdmins(supabase, {
          type: "new_order",
          title: `New order: ${order.recipient_name}`,
          body: `${ticketCount ?? 0} ticket${(ticketCount ?? 0) === 1 ? "" : "s"} for ${eventRow.title_en} \u2014 \u20AC${(order.total_cents / 100).toFixed(2)}`,
          data: { order_id: orderId, event_id: eventId },
        });
      }

      // Check if any tier just sold out
      const { data: soldOutTiers } = await supabase
        .from("ticket_tiers")
        .select("id, name_en, event_id, max_quantity, quantity_sold")
        .eq("event_id", eventId);

      if (soldOutTiers) {
        for (const tier of soldOutTiers) {
          if (
            tier.max_quantity !== null &&
            tier.quantity_sold >= tier.max_quantity
          ) {
            // Check if we've already notified for this sellout (avoid spam)
            const { count: existing } = await supabase
              .from("notifications")
              .select("*", { count: "exact", head: true })
              .eq("type", "tier_sold_out")
              .filter("data->>tier_id", "eq", tier.id);

            if (existing === 0) {
              await notifyAdmins(supabase, {
                type: "tier_sold_out",
                title: `Sold out: ${tier.name_en}`,
                body: `${eventRow?.title_en ?? "Event"} \u2014 ${tier.name_en} is now sold out (${tier.quantity_sold}/${tier.max_quantity})`,
                data: { tier_id: tier.id, event_id: eventId },
              });
            }
          }
        }
      }
    });
  }

  // Stripe Checkout expires abandoned sessions. Release any inventory we were
  // holding for it so the seats flow back into the public pool. The sweeper
  // cron is the main defence (Stripe's expiry is 24h unless we shorten it;
  // our reservation TTL is 15min), but handling this event is cheap and
  // keeps the DB in sync quickly.
  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.order_id;
    if (orderId) {
      const { data: cancelled } = await supabase
        .from("orders")
        .update({ status: "cancelled", reservation_expires_at: null })
        .eq("id", orderId)
        .eq("status", "pending")
        .select("id")
        .maybeSingle();

      if (cancelled) {
        const { data: heldTickets } = await supabase
          .from("tickets")
          .select("tier_id")
          .eq("order_id", orderId);

        const tierCounts: Record<string, number> = {};
        for (const t of heldTickets ?? []) {
          tierCounts[t.tier_id] = (tierCounts[t.tier_id] || 0) + 1;
        }
        for (const [tierId, qty] of Object.entries(tierCounts)) {
          await supabase.rpc("release_tickets", {
            p_tier_id: tierId,
            p_quantity: qty,
          });
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
