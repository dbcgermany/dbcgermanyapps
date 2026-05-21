"use server";

import React from "react";
import { createServerClient, requireRole } from "@dbc/supabase/server";
import {
  render,
  TicketDeliveryEmail,
  InvitationEmail,
  DEFAULT_INVITATION_BODY,
  formalSalutation,
  formalClosing,
} from "@dbc/email";
import { getEventTiers } from "./door-sale";

type Locale = "en" | "de" | "fr";

export async function renderEmailPreview(
  eventId: string,
  locale: Locale
): Promise<{ ticketHtml: string; invitationHtml: string }> {
  await requireRole("manager");
  const supabase = await createServerClient();

  const [eventRes, companyRes] = await Promise.all([
    supabase
      .from("events")
      .select(
        "id, title_en, title_de, title_fr, event_type, starts_at, ends_at, venue_name, venue_address, city, timezone"
      )
      .eq("id", eventId)
      .single(),
    supabase
      .from("company_info")
      .select("brand_name, legal_name, support_email, primary_color, logo_light_url")
      .eq("id", 1)
      .maybeSingle(),
  ]);

  if (!eventRes.data) throw new Error("Event not found");
  const event = eventRes.data;
  const company = companyRes.data;

  const tiers = await getEventTiers(eventId);
  const title =
    (event[`title_${locale}` as keyof typeof event] as string) ||
    event.title_en;
  const tierName =
    tiers.length > 0
      ? ((tiers[0][`name_${locale}` as keyof (typeof tiers)[0]] as string) ||
        tiers[0].name_en)
      : "General Admission";

  const eventDate = new Date(event.starts_at).toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const eventTime = `${new Date(event.starts_at).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  })} \u2013 ${new Date(event.ends_at).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

  // Synthetic preview catering URL so the dedicated "choose my meal"
  // section renders in the inline preview surface (in-prod, the URL is
  // resolved per ticket by computeCateringUrl).
  const previewCateringUrl = `https://tickets.dbc-germany.com/${locale}/tickets/preview-ticket-token-0000/catering`;

  // Render ticket delivery email
  const ticketHtml = await render(
    React.createElement(TicketDeliveryEmail, {
      attendeeName: "Jane Doe",
      eventTitle: title,
      eventDate,
      eventTime,
      venueName: event.venue_name ?? "Venue",
      venueAddress: event.venue_address ?? "",
      tierName,
      ticketShortId: "ABCD1234",
      orderUrl: "https://tickets.dbc-germany.com",
      locale,
      logoUrl: company?.logo_light_url ?? undefined,
      cateringUrl: previewCateringUrl,
    })
  );

  // Render invitation email
  const salutation = formalSalutation(locale, "female", "Dr.", "Musterfrau", "Erika");
  const closing = formalClosing(locale);
  const bodyText = DEFAULT_INVITATION_BODY[locale]
    .replace(/\{event\}/g, title)
    .replace(/\{date\}/g, eventDate)
    .replace(/\{venue\}/g, event.venue_name ?? "Venue");

  const invitationHtml = await render(
    React.createElement(InvitationEmail, {
      salutation,
      closing,
      bodyText,
      eventTitle: title,
      eventDate,
      eventTime,
      venueName: event.venue_name ?? "Venue",
      venueAddress: event.venue_address ?? "",
      tierName,
      ticketShortId: "ABCD1234",
      orderUrl: "https://tickets.dbc-germany.com",
      locale,
      senderName: "DBC Germany Team",
      senderTitle: "Event Management",
      logoUrl: company?.logo_light_url ?? undefined,
      cateringUrl: previewCateringUrl,
    })
  );

  return { ticketHtml, invitationHtml };
}
