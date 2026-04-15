"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { sendTicketEmail } from "@dbc/email";
import { revalidatePath } from "next/cache";

export interface InvitationInput {
  eventId: string;
  tierId: string;
  firstName: string;
  lastName: string;
  email: string;
  country?: string | null;
  occupation?: string | null;
  extraCategoryTags?: string[];
  sendEmail?: boolean;
  note?: string;
  locale?: string;
}

export async function createInvitation(input: InvitationInput) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const email = input.email.trim().toLowerCase();
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const locale = input.locale || "en";
  const country = input.country?.trim().toUpperCase() || null;
  const occupation = input.occupation?.trim() || null;
  const extraTags = (input.extraCategoryTags ?? [])
    .map((t) => t.trim())
    .filter(Boolean);
  const sendEmail = input.sendEmail !== false;

  if (!email || !email.includes("@")) return { error: "A valid email is required." };
  if (!fullName) return { error: "At least a first name is required." };

  // Fetch tier + event
  const { data: tier } = await supabase
    .from("ticket_tiers")
    .select("id, event_id, price_cents, max_quantity, quantity_sold, name_en, name_de, name_fr")
    .eq("id", input.tierId)
    .single();
  if (!tier || tier.event_id !== input.eventId) return { error: "Invalid tier." };

  const { data: event } = await supabase
    .from("events")
    .select(
      "id, title_en, title_de, title_fr, event_type, starts_at, ends_at, venue_name, venue_address, city, timezone"
    )
    .eq("id", input.eventId)
    .single();
  if (!event) return { error: "Event not found." };

  // Reserve seat atomically
  const { data: reserved } = await supabase.rpc("reserve_tickets", {
    p_tier_id: input.tierId,
    p_quantity: 1,
  });
  if (!reserved) return { error: "That tier is sold out." };

  // Upsert contact + auto-tag as invited_guests, plus any extra tags from CSV
  const { data: contactId } = await supabase.rpc("upsert_contact_from_checkout", {
    p_email: email,
    p_first_name: firstName || null,
    p_last_name: lastName || null,
    p_country: country,
    p_occupation: occupation,
    p_auto_category_slug: "invited_guests",
    p_extra_category_slugs: extraTags,
  });

  // Create comped order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      buyer_id: null,
      contact_id: contactId as string | null,
      event_id: input.eventId,
      subtotal_cents: 0,
      discount_cents: 0,
      total_cents: 0,
      status: "comped",
      acquisition_type: "invited",
      payment_method: null,
      recipient_email: email,
      recipient_name: fullName,
      locale,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    await supabase.rpc("release_tickets", { p_tier_id: input.tierId, p_quantity: 1 });
    return { error: "Failed to create order." };
  }

  // Create ticket
  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .insert({
      order_id: order.id,
      event_id: input.eventId,
      tier_id: input.tierId,
      contact_id: contactId as string | null,
      attendee_name: fullName,
      attendee_first_name: firstName || null,
      attendee_last_name: lastName || null,
      attendee_email: email,
    })
    .select("id, ticket_token")
    .single();

  if (ticketError || !ticket) {
    await supabase.from("orders").update({ status: "cancelled" }).eq("id", order.id);
    await supabase.rpc("release_tickets", { p_tier_id: input.tierId, p_quantity: 1 });
    return { error: "Failed to create ticket." };
  }

  // Email the PDF
  const { data: companyInfo } = await supabase
    .from("company_info")
    .select(
      "brand_name, legal_name, legal_form, support_email, primary_color, logo_light_url"
    )
    .eq("id", 1)
    .maybeSingle();

  const loc = locale as "en" | "de" | "fr";
  const eventTitle =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((event as any)[`title_${loc}`] as string) || event.title_en;
  const tierName =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((tier as any)[`name_${loc}`] as string) || tier.name_en;

  if (!sendEmail) {
    await supabase.from("audit_log").insert({
      user_id: user.userId,
      action: "create_invitation",
      entity_type: "orders",
      entity_id: order.id,
      details: {
        email,
        fullName,
        tier: tier.name_en,
        note: input.note ?? null,
        email_skipped: true,
      },
    });
    revalidatePath(`/[locale]/events/${input.eventId}/invitations`, "layout");
    return { success: true, orderId: order.id };
  }

  try {
    const result = await sendTicketEmail({
      attendeeName: fullName,
      attendeeEmail: email,
      eventTitle,
      eventType: event.event_type,
      startsAt: new Date(event.starts_at),
      endsAt: new Date(event.ends_at),
      venueName: event.venue_name ?? "",
      venueAddress: event.venue_address ?? "",
      city: event.city ?? "",
      timezone: event.timezone,
      tierName,
      ticketToken: ticket.ticket_token,
      locale: loc,
      orderUrl: `${process.env.NEXT_PUBLIC_TICKETS_URL ?? "https://ticket.dbc-germany.com"}/${loc}/confirmation/${order.id}`,
      brandName: companyInfo?.brand_name ?? undefined,
      legalName: companyInfo
        ? [companyInfo.legal_name, companyInfo.legal_form].filter(Boolean).join(" ")
        : undefined,
      supportEmail: companyInfo?.support_email ?? undefined,
      primaryColor: companyInfo?.primary_color ?? undefined,
      logoUrl: companyInfo?.logo_light_url ?? undefined,
      isInvitation: true,
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
      .eq("id", order.id);
  } catch (err) {
    console.error("Invitation email failed:", err);
    // Ticket still exists; staff can resend from the contact profile.
  }

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "create_invitation",
    entity_type: "orders",
    entity_id: order.id,
    details: { email, fullName, tier: tier.name_en, note: input.note ?? null },
  });

  revalidatePath(`/[locale]/events/${input.eventId}/invitations`, "layout");
  return { success: true, orderId: order.id };
}

export async function listInvitationsForEvent(eventId: string) {
  await requireRole("manager");
  const supabase = await createServerClient();

  const { data } = await supabase
    .from("orders")
    .select(
      `id, recipient_name, recipient_email, created_at, email_sent_at, status,
       tickets(id, ticket_token, checked_in_at, attendee_name,
               tier:ticket_tiers(name_en))`
    )
    .eq("event_id", eventId)
    .eq("acquisition_type", "invited")
    .order("created_at", { ascending: false });

  return data ?? [];
}
