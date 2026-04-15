"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { sendTicketEmail } from "@dbc/email";
import { revalidatePath } from "next/cache";

export async function createDoorSale(formData: FormData) {
  const user = await requireRole("team_member");
  const supabase = await createServerClient();

  const eventId = formData.get("event_id") as string;
  const tierId = formData.get("tier_id") as string;
  const rawName = (formData.get("attendee_name") as string) || "";
  const rawEmail = (formData.get("attendee_email") as string) || "";
  const attendeeName = rawName.trim();
  const hasRealEmail = rawEmail.trim().length > 0 && rawEmail.includes("@");
  const attendeeEmail = hasRealEmail
    ? rawEmail.trim().toLowerCase()
    : `door-sale-${Date.now()}@no-email.local`;
  // Card-at-door is not integrated — all door sales are cash. Route card
  // buyers to the online checkout via the poster.
  const paymentMethod = "cash";
  const locale = formData.get("locale") as string;

  if (!attendeeName) {
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

  // Upsert contact (only if we have a real email)
  const [firstName, ...rest] = attendeeName.split(/\s+/);
  const lastName = rest.join(" ");
  let contactId: string | null = null;
  if (hasRealEmail) {
    const { data: contactIdData } = await supabase.rpc(
      "upsert_contact_from_checkout",
      {
        p_email: attendeeEmail,
        p_first_name: firstName,
        p_last_name: lastName || null,
        p_auto_category_slug: "event_attendees",
      }
    );
    contactId = (contactIdData as string | null) ?? null;
  }

  // Create order (status: paid, marked as door_sale)
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      buyer_id: null,
      contact_id: contactId,
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
    contact_id: contactId,
    attendee_name: attendeeName,
    attendee_first_name: firstName || null,
    attendee_last_name: lastName || null,
    attendee_email: attendeeEmail,
  });

  if (ticketError) {
    return { error: "Failed to create ticket." };
  }

  // Email the PDF immediately (only if we have a real inbox to send to)
  if (hasRealEmail) {
    try {
      await deliverDoorSaleTicket(supabase, order.id, locale);
    } catch (err) {
      console.error("Door-sale email delivery failed:", err);
      // Don't fail the sale — ticket exists, staff can resend from contact profile
    }
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

/**
 * Voids a door-sale order: deletes tickets, restores tier inventory, and marks
 * the order status "refunded". Intended for the "I mistyped" undo flow right
 * after a sale — only allows voids on door_sale orders.
 */
export async function voidDoorSale(orderId: string, locale: string) {
  const user = await requireRole("team_member");
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function deliverDoorSaleTicket(supabase: any, orderId: string, locale: string) {
  const [{ data: ticket }, { data: event }, { data: companyInfo }] = await Promise.all([
    supabase
      .from("tickets")
      .select(
        "id, ticket_token, attendee_name, attendee_email, tier:ticket_tiers(name_en, name_de, name_fr)"
      )
      .eq("order_id", orderId)
      .single(),
    supabase
      .from("orders")
      .select(
        "event:events(title_en, title_de, title_fr, event_type, starts_at, ends_at, venue_name, venue_address, city, timezone), acquisition_type"
      )
      .eq("id", orderId)
      .single(),
    supabase
      .from("company_info")
      .select(
        "brand_name, legal_name, legal_form, support_email, primary_color, logo_light_url"
      )
      .eq("id", 1)
      .maybeSingle(),
  ]);

  if (!ticket || !event?.event) return;

  const loc = (locale as "en" | "de" | "fr") || "en";
  const eventTitle = event.event[`title_${loc}`] || event.event.title_en;
  const tierName = ticket.tier?.[`name_${loc}`] || ticket.tier?.name_en || "Ticket";
  const legalName = companyInfo
    ? [companyInfo.legal_name, companyInfo.legal_form].filter(Boolean).join(" ")
    : undefined;

  const result = await sendTicketEmail({
    attendeeName: ticket.attendee_name,
    attendeeEmail: ticket.attendee_email,
    eventTitle,
    eventType: event.event.event_type,
    startsAt: new Date(event.event.starts_at),
    endsAt: new Date(event.event.ends_at),
    venueName: event.event.venue_name ?? "",
    venueAddress: event.event.venue_address ?? "",
    city: event.event.city ?? "",
    timezone: event.event.timezone,
    tierName,
    ticketToken: ticket.ticket_token,
    locale: loc,
    orderUrl: `${process.env.NEXT_PUBLIC_TICKETS_URL ?? "https://ticket.dbc-germany.com"}/${loc}/confirmation/${orderId}`,
    brandName: companyInfo?.brand_name ?? undefined,
    legalName,
    supportEmail: companyInfo?.support_email ?? undefined,
    primaryColor: companyInfo?.primary_color ?? undefined,
    logoUrl: companyInfo?.logo_light_url ?? undefined,
    isInvitation: event.acquisition_type === "invited" || event.acquisition_type === "assigned",
  });

  await supabase
    .from("tickets")
    .update({
      pdf_url: `sent:${new Date().toISOString()}`,
      email_message_id: result?.id ?? null,
    })
    .eq("id", ticket.id);

  await supabase
    .from("orders")
    .update({ email_sent_at: new Date().toISOString() })
    .eq("id", orderId);
}
