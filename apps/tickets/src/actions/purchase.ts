"use server";

import { createServerClient } from "@dbc/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { after } from "next/server";
import Stripe from "stripe";
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

const PAYMENT_METHOD_MAP: Record<string, string> = {
  card: "card",
  sepa: "sepa_debit",
  paypal: "paypal",
  klarna: "klarna",
  link: "link",
};

// SSOT rule 65: max orders per email per event. Configurable via env,
// default 3. A completed order is any order that is not `cancelled`.
const MAX_ORDERS_PER_EMAIL_PER_EVENT = parseInt(
  process.env.MAX_ORDERS_PER_EMAIL_PER_EVENT ?? "3",
  10
);

// How long a checkout session may hold inventory before the sweeper frees it.
// Stripe Checkout sessions expire after 24h by default but we want a tighter
// window so abandoned carts don't block other buyers from the last seats.
const RESERVATION_TTL_MINUTES = parseInt(
  process.env.RESERVATION_TTL_MINUTES ?? "15",
  10
);

// Cloudflare Turnstile verification. Only enforced when the secret is set,
// so local/dev environments without Turnstile configured still work.
async function verifyTurnstile(token: string | undefined): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ secret, response: token }),
      }
    );
    const data = (await res.json()) as { success?: boolean };
    return Boolean(data.success);
  } catch {
    return false;
  }
}

interface AttendeeInfo {
  name: string;
  email: string;
  country: string;
  tierId: string;
}

interface CheckoutInput {
  eventSlug: string;
  attendees: AttendeeInfo[];
  couponCode?: string;
  locale: string;
  turnstileToken?: string;
  source?: string;
}

function splitName(full: string): { first: string | null; last: string | null } {
  const trimmed = full.trim();
  if (!trimmed) return { first: null, last: null };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: null };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

export async function createCheckoutSession(input: CheckoutInput) {
  const supabase = await createServerClient();

  // 0. Verify Turnstile (bot protection). No-op when secret not configured.
  const turnstileOk = await verifyTurnstile(input.turnstileToken);
  if (!turnstileOk) {
    return { error: "Bot verification failed. Please refresh and try again." };
  }

  // 1. Fetch event
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select(
      "id, slug, title_en, title_de, title_fr, max_tickets_per_order, enabled_payment_methods, is_published"
    )
    .eq("slug", input.eventSlug)
    .eq("is_published", true)
    .single();

  if (eventError || !event) {
    return { error: "Event not found or not published." };
  }

  // 2. Validate attendee count
  if (input.attendees.length === 0) {
    return { error: "At least one ticket is required." };
  }
  if (input.attendees.length > event.max_tickets_per_order) {
    return {
      error: `Maximum ${event.max_tickets_per_order} tickets per order.`,
    };
  }

  // 2a. SSOT rule 65: per-email rate limit per event. Count any order that
  // isn't cancelled — pending still counts so a user can't spam checkout.
  const buyerEmail = input.attendees[0].email.trim().toLowerCase();
  const { count: existingOrderCount } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("event_id", event.id)
    .eq("recipient_email", buyerEmail)
    .neq("status", "cancelled");

  if (
    existingOrderCount !== null &&
    existingOrderCount >= MAX_ORDERS_PER_EMAIL_PER_EVENT
  ) {
    return {
      error: `You have reached the maximum of ${MAX_ORDERS_PER_EMAIL_PER_EVENT} orders for this event. Contact support if you need more tickets.`,
    };
  }

  // 3. Fetch tiers and compute totals
  const tierIds = [...new Set(input.attendees.map((a) => a.tierId))];
  const { data: tiers, error: tiersError } = await supabase
    .from("ticket_tiers")
    .select("id, name_en, price_cents, max_quantity, quantity_sold, is_public")
    .in("id", tierIds)
    .eq("event_id", event.id);

  if (tiersError || !tiers || tiers.length !== tierIds.length) {
    return { error: "Invalid ticket tier selected." };
  }

  // 4. Validate availability for each tier
  const tierQuantities: Record<string, number> = {};
  for (const attendee of input.attendees) {
    tierQuantities[attendee.tierId] =
      (tierQuantities[attendee.tierId] || 0) + 1;
  }

  for (const [tierId, qty] of Object.entries(tierQuantities)) {
    const tier = tiers.find((t) => t.id === tierId)!;
    if (
      tier.max_quantity !== null &&
      tier.quantity_sold + qty > tier.max_quantity
    ) {
      return {
        error: `Not enough tickets available for "${tier.name_en}".`,
      };
    }
  }

  // 5. Compute subtotal
  const tierMap = new Map(tiers.map((t) => [t.id, t]));
  let subtotalCents = 0;
  for (const attendee of input.attendees) {
    subtotalCents += tierMap.get(attendee.tierId)!.price_cents;
  }

  // 6. Apply coupon (server-side validation)
  let discountCents = 0;
  let couponId: string | null = null;

  if (input.couponCode) {
    const { data: coupon } = await supabase
      .from("coupons")
      .select("id, discount_type, discount_value, max_uses, times_used, event_id, applicable_tier_ids, is_active, valid_from, valid_until")
      .eq("code", input.couponCode.toUpperCase().trim())
      .eq("is_active", true)
      .single();

    if (!coupon) {
      return { error: "Invalid or expired coupon code." };
    }

    // Validate coupon is for this event (or global)
    if (coupon.event_id && coupon.event_id !== event.id) {
      return { error: "This coupon is not valid for this event." };
    }

    // Validate date range
    const now = new Date();
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      return { error: "This coupon is not yet active." };
    }
    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      return { error: "This coupon has expired." };
    }

    // Validate max uses
    if (coupon.max_uses && coupon.times_used >= coupon.max_uses) {
      return { error: "This coupon has reached its maximum uses." };
    }

    // Compute discount
    if (coupon.discount_type === "percentage") {
      discountCents = Math.round(subtotalCents * (coupon.discount_value / 100));
    } else {
      discountCents = Math.min(coupon.discount_value, subtotalCents);
    }

    couponId = coupon.id;
  }

  const totalCents = subtotalCents - discountCents;

  // 7. Get buyer (may be null for guest checkout before auth)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 8. PRE-RESERVE inventory atomically, tier by tier. If any tier fails we
  // roll back the ones we've already taken, so simultaneous buyers can't
  // cause an over-charge post-payment.
  const tierEntries = Object.entries(tierQuantities);
  const reserved: Array<{ tierId: string; qty: number }> = [];
  for (const [tierId, qty] of tierEntries) {
    const { data: ok } = await supabase.rpc("reserve_tickets", {
      p_tier_id: tierId,
      p_quantity: qty,
    });
    if (ok === true) {
      reserved.push({ tierId, qty });
    } else {
      // Release anything we already took before returning the error.
      for (const prev of reserved) {
        await supabase.rpc("release_tickets", {
          p_tier_id: prev.tierId,
          p_quantity: prev.qty,
        });
      }
      const soldOutTier = tiers.find((t) => t.id === tierId);
      return {
        error: `Another buyer just claimed the last of "${soldOutTier?.name_en ?? "this tier"}". Please try a different tier.`,
      };
    }
  }

  const reservationExpiresAt = new Date(
    Date.now() + RESERVATION_TTL_MINUTES * 60_000
  ).toISOString();

  // 8a. Upsert contacts for every attendee (country + demographics are captured
  // at checkout). The primary contact for the order is the buyer (attendee 0).
  const buyerSplit = splitName(input.attendees[0].name);
  const { data: buyerContactId } = await supabase.rpc(
    "upsert_contact_from_checkout",
    {
      p_email: buyerEmail,
      p_first_name: buyerSplit.first,
      p_last_name: buyerSplit.last,
      p_country: input.attendees[0].country || null,
      p_auto_category_slug: "event_attendees",
    }
  );

  // 9. Create order (status: pending) with explicit reservation window.
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      buyer_id: user?.id ?? null,
      contact_id: (buyerContactId as string | null) ?? null,
      event_id: event.id,
      subtotal_cents: subtotalCents,
      discount_cents: discountCents,
      total_cents: totalCents,
      status: totalCents === 0 ? "comped" : "pending",
      acquisition_type: "purchased",
      coupon_id: couponId,
      recipient_email: buyerEmail,
      recipient_name: input.attendees[0].name,
      locale: input.locale,
      source: input.source ?? null,
      reservation_expires_at:
        totalCents === 0 ? null : reservationExpiresAt,
    })
    .select("id")
    .single();

  if (orderError) {
    for (const prev of reserved) {
      await supabase.rpc("release_tickets", {
        p_tier_id: prev.tierId,
        p_quantity: prev.qty,
      });
    }
    return { error: "Failed to create order. Please try again." };
  }

  // 10. Create ticket rows (linked to pending order + upsert per-attendee contact)
  const ticketRows: Array<Record<string, unknown>> = [];
  for (const attendee of input.attendees) {
    const attendeeEmail = attendee.email.trim().toLowerCase();
    const split = splitName(attendee.name);
    const isBuyer = attendeeEmail === buyerEmail;
    const contactId = isBuyer
      ? (buyerContactId as string | null)
      : ((
          await supabase.rpc("upsert_contact_from_checkout", {
            p_email: attendeeEmail,
            p_first_name: split.first,
            p_last_name: split.last,
            p_country: attendee.country || null,
            p_auto_category_slug: "event_attendees",
          })
        ).data as string | null);

    ticketRows.push({
      order_id: order.id,
      event_id: event.id,
      tier_id: attendee.tierId,
      buyer_id: user?.id ?? null,
      contact_id: contactId,
      attendee_name: attendee.name,
      attendee_first_name: split.first,
      attendee_last_name: split.last,
      attendee_email: attendeeEmail,
    });
  }

  await supabase.from("tickets").insert(ticketRows);

  // 11. If free order, skip Stripe — mark as comped and redirect.
  if (totalCents === 0) {
    if (couponId) {
      await supabase.rpc("redeem_coupon", { p_coupon_id: couponId });
    }

    // Send tickets via email AFTER the response is sent (don't block redirect).
    // Use a service-role client because the user is not authenticated yet for
    // the background context (cookies are not preserved across `after`).
    const orderIdForEmail = order.id;
    after(async () => {
      const serviceClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      try {
        await sendTicketsForOrder(serviceClient, orderIdForEmail);
      } catch (err) {
        console.error(
          `Failed to send free-order tickets for ${orderIdForEmail}:`,
          err
        );
      }
    });

    redirect(`/${input.locale}/confirmation/${order.id}`);
  }

  // 12. Create Stripe Checkout Session
  const lineItems = input.attendees.map((attendee) => {
    const tier = tierMap.get(attendee.tierId)!;
    return {
      price_data: {
        currency: "eur" as const,
        product_data: {
          name: tier.name_en,
          description: `Attendee: ${attendee.name}`,
        },
        unit_amount: tier.price_cents,
      },
      quantity: 1,
    };
  });

  // Apply discount as a coupon in Stripe if applicable
  const discounts: { coupon: string }[] = [];
  if (discountCents > 0) {
    const stripeCoupon = await getStripe().coupons.create({
      amount_off: discountCents,
      currency: "eur",
      duration: "once",
      name: input.couponCode?.toUpperCase() ?? "Discount",
    });
    discounts.push({ coupon: stripeCoupon.id });
  }

  const paymentMethodTypes = (event.enabled_payment_methods || [])
    .map((m: string) => PAYMENT_METHOD_MAP[m])
    .filter(Boolean) as string[];

  // Stripe Checkout's `expires_at` must be at least 30 minutes in the future,
  // so line it up with max(30, reservation_ttl+slack).
  const stripeExpiresIn = Math.max(
    30 * 60,
    RESERVATION_TTL_MINUTES * 60 + 60
  );

  // If the event row explicitly whitelists methods, use them. Otherwise let
  // Stripe render every method the account has enabled that's eligible for
  // this currency/amount/customer-country — so switching on PayPal, Klarna,
  // Link, Apple Pay, etc. in the Stripe Dashboard flows through without a
  // redeploy.
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    line_items: lineItems,
    discounts,
    expires_at: Math.floor(Date.now() / 1000) + stripeExpiresIn,
    metadata: {
      order_id: order.id,
      event_id: event.id,
      coupon_id: couponId ?? "",
    },
    success_url: `${process.env.NEXT_PUBLIC_TICKETS_URL}/${input.locale}/confirmation/${order.id}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_TICKETS_URL}/${input.locale}/events/${input.eventSlug}`,
  };
  if (paymentMethodTypes.length > 0) {
    sessionParams.payment_method_types =
      paymentMethodTypes as Stripe.Checkout.SessionCreateParams["payment_method_types"];
  } else {
    // automatic_payment_methods exists at runtime on Stripe 2023-08+ but isn't
    // in all type versions. Cast to index-access so TS stays happy.
    (sessionParams as Record<string, unknown>).automatic_payment_methods = {
      enabled: true,
    };
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await getStripe().checkout.sessions.create(sessionParams);
  } catch (err) {
    // Roll back the reservation if Stripe refused to create the session.
    for (const prev of reserved) {
      await supabase.rpc("release_tickets", {
        p_tier_id: prev.tierId,
        p_quantity: prev.qty,
      });
    }
    await supabase
      .from("orders")
      .update({ status: "cancelled", reservation_expires_at: null })
      .eq("id", order.id);
    console.error("Stripe checkout creation failed:", err);
    return {
      error:
        "Payment provider is unavailable. Your seats were released — please try again in a moment.",
    };
  }

  // Store Stripe session ID on the order
  await supabase
    .from("orders")
    .update({ stripe_checkout_session_id: session.id })
    .eq("id", order.id);

  // 13. Redirect to Stripe Checkout
  redirect(session.url!);
}
