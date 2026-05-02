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
    const funnelSlug = session.metadata?.funnel_slug || null;

    if (!orderId || !eventId) {
      console.error("Missing metadata in Stripe session:", session.id);
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    // Determine payment method from the actual charge — `session.payment_method_types`
    // is the menu shown to the buyer, not the chosen method. Read the canonical
    // type from `latest_charge.payment_method_details.type` so we get
    // card / sepa_debit / paypal / klarna / etc.
    let paymentMethod: string | null = null;
    if (typeof session.payment_intent === "string") {
      try {
        const pi = await getStripe().paymentIntents.retrieve(
          session.payment_intent,
          { expand: ["latest_charge.payment_method_details"] }
        );
        const charge = pi.latest_charge as Stripe.Charge | null;
        const detailType = charge?.payment_method_details?.type ?? null;
        if (detailType) paymentMethod = detailType;
      } catch (err) {
        console.warn(
          `[webhook] could not resolve payment_method for ${session.id}:`,
          err
        );
      }
    }

    // Trust-but-verify the metadata. orderId came from session.metadata.order_id
    // (which Stripe never alters) but we still cross-check: this same order
    // must have been the one that created this Checkout Session.
    const sessionPaymentIntentId =
      typeof session.payment_intent === "string" ? session.payment_intent : null;
    const { data: orderForCheck } = await supabase
      .from("orders")
      .select("id, stripe_checkout_session_id, stripe_payment_intent_id, status")
      .eq("id", orderId)
      .maybeSingle();
    if (
      !orderForCheck ||
      (orderForCheck.stripe_checkout_session_id &&
        orderForCheck.stripe_checkout_session_id !== session.id)
    ) {
      console.error(
        `[webhook] session/order mismatch — session=${session.id} order=${orderId} stored=${orderForCheck?.stripe_checkout_session_id ?? "(null)"}`
      );
      return NextResponse.json({ error: "session mismatch" }, { status: 400 });
    }

    // Redeem coupon BEFORE the response so a crash between status flip and
    // redemption can't leave a paid order with an un-incremented times_used.
    // The RPC is atomic + idempotent against max_uses; safe to call early.
    if (couponId && orderForCheck.status === "pending") {
      try {
        await supabase.rpc("redeem_coupon", { p_coupon_id: couponId });
      } catch (err) {
        console.warn(
          `[webhook] redeem_coupon failed for order ${orderId}:`,
          (err as Error)?.message
        );
      }
    }

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
        stripe_payment_intent_id: sessionPaymentIntentId,
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

    // (Coupon redemption already happened above, before the order flip.)

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
            "https://tickets.dbc-germany.com";
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

      // Close the funnel-attribution loop: if the visitor arrived via a
      // funnel pricing button, the checkout page forwarded that slug through
      // Stripe metadata. Look up the funnel and fire a `conversion` event so
      // the admin KPI cards can show per-angle conversion rates.
      if (funnelSlug) {
        try {
          const { data: funnelRow } = await supabase
            .from("funnels")
            .select("id")
            .eq("slug", funnelSlug)
            .maybeSingle();
          if (funnelRow?.id) {
            await supabase.rpc("insert_funnel_event", {
              p_funnel_id: funnelRow.id,
              p_event_type: "conversion",
              p_session_id: `stripe:${session.id}`,
              p_locale: (order?.locale as string) ?? null,
              p_utm_source: null,
              p_utm_medium: null,
              p_utm_campaign: funnelSlug,
              p_referrer: null,
            });
          }
        } catch (err) {
          console.error(
            `Failed to record funnel conversion for order ${orderId}:`,
            err
          );
        }
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
        // Drop the orphan ticket rows so admin attendee lists, CSV exports,
        // and ticket counts only ever surface real (paid/comped) attendees.
        // Inventory is already returned via release_tickets above.
        await supabase.from("tickets").delete().eq("order_id", orderId);
      }
    }
  }

  // Surfaces genuinely failed card authorisations to the admin. Stripe emits
  // payment_intent.payment_failed when the attempt is declined/cancelled; we
  // want operators to know immediately so they can follow up with the buyer
  // instead of waiting for a silent no-show.
  if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const reason =
      intent.last_payment_error?.message ??
      intent.last_payment_error?.code ??
      "unknown reason";
    // Find the order via stripe_payment_intent_id so the deep link resolves.
    const { data: failedOrder } = await supabase
      .from("orders")
      .select("id, event_id, recipient_name, recipient_email, total_cents, currency")
      .eq("stripe_payment_intent_id", intent.id)
      .maybeSingle();
    after(async () => {
      try {
        await notifyAdmins(supabase, {
          type: "payment_failed",
          title: `Payment failed${failedOrder?.recipient_name ? ` — ${failedOrder.recipient_name}` : ""}`,
          body: `${reason}${failedOrder?.total_cents ? ` · ${(failedOrder.total_cents / 100).toFixed(2)} ${failedOrder.currency ?? "EUR"}` : ""}`,
          data: {
            order_id: failedOrder?.id ?? null,
            event_id: failedOrder?.event_id ?? null,
            stripe_payment_intent_id: intent.id,
            reason,
          },
        });
      } catch (err) {
        console.error(
          `Failed to notify admins of payment_failed for ${intent.id}:`,
          err
        );
      }
    });
  }

  // Mirror Stripe-Dashboard-initiated refunds back into our DB so the order
  // status, inventory and reporting stay consistent. Handles full AND partial
  // refunds: amount_refunded_cents is cumulative; status flips to 'refunded'
  // only when the running total >= the order total. Idempotent — same charge
  // event arriving twice is a no-op because amount_refunded comes from Stripe.
  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    const piId =
      typeof charge.payment_intent === "string" ? charge.payment_intent : null;
    if (piId) {
      const { data: order } = await supabase
        .from("orders")
        .select(
          "id, status, event_id, recipient_name, recipient_email, total_cents, currency, amount_refunded_cents"
        )
        .eq("stripe_payment_intent_id", piId)
        .maybeSingle();

      if (order) {
        const newAmount = charge.amount_refunded ?? 0;
        const isFull = newAmount >= (order.total_cents ?? 0);
        const wasFull = order.status === "refunded";

        if (newAmount > (order.amount_refunded_cents ?? 0) || (isFull && !wasFull)) {
          // Only release inventory + flip status on the FIRST time we hit
          // "fully refunded". Partial refunds keep status='paid' and inventory held.
          if (isFull && !wasFull) {
            const { data: ticketRows } = await supabase
              .from("tickets")
              .select("tier_id")
              .eq("order_id", order.id);
            const tierCounts: Record<string, number> = {};
            for (const t of ticketRows ?? []) {
              tierCounts[t.tier_id] = (tierCounts[t.tier_id] ?? 0) + 1;
            }
            for (const [tierId, qty] of Object.entries(tierCounts)) {
              await supabase.rpc("release_tickets", {
                p_tier_id: tierId,
                p_quantity: qty,
              });
            }
            await supabase
              .from("orders")
              .update({
                status: "refunded",
                amount_refunded_cents: newAmount,
              })
              .eq("id", order.id);
          } else {
            // Partial refund: just record the cumulative amount.
            await supabase
              .from("orders")
              .update({ amount_refunded_cents: newAmount })
              .eq("id", order.id);
          }

          await supabase.from("audit_log").insert({
            action: isFull ? "refund_order" : "partial_refund",
            entity_type: "orders",
            entity_id: order.id,
            details: {
              source: "stripe_webhook",
              stripe_event_id: event.id,
              amount_refunded_cents: newAmount,
              order_total_cents: order.total_cents,
              is_full: isFull,
            },
          });

          after(async () => {
            try {
              await notifyAdmins(supabase, {
                type: "refund_issued",
                title: `${isFull ? "Refund" : "Partial refund"}${order.recipient_name ? ` — ${order.recipient_name}` : ""}`,
                body: `${(newAmount / 100).toFixed(2)} ${(order.currency ?? "EUR").toUpperCase()} refunded via Stripe Dashboard`,
                data: {
                  order_id: order.id,
                  event_id: order.event_id,
                  stripe_event_id: event.id,
                  is_full: isFull,
                },
              });
            } catch (err) {
              console.error(
                `Failed to notify admins of charge.refunded for ${charge.id}:`,
                (err as Error)?.message
              );
            }
          });
        }
      }
    }
  }

  // Disputes (chargebacks, including SEPA reversals) need immediate operator
  // attention. We don't auto-flip the order — the admin decides whether to
  // contest or refund — but we audit-log it and ping the admin channels.
  if (event.type === "charge.dispute.created") {
    const dispute = event.data.object as Stripe.Dispute;
    const piId =
      typeof dispute.payment_intent === "string" ? dispute.payment_intent : null;
    let order: {
      id: string;
      event_id: string | null;
      recipient_name: string | null;
    } | null = null;
    if (piId) {
      const { data } = await supabase
        .from("orders")
        .select("id, event_id, recipient_name")
        .eq("stripe_payment_intent_id", piId)
        .maybeSingle();
      order = data ?? null;
    }
    await supabase.from("audit_log").insert({
      action: "dispute_created",
      entity_type: "orders",
      entity_id: order?.id ?? null,
      details: {
        reason: dispute.reason,
        amount: dispute.amount,
        currency: dispute.currency,
        stripe_dispute_id: dispute.id,
        stripe_event_id: event.id,
        stripe_payment_intent_id: piId,
      },
    });
    after(async () => {
      try {
        await notifyAdmins(supabase, {
          type: "dispute_created",
          title: `Chargeback opened${order?.recipient_name ? ` — ${order.recipient_name}` : ""}`,
          body: `${dispute.reason} · ${(dispute.amount / 100).toFixed(2)} ${dispute.currency.toUpperCase()}`,
          data: {
            order_id: order?.id ?? null,
            event_id: order?.event_id ?? null,
            stripe_dispute_id: dispute.id,
            stripe_payment_intent_id: piId,
          },
        });
      } catch (err) {
        console.error(
          `Failed to notify admins of dispute ${dispute.id}:`,
          err
        );
      }
    });
  }

  return NextResponse.json({ received: true });
}
