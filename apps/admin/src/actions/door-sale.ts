"use server";

import { createServerClient, notifyAdmins, requireRole } from "@dbc/supabase/server";
import { CONTACT_CATEGORY } from "@dbc/types";
import { generateTicketPdf, sendTicketsForOrder } from "@dbc/email";
import { captureServerError } from "@/lib/observe";
import { revalidatePath } from "next/cache";

/** Placeholder addresses synthesised before email was required. */
const PLACEHOLDER_EMAIL_SUFFIX = "@no-email.local";

export async function createDoorSale(formData: FormData) {
  const user = await requireRole("door_sales");
  const supabase = await createServerClient();

  const eventId = formData.get("event_id") as string;
  const tierId = formData.get("tier_id") as string;
  const rawName = (formData.get("attendee_name") as string) || "";
  const rawEmail = (formData.get("attendee_email") as string) || "";
  const attendeeName = rawName.trim();
  const attendeeEmail = rawEmail.trim().toLowerCase();
  const rawPayment = (formData.get("payment_method") as string) || "cash";
  const paymentMethod = rawPayment === "comp" ? null : rawPayment;
  const isComp = rawPayment === "comp";
  const locale = formData.get("locale") as string;

  if (!attendeeName) {
    return { error: "Attendee name is required." };
  }
  // Email is required so the ticket PDF + QR can actually reach the buyer.
  // Historic behaviour synthesised a `door-sale-<ts>@no-email.local` placeholder
  // which silently skipped delivery — never again.
  if (!attendeeEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(attendeeEmail)) {
    return {
      error:
        "A valid attendee email is required so the ticket PDF + QR can be delivered.",
    };
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

  // Upsert contact — email is now guaranteed to be real, so every sale
  // attaches to a contact row (dedupes by email at the RPC layer).
  const [firstName, ...rest] = attendeeName.split(/\s+/);
  const lastName = rest.join(" ");
  let contactId: string | null = null;
  const { data: contactIdData } = await supabase.rpc(
    "upsert_contact_from_checkout",
    {
      p_email: attendeeEmail,
      p_first_name: firstName,
      p_last_name: lastName || null,
      p_auto_category_slug: CONTACT_CATEGORY.event_attendees,
    }
  );
  contactId = (contactIdData as string | null) ?? null;

  // Create order
  const totalCents = isComp ? 0 : tier.price_cents;
  const orderStatus = isComp ? "comped" : "paid";
  const acquisitionType = isComp ? "assigned" : "door_sale";

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      buyer_id: null,
      contact_id: contactId,
      event_id: eventId,
      sold_by: user.userId,
      subtotal_cents: isComp ? 0 : tier.price_cents,
      discount_cents: 0,
      total_cents: totalCents,
      status: orderStatus,
      acquisition_type: acquisitionType,
      payment_method: paymentMethod,
      recipient_email: attendeeEmail,
      recipient_name: attendeeName,
      locale,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    // Rollback: release the seat we just reserved. release_tickets is atomic
    // — using a raw write of `quantity_sold` would corrupt counts under
    // concurrent door sales.
    await supabase.rpc("release_tickets", {
      p_tier_id: tierId,
      p_quantity: 1,
    });
    return { error: "Failed to create order." };
  }

  // Create ticket (already paid, ready for immediate entry)
  const { error: ticketError } = await supabase.from("tickets").insert({
    order_id: order.id,
    event_id: eventId,
    tier_id: tierId,
    contact_id: contactId,
    attendee_name: attendeeName,
    attendee_first_name: firstName || null,
    attendee_last_name: lastName || null,
    attendee_email: attendeeEmail,
  });

  if (ticketError) {
    // Order row exists but ticket failed — roll the order back AND release
    // the inventory so we don't leave a zombie paid-no-ticket.
    await supabase.from("orders").delete().eq("id", order.id);
    await supabase.rpc("release_tickets", {
      p_tier_id: tierId,
      p_quantity: 1,
    });
    return { error: "Failed to create ticket." };
  }

  if (contactId) {
    await supabase
      .from("contact_event_involvements")
      .upsert(
        {
          contact_id: contactId,
          event_id: eventId,
          role: "attendee",
          added_by: user.userId,
        },
        { onConflict: "contact_id,event_id,role", ignoreDuplicates: false }
      );
  }

  // Email the PDF immediately via the SHARED helper that the public Stripe
  // webhook + free-order flow also call. Same template, same PDF, same QR —
  // a manually-sold ticket and an online-bought ticket are byte-for-byte
  // identical to the recipient. Email is required upstream so this always
  // fires. Failure here doesn't roll back the sale.
  try {
    await sendTicketsForOrder(supabase, order.id, {
      onError: (e, ctx) =>
        captureServerError(e, { scope: "door_sale_send_ticket", data: ctx }),
    });
  } catch (err) {
    console.error("Door-sale email delivery failed:", err);
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
      amount_cents: totalCents,
      payment_method: rawPayment,
    },
  });

  // Admin-wide notification (respects preferences). Off by default for
  // most operators — the person making the sale already knows — but
  // useful for managers tracking door-revenue in real time.
  try {
    await notifyAdmins(supabase, {
      type: "door_sale",
      title: `Door sale · ${attendeeName}`,
      body: `${tier.name_en} — €${(totalCents / 100).toFixed(2)} (${rawPayment})`,
      data: {
        order_id: order.id,
        event_id: tier.event_id,
        tier_id: tier.id,
        amount_cents: totalCents,
      },
    });
  } catch (err) {
    console.error("door_sale notification failed:", err);
  }

  revalidatePath(`/${locale}/door-sale`);
  return { success: true, orderId: order.id };
}

/**
 * Voids a door-sale order: deletes tickets, restores tier inventory, and marks
 * the order status "refunded". Intended for the "I mistyped" undo flow right
 * after a sale — only allows voids on door_sale orders.
 */
export async function voidDoorSale(orderId: string, locale: string) {
  const user = await requireRole("door_sales");
  const supabase = await createServerClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, acquisition_type, status, event_id, total_cents")
    .eq("id", orderId)
    .single();

  if (!order) return { error: "Order not found" };
  if (order.acquisition_type !== "door_sale") {
    return { error: "Only door-sale orders can be voided from here." };
  }
  if (order.status === "refunded") {
    return { error: "Order already voided." };
  }

  // Restore inventory per tier
  const { data: tickets } = await supabase
    .from("tickets")
    .select("id, tier_id")
    .eq("order_id", orderId);

  if (tickets) {
    const tierCounts: Record<string, number> = {};
    for (const t of tickets) {
      tierCounts[t.tier_id] = (tierCounts[t.tier_id] || 0) + 1;
    }
    for (const [tierId, qty] of Object.entries(tierCounts)) {
      const { data: tier } = await supabase
        .from("ticket_tiers")
        .select("quantity_sold")
        .eq("id", tierId)
        .single();
      if (tier) {
        await supabase
          .from("ticket_tiers")
          .update({
            quantity_sold: Math.max(0, tier.quantity_sold - qty),
          })
          .eq("id", tierId);
      }
    }
  }

  await supabase.from("tickets").delete().eq("order_id", orderId);
  await supabase
    .from("orders")
    .update({ status: "refunded" })
    .eq("id", orderId);

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "void_door_sale",
    entity_type: "orders",
    entity_id: orderId,
    details: { amount_cents: order.total_cents, event_id: order.event_id },
  });

  revalidatePath(`/${locale}/door-sale`);
  return { success: true };
}

export async function getDoorSaleEvents(mode: "door" | "advance" = "door") {
  await requireRole("door_sales");
  const supabase = await createServerClient();

  let query = supabase
    .from("events")
    .select(
      "id, title_en, title_de, title_fr, starts_at, ends_at, venue_name"
    )
    .gte("ends_at", new Date().toISOString());

  if (mode === "door") {
    // Door sale opens 30 days before the event and stays open until the event
    // ends. The public checkout flow is the day-of buyers' path; staff use this
    // screen to ring cash/card sales at the venue.
    query = query.lte("starts_at", new Date(Date.now() + 30 * 86400000).toISOString());
  }
  // "advance" mode: any upcoming event (no starts_at restriction)

  const { data } = await query.order("starts_at", { ascending: true });
  return data ?? [];
}

export async function getEventTiers(eventId: string) {
  await requireRole("door_sales");
  const supabase = await createServerClient();

  const { data } = await supabase
    .from("ticket_tiers")
    .select("id, name_en, name_de, name_fr, price_cents, max_quantity, quantity_sold")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });

  return data ?? [];
}

// Note: ticket delivery (template, PDF, QR, idempotency, message-ID stamp)
// is the shared @dbc/email `sendTicketsForOrder` helper — same one the
// online Stripe webhook calls. No admin-local duplicate.

// ---------------------------------------------------------------------------
// Post-sale "Download PDF" — staff can hand the buyer a printed ticket on the
// spot while the email is also in flight. Re-renders the same PDF the email
// path attaches (identical QR code derived from the ticket_token).
// ---------------------------------------------------------------------------
export async function downloadDoorSaleTicketPdf(
  orderId: string,
  locale: string
): Promise<
  { pdfBase64: string; filename: string } | { error: string }
> {
  await requireRole("door_sales");
  const supabase = await createServerClient();

  const [{ data: ticket }, { data: order }, { data: companyInfo }] = await Promise.all([
    supabase
      .from("tickets")
      .select(
        "id, ticket_token, attendee_name, attendee_email, tier:ticket_tiers(name_en, name_de, name_fr)"
      )
      .eq("order_id", orderId)
      .maybeSingle(),
    supabase
      .from("orders")
      .select(
        "event:events(title_en, title_de, title_fr, event_type, starts_at, ends_at, venue_name, venue_address, city, timezone), acquisition_type"
      )
      .eq("id", orderId)
      .maybeSingle(),
    supabase
      .from("company_info")
      .select(
        "brand_name, legal_name, legal_form, support_email, primary_color, logo_light_url"
      )
      .eq("id", 1)
      .maybeSingle(),
  ]);

  if (!ticket || !order?.event) return { error: "Order or ticket not found." };

  // Supabase typed-join still infers FK embeds as arrays in some cases; flatten
  // to the single row both at the order/event level and the ticket/tier level
  // before we feed the PDF generator.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ev: any = Array.isArray(order.event) ? order.event[0] : order.event;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tr: any = Array.isArray(ticket.tier) ? ticket.tier[0] : ticket.tier;

  const loc = (locale === "de" || locale === "fr" ? locale : "en") as
    | "en"
    | "de"
    | "fr";
  const eventTitle = ev[`title_${loc}`] || ev.title_en;
  const tierName = tr?.[`name_${loc}`] || tr?.name_en || "Ticket";
  const legalName = companyInfo
    ? [companyInfo.legal_name, companyInfo.legal_form].filter(Boolean).join(" ")
    : undefined;

  const buffer = await generateTicketPdf({
    attendeeName: ticket.attendee_name,
    attendeeEmail: ticket.attendee_email,
    eventTitle: String(eventTitle),
    eventType: ev.event_type,
    startsAt: new Date(ev.starts_at),
    endsAt: new Date(ev.ends_at),
    venueName: ev.venue_name ?? "",
    venueAddress: ev.venue_address ?? "",
    city: ev.city ?? "",
    timezone: ev.timezone,
    tierName: String(tierName),
    ticketToken: ticket.ticket_token,
    locale: loc,
    brandName: companyInfo?.brand_name ?? undefined,
    legalName,
    supportEmail: companyInfo?.support_email ?? undefined,
    primaryColor: companyInfo?.primary_color ?? undefined,
    logoUrl: companyInfo?.logo_light_url ?? undefined,
    isInvitation:
      order.acquisition_type === "invited" ||
      order.acquisition_type === "assigned",
  });

  const shortId = ticket.ticket_token.slice(0, 8).toUpperCase();
  return {
    pdfBase64: buffer.toString("base64"),
    filename: `ticket-${shortId}.pdf`,
  };
}

// ---------------------------------------------------------------------------
// Backfill — orders whose attendee_email is still the legacy
// `door-sale-<ts>@no-email.local` placeholder from before email was required.
// The page surfaces these so staff can fix them one-by-one and trigger a
// resend instead of leaving paid attendees without a ticket.
// ---------------------------------------------------------------------------
export interface PlaceholderOrderRow {
  order_id: string;
  ticket_id: string;
  created_at: string;
  attendee_name: string;
  attendee_email: string;
  event_title: string;
  event_starts_at: string;
  tier_name: string;
}

export async function listOrdersWithPlaceholderEmail(): Promise<
  PlaceholderOrderRow[]
> {
  await requireRole("door_sales");
  const supabase = await createServerClient();

  const { data } = await supabase
    .from("tickets")
    .select(
      `id, attendee_name, attendee_email, created_at,
       order:orders!inner(id, acquisition_type),
       event:events(title_en, starts_at),
       tier:ticket_tiers(name_en)`
    )
    .like("attendee_email", `%${PLACEHOLDER_EMAIL_SUFFIX}`)
    .order("created_at", { ascending: false })
    .limit(200);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[])
    .filter((t) => t.order?.acquisition_type === "door_sale")
    .map((t) => ({
      order_id: t.order.id,
      ticket_id: t.id,
      created_at: t.created_at,
      attendee_name: t.attendee_name,
      attendee_email: t.attendee_email,
      event_title: t.event?.title_en ?? "",
      event_starts_at: t.event?.starts_at ?? "",
      tier_name: t.tier?.name_en ?? "Ticket",
    }));
}

export async function updateAttendeeEmailAndResend(
  ticketId: string,
  newEmail: string,
  locale: string
): Promise<{ success: true } | { error: string }> {
  const user = await requireRole("door_sales");
  const supabase = await createServerClient();

  const normalized = newEmail.trim().toLowerCase();
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { error: "Please enter a valid email address." };
  }

  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .select("id, order_id, attendee_name, contact_id, event_id")
    .eq("id", ticketId)
    .single();
  if (ticketError || !ticket) return { error: "Ticket not found." };

  // Update both the ticket and the order so they stay in sync — the email
  // helper reads ticket.attendee_email, the dashboard reads orders.recipient_email.
  await supabase
    .from("tickets")
    .update({ attendee_email: normalized })
    .eq("id", ticketId);

  await supabase
    .from("orders")
    .update({ recipient_email: normalized })
    .eq("id", ticket.order_id);

  // Re-attach to a real contact (or merge if one already exists at this address).
  const nameParts = (ticket.attendee_name ?? "").trim().split(/\s+/);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || null;
  const { data: contactIdData } = await supabase.rpc(
    "upsert_contact_from_checkout",
    {
      p_email: normalized,
      p_first_name: firstName,
      p_last_name: lastName,
      p_auto_category_slug: CONTACT_CATEGORY.event_attendees,
    }
  );
  const newContactId = (contactIdData as string | null) ?? null;
  if (newContactId && newContactId !== ticket.contact_id) {
    await supabase
      .from("tickets")
      .update({ contact_id: newContactId })
      .eq("id", ticketId);
    await supabase
      .from("orders")
      .update({ contact_id: newContactId })
      .eq("id", ticket.order_id);
    if (ticket.event_id) {
      await supabase
        .from("contact_event_involvements")
        .upsert(
          {
            contact_id: newContactId,
            event_id: ticket.event_id,
            role: "attendee",
            added_by: user.userId,
          },
          { onConflict: "contact_id,event_id,role", ignoreDuplicates: false }
        );
    }
  }

  try {
    await sendTicketsForOrder(supabase, ticket.order_id, {
      forceResend: true,
      onError: (e, ctx) =>
        captureServerError(e, {
          scope: "door_sale_email_fix",
          data: ctx,
        }),
    });
  } catch (err) {
    console.error("Door-sale resend failed:", err);
    return { error: "Email could not be sent. Check Resend dashboard." };
  }

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "door_sale_email_fix",
    entity_type: "tickets",
    entity_id: ticketId,
    details: { new_email: normalized, order_id: ticket.order_id },
  });

  revalidatePath(`/${locale}/door-sale`);
  return { success: true };
}
