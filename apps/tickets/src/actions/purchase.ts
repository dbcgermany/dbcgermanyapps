"use server";

import { createServerClient } from "@dbc/supabase/server";
import { CONTACT_CATEGORY, DEFAULTS } from "@dbc/types";
import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { after } from "next/server";
import type Stripe from "stripe";
import { sendTicketsForOrder } from "@dbc/email";
import { captureServerError } from "@/lib/observe";
import {
  filterToActive,
  getActivePaymentMethodTypes,
} from "@/lib/stripe-capabilities";
import { getStripe } from "@/lib/stripe";

// events.enabled_payment_methods now stores canonical Stripe `payment_method_types`
// values directly (validated against STRIPE_PAYMENT_METHOD_TYPE_VALUES on the
// admin write path). No translation layer needed.

// SSOT rule 65: max orders per email per event. Configurable via env,
// default from @dbc/types DEFAULTS. A completed order is any order that is
// not `cancelled`.
const MAX_ORDERS_PER_EMAIL_PER_EVENT = parseInt(
  process.env.MAX_ORDERS_PER_EMAIL_PER_EVENT ??
    String(DEFAULTS.MAX_ORDERS_PER_EMAIL_PER_EVENT),
  10
);

// How long a checkout session may hold inventory before the sweeper frees it.
// Stripe Checkout sessions expire after 24h by default but we want a tighter
// window so abandoned carts don't block other buyers from the last seats.
const RESERVATION_TTL_MINUTES = parseInt(
  process.env.RESERVATION_TTL_MINUTES ??
    String(DEFAULTS.RESERVATION_TTL_MINUTES),
  10
);

// Cloudflare Turnstile verification.
//
// The site key is a NEXT_PUBLIC_* var read at build time and inlined into
// the client bundle. The server has access to it via process.env too (Next
// inlines NEXT_PUBLIC_* on both sides).
//
// Decision matrix:
//   - Site key UNSET                 → Turnstile not deployed.
//                                      No widget rendered client-side, no
//                                      token can possibly arrive. Skip
//                                      verification — otherwise we'd block
//                                      every checkout. Bot risk: same as
//                                      not having Turnstile at all (the
//                                      pre-Turnstile baseline).
//   - Site key set, secret UNSET    → Misconfiguration. Widget renders and
//                                      collects tokens but server can't
//                                      verify them. Log loudly to Sentry
//                                      and SKIP rather than block real
//                                      buyers. Operator must fix the env
//                                      mismatch.
//   - Both keys set, no token       → Reject. Widget should have produced a
//                                      token; absence means the buyer
//                                      bypassed the widget.
//   - Both keys set, token present  → Verify with Cloudflare. Honour the
//                                      result.
async function verifyTurnstile(token: string | undefined): Promise<boolean> {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!siteKey) {
    return true;
  }
  if (!secret) {
    console.error(
      "[turnstile] NEXT_PUBLIC_TURNSTILE_SITE_KEY is set but TURNSTILE_SECRET_KEY is missing — env mismatch, skipping verification to avoid blocking buyers"
    );
    return true;
  }
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

import type { Gender, Title } from "@dbc/ui";
import { impliedGenderFromTitle } from "@dbc/ui";

interface AttendeeInfo {
  first_name: string;
  last_name: string;
  email: string;
  country: string;
  tierId: string;
  title?: Title | "";
  gender?: Gender | "";
  birthday?: string | null;
  /** Optional demographic / contact fields the attendee can volunteer
   *  during checkout. Lawful basis: explicit consent (left empty by
   *  default). Stored on contacts.* and never required to complete the
   *  purchase. */
  occupation?: string | null;
  address_line_1?: string | null;
  address_line_2?: string | null;
  postal_code?: string | null;
  city?: string | null;
}

interface CheckoutInput {
  eventSlug: string;
  attendees: AttendeeInfo[];
  couponCode?: string;
  locale: string;
  turnstileToken?: string;
  source?: string;
  /** Funnel slug the visitor arrived from. Passed through to Stripe
   *  metadata so the webhook can fire a `conversion` funnel event
   *  when the purchase completes. */
  funnelSlug?: string;
  /** German Widerrufsrecht (BGB §312g, §355 ff.) waiver. Required true:
   *  buyer explicitly waives the 14-day revocation right for digital
   *  event tickets. Stored on orders.revocation_waived. */
  revocationWaived?: boolean;
  /** P1.4 — Buyer's explicit opt-in for marketing emails. Default false.
   *  Stamps contacts.marketing_consent + the audit trail (source / IP
   *  / timestamp). Used to gate future newsletter sends to this contact. */
  marketingConsent?: boolean;
}

function composeName(first: string, last: string): string {
  return [first, last].map((s) => s.trim()).filter(Boolean).join(" ");
}

function effectiveGender(
  title: Title | "" | undefined,
  gender: Gender | "" | undefined
): Gender | null {
  const implied = impliedGenderFromTitle(title ? (title as Title) : null);
  if (implied) return implied;
  return gender ? (gender as Gender) : null;
}

// Optional address fields collected at checkout. The RPC upsert handles
// occupation / birthday / gender / country / name; address columns aren't
// on its signature so we patch them with a fill-in-blanks UPDATE — never
// overwriting data the contact already has from an earlier order or an
// admin edit.
async function applyOptionalContactFields(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  contactId: string | null,
  attendee: AttendeeInfo
) {
  if (!contactId) return;
  const incoming = {
    address_line_1:
      attendee.address_line_1 && attendee.address_line_1.trim()
        ? attendee.address_line_1.trim()
        : null,
    address_line_2:
      attendee.address_line_2 && attendee.address_line_2.trim()
        ? attendee.address_line_2.trim()
        : null,
    postal_code:
      attendee.postal_code && attendee.postal_code.trim()
        ? attendee.postal_code.trim()
        : null,
    city:
      attendee.city && attendee.city.trim() ? attendee.city.trim() : null,
  };

  const hasIncoming = Object.values(incoming).some((v) => v !== null);
  if (!hasIncoming) return;

  const { data: current } = await supabase
    .from("contacts")
    .select("address_line_1, address_line_2, postal_code, city")
    .eq("id", contactId)
    .single();
  if (!current) return;

  const patch: Record<string, string> = {};
  for (const [key, value] of Object.entries(incoming)) {
    if (value === null) continue;
    if (current[key as keyof typeof current]) continue;
    patch[key] = value;
  }
  if (Object.keys(patch).length === 0) return;

  await supabase.from("contacts").update(patch).eq("id", contactId);
}

export async function createCheckoutSession(input: CheckoutInput) {
  const supabase = await createServerClient();

  // 0. Verify Turnstile (bot protection). No-op when secret not configured.
  const turnstileOk = await verifyTurnstile(input.turnstileToken);
  if (!turnstileOk) {
    return { error: "Bot verification failed. Please refresh and try again." };
  }

  // German Widerrufsrecht: digital event tickets are exempt from the 14-day
  // revocation right ONLY if the buyer explicitly consents BEFORE the order.
  // Without consent capture, every ticket would technically be refundable
  // for 14 days. Block the checkout when the box wasn't ticked.
  if (!input.revocationWaived) {
    return {
      error:
        input.locale === "de"
          ? "Bitte bestätigen Sie den Verzicht auf das Widerrufsrecht, um fortzufahren."
          : input.locale === "fr"
            ? "Veuillez confirmer la renonciation au droit de rétractation pour continuer."
            : "Please confirm the revocation-right waiver to continue.",
    };
  }

  // 1. Fetch event
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select(
      "id, slug, title_en, title_de, title_fr, max_tickets_per_order, max_total_tickets, enabled_payment_methods, is_published, team_invite_applicable_tier_ids"
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

  // P1.3 — Event-wide hard cap. Per-tier max_quantity is the primary gate
  // (atomically enforced by reserve_tickets), but admin can also set a
  // global ceiling via events.max_total_tickets. Reject the order early
  // if it would push the total past that ceiling. Race-window is small
  // (between this check and the reservation RPC) — acceptable for v1; a
  // strict guard would push the check into reserve_tickets.
  if (event.max_total_tickets != null && event.max_total_tickets > 0) {
    const { count: currentSold } = await supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("event_id", event.id)
      .is("revoked_at", null);
    const projected = (currentSold ?? 0) + input.attendees.length;
    if (projected > event.max_total_tickets) {
      return {
        error: `Only ${Math.max(0, event.max_total_tickets - (currentSold ?? 0))} ticket(s) left for this event.`,
      };
    }
  }

  // 2a. SSOT rule 65: per-email rate limit per event. Count paid/comped
  // orders + LIVE pending orders only. Expired pendings don't count —
  // otherwise a buyer who abandons 3 Apple-Pay flakes is locked out of
  // the event for 15-30 minutes until the sweeper runs, which on launch
  // day would block real buyers.
  const buyerEmail = input.attendees[0].email.trim().toLowerCase();
  const livePendingCutoff = new Date().toISOString();
  const [paidComped, livePending] = await Promise.all([
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("event_id", event.id)
      .eq("recipient_email", buyerEmail)
      .in("status", ["paid", "comped"]),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("event_id", event.id)
      .eq("recipient_email", buyerEmail)
      .eq("status", "pending")
      .gt("reservation_expires_at", livePendingCutoff),
  ]);
  const existingOrderCount =
    (paidComped.count ?? 0) + (livePending.count ?? 0);

  if (existingOrderCount >= MAX_ORDERS_PER_EMAIL_PER_EVENT) {
    return {
      error: `You have reached the maximum of ${MAX_ORDERS_PER_EMAIL_PER_EVENT} orders for this event. Contact support if you need more tickets.`,
    };
  }

  // 3. Fetch tiers and compute totals.
  //    Trust boundary: this server action is the only point that authorises a
  //    Stripe Checkout creation. The page filters hidden / out-of-window
  //    tiers in render but a malicious actor could POST a tier UUID
  //    directly. Mirror the page's filter here so internal/comp/expired
  //    tiers can never be purchased even with a known UUID.
  const tierIds = [...new Set(input.attendees.map((a) => a.tierId))];
  const nowIso = new Date().toISOString();
  const { data: tiers, error: tiersError } = await supabase
    .from("ticket_tiers")
    .select(
      "id, name_en, price_cents, currency, max_quantity, quantity_sold, is_public, sales_start_at, sales_end_at, stripe_product_id, stripe_price_id"
    )
    .in("id", tierIds)
    .eq("event_id", event.id)
    .eq("is_public", true);

  if (tiersError || !tiers || tiers.length !== tierIds.length) {
    return { error: "Invalid ticket tier selected." };
  }

  // P2.5 — currency pass-through. Stripe sessions are single-currency, so
  // every tier in this order must share the same currency. EUR is the
  // long-standing default; this check just unblocks future non-EUR events.
  const tierCurrencies = new Set(
    tiers.map((t) => (t.currency ?? "EUR").toLowerCase())
  );
  if (tierCurrencies.size > 1) {
    return {
      error: "Cannot mix tiers with different currencies in one order.",
    };
  }
  const orderCurrency = [...tierCurrencies][0] ?? "eur";

  for (const tier of tiers) {
    if (tier.sales_start_at && tier.sales_start_at > nowIso) {
      return { error: `Sales for "${tier.name_en}" have not started yet.` };
    }
    if (tier.sales_end_at && tier.sales_end_at < nowIso) {
      return { error: `Sales for "${tier.name_en}" have ended.` };
    }
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
  let couponStripePromotionCodeId: string | null = null;
  // True when the coupon is scoped to specific tiers. Such coupons must NOT
  // be handed to Stripe as the whole-order promotion code (Stripe would
  // discount every line item); instead we pass the tier-scoped amount as an
  // ephemeral amount_off coupon so Stripe's amount_total matches the
  // tier-scoped order total exactly (and clears the webhook integrity guard).
  let couponTierRestricted = false;

  if (input.couponCode) {
    const { data: coupon } = await supabase
      .from("coupons")
      .select(
        "id, discount_type, discount_value, max_uses, times_used, event_id, applicable_tier_ids, is_active, valid_from, valid_until, stripe_coupon_id, stripe_promotion_code_id, purpose"
      )
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

    // If the coupon restricts to specific tiers, only count those line items
    // toward the discount base. Unrestricted coupons apply to the full subtotal.
    // For team_friend_invite codes the tier policy is the event's
    // team_invite_applicable_tier_ids (SSOT) — the per-coupon column is a
    // historical snapshot and drifts when admin changes policy.
    const applicableTierIds = resolveCouponApplicableTierIds(
      coupon,
      event.team_invite_applicable_tier_ids
    );
    let eligibleCents = subtotalCents;
    if (applicableTierIds.length > 0) {
      couponTierRestricted = true;
      const allowed = new Set(applicableTierIds);
      eligibleCents = 0;
      for (const attendee of input.attendees) {
        if (allowed.has(attendee.tierId)) {
          eligibleCents += tierMap.get(attendee.tierId)!.price_cents;
        }
      }
      if (eligibleCents === 0) {
        return {
          error:
            "This coupon doesn't apply to any of the tiers in your cart.",
        };
      }
    }

    // Compute discount against the eligible portion
    if (coupon.discount_type === "percentage") {
      discountCents = Math.round(eligibleCents * (coupon.discount_value / 100));
    } else {
      discountCents = Math.min(coupon.discount_value, eligibleCents);
    }

    couponId = coupon.id;
    couponStripePromotionCodeId = coupon.stripe_promotion_code_id ?? null;
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
  const buyer = input.attendees[0];
  const buyerFirst = buyer.first_name.trim() || null;
  const buyerLast = buyer.last_name.trim() || null;
  const buyerFullName = composeName(buyer.first_name, buyer.last_name);
  const { data: buyerContactId } = await supabase.rpc(
    "upsert_contact_from_checkout",
    {
      p_email: buyerEmail,
      p_first_name: buyerFirst,
      p_last_name: buyerLast,
      p_country: buyer.country || null,
      p_birthday:
        buyer.birthday && buyer.birthday.trim() ? buyer.birthday : null,
      p_gender: buyer.gender || null,
      p_occupation:
        buyer.occupation && buyer.occupation.trim()
          ? buyer.occupation.trim()
          : null,
      p_auto_category_slug: CONTACT_CATEGORY.event_attendees,
      p_locale: input.locale,
    }
  );

  // P1.4 — stamp marketing consent on the buyer's contact row when they
  // explicitly opted in at checkout. We only ever turn it ON via this path
  // (never silently OFF — the unsubscribe path is the only way to flip it
  // back). Conservative: never overwrite an already-confirmed consent.
  if (input.marketingConsent && buyerContactId) {
    const nowIso = new Date().toISOString();
    await supabase
      .from("contacts")
      .update({
        marketing_consent: true,
        marketing_consent_confirmed_at: nowIso,
        marketing_consent_source: "checkout",
      })
      .eq("id", buyerContactId as string)
      .or("marketing_consent.eq.false,marketing_consent.is.null");
  }

  // Address fields aren't on the RPC signature — write them directly with
  // a fill-in-blanks UPDATE so we never overwrite better data the contact
  // already has from a previous order or admin edit.
  await applyOptionalContactFields(
    supabase,
    buyerContactId as string | null,
    buyer
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
      recipient_first_name: buyerFirst,
      recipient_last_name: buyerLast,
      recipient_name: buyerFullName,
      locale: input.locale,
      currency: orderCurrency.toUpperCase(),
      source: input.source ?? null,
      revocation_waived: true,
      revocation_waived_at: new Date().toISOString(),
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
    const first = attendee.first_name.trim() || null;
    const last = attendee.last_name.trim() || null;
    const fullName = composeName(attendee.first_name, attendee.last_name);
    const gender = effectiveGender(attendee.title, attendee.gender);
    const title = attendee.title ? attendee.title : null;
    const birthday = attendee.birthday && attendee.birthday.trim() ? attendee.birthday : null;

    const isBuyer = attendeeEmail === buyerEmail;
    const contactId = isBuyer
      ? (buyerContactId as string | null)
      : ((
          await supabase.rpc("upsert_contact_from_checkout", {
            p_email: attendeeEmail,
            p_first_name: first,
            p_last_name: last,
            p_country: attendee.country || null,
            p_birthday: birthday,
            p_gender: attendee.gender || null,
            p_occupation:
              attendee.occupation && attendee.occupation.trim()
                ? attendee.occupation.trim()
                : null,
            p_auto_category_slug: CONTACT_CATEGORY.event_attendees,
            p_locale: input.locale,
          })
        ).data as string | null);

    if (!isBuyer) {
      await applyOptionalContactFields(supabase, contactId, attendee);
    }

    ticketRows.push({
      order_id: order.id,
      event_id: event.id,
      tier_id: attendee.tierId,
      buyer_id: user?.id ?? null,
      contact_id: contactId,
      attendee_name: fullName,
      attendee_first_name: first,
      attendee_last_name: last,
      attendee_email: attendeeEmail,
      attendee_title: title,
      attendee_gender: gender,
      attendee_birthday: birthday,
    });
  }

  // P0.1 — Ticket insert must not silently fail. If it does, the buyer is
  // about to be sent to Stripe for a paid order that has no tickets attached.
  // Roll back the reservation + drop the order so they never reach checkout.
  const { error: ticketsInsertError } = await supabase
    .from("tickets")
    .insert(ticketRows);
  if (ticketsInsertError) {
    console.error("[purchase] tickets insert failed:", ticketsInsertError);
    for (const prev of reserved) {
      await supabase.rpc("release_tickets", {
        p_tier_id: prev.tierId,
        p_quantity: prev.qty,
      });
    }
    await supabase.from("orders").delete().eq("id", order.id);
    return {
      error:
        "Could not finalise your tickets. Your reservation was released — please try again.",
    };
  }

  // 10a. Record event involvement rows (one per distinct contact) so this
  // contact shows up when filtering Contacts by the event. Deduped by the
  // UNIQUE (contact_id, event_id, role) constraint.
  const attendeeContactIds = Array.from(
    new Set(
      ticketRows
        .map((r) => r.contact_id as string | null)
        .filter((id): id is string => Boolean(id))
    )
  );
  if (attendeeContactIds.length > 0) {
    await supabase.from("contact_event_involvements").upsert(
      attendeeContactIds.map((id) => ({
        contact_id: id,
        event_id: event.id,
        role: "attendee" as const,
      })),
      { onConflict: "contact_id,event_id,role", ignoreDuplicates: false }
    );
  }

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
        await sendTicketsForOrder(serviceClient, orderIdForEmail, {
          onError: (e, ctx) =>
            captureServerError(e, {
              scope: "send_tickets_for_order",
              data: ctx,
            }),
        });
      } catch (err) {
        captureServerError(err, {
          scope: "free_order_send_tickets",
          data: { order_id: orderIdForEmail },
        });
        console.error(
          `Failed to send free-order tickets for ${orderIdForEmail}:`,
          err
        );
      }
    });

    redirect(`/${input.locale}/confirmation/${order.id}`);
  }

  // 12. Create Stripe Checkout Session
  // Aggregate per-tier so we use Stripe's `quantity` instead of one line per
  // attendee. Per-attendee names live in our `tickets` table + emails.
  const lineItems = [] as Stripe.Checkout.SessionCreateParams["line_items"] &
    object[];
  for (const [tierId, qty] of Object.entries(tierQuantities)) {
    const tier = tierMap.get(tierId)!;
    if (tier.stripe_price_id) {
      lineItems.push({ price: tier.stripe_price_id, quantity: qty });
    } else {
      // Fallback for legacy / pre-sync tiers. Identical shape to the
      // pre-migration code so events created before backfill keep working.
      lineItems.push({
        price_data: {
          currency: orderCurrency,
          product_data: { name: tier.name_en },
          unit_amount: tier.price_cents,
        },
        quantity: qty,
      });
    }
  }

  // Apply discount. For unrestricted coupons we prefer the synced Promotion
  // Code so URL ?code= flows surface in Stripe Checkout's promotion-code
  // field. For tier-restricted coupons (general, affiliate, or team-friend)
  // the promotion code would make Stripe discount EVERY line item, not just
  // the eligible tiers — so we pass our already-computed tier-scoped amount
  // as an ephemeral amount_off coupon. That guarantees Stripe's amount_total
  // equals the tier-scoped order total exactly (no whole-order over-discount,
  // no per-line rounding drift) and clears the webhook money-math guard.
  // The legacy fallback (no synced promotion code) uses the same ephemeral
  // path.
  const discounts: Array<{ promotion_code?: string; coupon?: string }> = [];
  if (discountCents > 0) {
    if (couponStripePromotionCodeId && !couponTierRestricted) {
      discounts.push({ promotion_code: couponStripePromotionCodeId });
    } else {
      const stripeCoupon = await getStripe().coupons.create({
        amount_off: discountCents,
        currency: orderCurrency,
        duration: "once",
        name: input.couponCode?.toUpperCase() ?? "Discount",
      });
      discounts.push({ coupon: stripeCoupon.id });
    }
  }

  const requestedMethods = (event.enabled_payment_methods ?? []) as string[];
  const activeMethods = await getActivePaymentMethodTypes(getStripe());
  const allowedMethods = filterToActive(requestedMethods, activeMethods);

  // Negative path: event explicitly whitelisted methods but none are
  // currently active on the Stripe account. Roll back and surface a clean
  // error rather than letting Stripe reject the session params.
  if (requestedMethods.length > 0 && allowedMethods.length === 0) {
    for (const prev of reserved) {
      await supabase.rpc("release_tickets", {
        p_tier_id: prev.tierId,
        p_quantity: prev.qty,
      });
    }
    await supabase.from("tickets").delete().eq("order_id", order.id);
    await supabase
      .from("orders")
      .update({ status: "cancelled", reservation_expires_at: null })
      .eq("id", order.id);
    captureServerError(
      new Error("[checkout] no active payment methods on Stripe account"),
      {
        scope: "checkout_no_active_methods",
        data: { requested: requestedMethods, active: activeMethods },
      }
    );
    console.error("[checkout] no active payment methods", {
      requested: requestedMethods,
      active: activeMethods,
    });
    return {
      error: "Payments are temporarily unavailable. Please try again shortly.",
    };
  }

  // Stripe Checkout's `expires_at` must be at least 30 minutes in the future,
  // so line it up with max(30, reservation_ttl+slack).
  const stripeExpiresIn = Math.max(
    30 * 60,
    RESERVATION_TTL_MINUTES * 60 + 60
  );

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    line_items: lineItems,
    discounts,
    expires_at: Math.floor(Date.now() / 1000) + stripeExpiresIn,
    metadata: {
      order_id: order.id,
      event_id: event.id,
      coupon_id: couponId ?? "",
      funnel_slug: input.funnelSlug ?? "",
    },
    success_url: `${process.env.NEXT_PUBLIC_TICKETS_URL}/${input.locale}/confirmation/${order.id}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_TICKETS_URL}/${input.locale}/events/${input.eventSlug}`,
  };
  if (requestedMethods.length > 0) {
    // Event whitelist exists — pass the filtered (active-only) set.
    sessionParams.payment_method_types =
      allowedMethods as Stripe.Checkout.SessionCreateParams["payment_method_types"];
  }
  // Otherwise omit both payment_method_types and automatic_payment_methods so
  // Stripe falls back to the account's Dashboard-configured default methods.

  let session: Stripe.Checkout.Session;
  try {
    session = await getStripe().checkout.sessions.create(sessionParams);
  } catch (err) {
    // Roll back the reservation if Stripe refused to create the session.
    // Tickets were already inserted above, so wipe them so the order's
    // cancelled state doesn't leave orphan attendee rows behind.
    for (const prev of reserved) {
      await supabase.rpc("release_tickets", {
        p_tier_id: prev.tierId,
        p_quantity: prev.qty,
      });
    }
    await supabase.from("tickets").delete().eq("order_id", order.id);
    await supabase
      .from("orders")
      .update({ status: "cancelled", reservation_expires_at: null })
      .eq("id", order.id);
    const stripeErr = err as {
      type?: string;
      code?: string;
      param?: string;
      message?: string;
      requestId?: string;
    };
    captureServerError(err, {
      scope: "stripe_checkout_session_create",
      data: {
        order_id: order.id,
        event_id: event.id,
        type: stripeErr?.type,
        code: stripeErr?.code,
        param: stripeErr?.param,
        request_id: stripeErr?.requestId,
      },
    });
    console.error("[stripe] checkout.sessions.create failed:", {
      type: stripeErr?.type,
      code: stripeErr?.code,
      param: stripeErr?.param,
      message: stripeErr?.message,
      request_id: stripeErr?.requestId,
    });
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

// ---------------------------------------------------------------------------
// P2.2 — Coupon live-preview
//
// Lightweight read-only validator the checkout form calls (debounced) as the
// user types a coupon code. Returns the same error strings used by the real
// checkout action so the messaging stays consistent. Does not reserve seats
// or create an order.
// ---------------------------------------------------------------------------

export interface CouponPreviewInput {
  eventSlug: string;
  code: string;
  /** Tier IDs currently in the cart, for the applicable-tier check. */
  tierIds: string[];
}

export type CouponPreviewResult =
  | {
      valid: true;
      label: string;
      discountType: "percentage" | "fixed_amount";
      discountValue: number;
      /** Resolved discount in cents against the current cart. */
      discountCents: number;
      /** Eligible portion of the cart subtotal in cents (= subtotal if unrestricted). */
      eligibleCents: number;
    }
  | { valid: false; error: string };

/**
 * Single source of truth for which tier IDs a coupon applies to. For
 * `team_friend_invite` codes we read the event's `team_invite_applicable_tier_ids`
 * column rather than the per-coupon snapshot, so admin policy changes
 * flow through to all historical codes without re-issuing. Other coupon
 * purposes (admin-created `TEST343` etc.) keep using their own column.
 */
function resolveCouponApplicableTierIds(
  coupon: { applicable_tier_ids: unknown; purpose: string | null },
  eventTeamInviteTierIds: string[] | null
): string[] {
  if (coupon.purpose === "team_friend_invite") {
    return Array.isArray(eventTeamInviteTierIds)
      ? (eventTeamInviteTierIds as string[])
      : [];
  }
  return Array.isArray(coupon.applicable_tier_ids)
    ? (coupon.applicable_tier_ids as string[])
    : [];
}

export async function previewCoupon(
  input: CouponPreviewInput
): Promise<CouponPreviewResult> {
  const code = input.code.trim().toUpperCase();
  if (!code) return { valid: false, error: "Enter a code." };
  const supabase = await createServerClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, team_invite_applicable_tier_ids")
    .eq("slug", input.eventSlug)
    .eq("is_published", true)
    .maybeSingle();
  if (!event) return { valid: false, error: "Event not found." };

  const { data: coupon } = await supabase
    .from("coupons")
    .select(
      "id, discount_type, discount_value, max_uses, times_used, event_id, applicable_tier_ids, is_active, valid_from, valid_until, purpose"
    )
    .eq("code", code)
    .eq("is_active", true)
    .maybeSingle();
  if (!coupon) return { valid: false, error: "Invalid or expired coupon code." };
  if (coupon.event_id && coupon.event_id !== event.id) {
    return { valid: false, error: "This coupon is not valid for this event." };
  }

  const now = new Date();
  if (coupon.valid_from && new Date(coupon.valid_from) > now) {
    return { valid: false, error: "This coupon is not yet active." };
  }
  if (coupon.valid_until && new Date(coupon.valid_until) < now) {
    return { valid: false, error: "This coupon has expired." };
  }
  if (coupon.max_uses && coupon.times_used >= coupon.max_uses) {
    return {
      valid: false,
      error: "This coupon has reached its maximum uses.",
    };
  }

  const applicableTierIds = resolveCouponApplicableTierIds(
    coupon,
    event.team_invite_applicable_tier_ids as string[] | null
  );

  // Pull tier prices for the cart so we can report a real eligibleCents
  // and discountCents (the UI needs them to render Subtotal/Discount/Total).
  let cartTiers: { id: string; price_cents: number }[] = [];
  if (input.tierIds.length > 0) {
    const { data: tiers } = await supabase
      .from("ticket_tiers")
      .select("id, price_cents")
      .in("id", input.tierIds)
      .eq("event_id", event.id)
      .eq("is_public", true);
    cartTiers = (tiers ?? []).map((t) => ({
      id: t.id,
      price_cents: t.price_cents ?? 0,
    }));
  }
  const cartSubtotal = cartTiers.reduce((s, t) => s + t.price_cents, 0);

  let eligibleCents = cartSubtotal;
  if (applicableTierIds.length > 0 && cartTiers.length > 0) {
    const allowed = new Set(applicableTierIds);
    eligibleCents = cartTiers
      .filter((t) => allowed.has(t.id))
      .reduce((s, t) => s + t.price_cents, 0);
    if (eligibleCents === 0) {
      return {
        valid: false,
        error: "This coupon doesn't apply to any of the tiers in your cart.",
      };
    }
  }

  const discountCents =
    coupon.discount_type === "percentage"
      ? Math.round(eligibleCents * (coupon.discount_value / 100))
      : Math.min(coupon.discount_value, eligibleCents);

  const label =
    coupon.discount_type === "percentage"
      ? `${coupon.discount_value}% off`
      : `€${(coupon.discount_value / 100).toFixed(0)} off`;

  return {
    valid: true,
    label,
    discountType: coupon.discount_type,
    discountValue: coupon.discount_value,
    discountCents,
    eligibleCents,
  };
}
