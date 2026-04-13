import { render } from "@react-email/components";
import React from "react";
import { createEmailClient } from "./client";
import { generateTicketPdf } from "./pdf/generate-ticket";
import { TicketDeliveryEmail } from "./templates/ticket-delivery";

export interface SendTicketEmailInput {
  // Recipient
  attendeeName: string;
  attendeeEmail: string;
  // Event
  eventTitle: string;
  eventType: string;
  startsAt: Date;
  endsAt: Date;
  venueName: string;
  venueAddress: string;
  city: string;
  timezone: string;
  // Tier
  tierName: string;
  // Ticket
  ticketToken: string;
  // Locale
  locale: "en" | "de" | "fr";
  // Where to view the order online
  orderUrl: string;
}

const SUBJECT_TRANSLATIONS = {
  en: "Your ticket for {event}",
  de: "Ihr Ticket f\u00FCr {event}",
  fr: "Votre billet pour {event}",
};

/**
 * Generates a PDF ticket and sends it via Resend with the PDF attached.
 * Returns the Resend message ID on success, or throws on failure.
 */
export async function sendTicketEmail(
  input: SendTicketEmailInput
): Promise<{ id: string }> {
  // 1. Generate PDF
  const pdfBuffer = await generateTicketPdf({
    eventTitle: input.eventTitle,
    eventType: input.eventType,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    venueName: input.venueName,
    venueAddress: input.venueAddress,
    city: input.city,
    timezone: input.timezone,
    attendeeName: input.attendeeName,
    attendeeEmail: input.attendeeEmail,
    tierName: input.tierName,
    ticketToken: input.ticketToken,
    locale: input.locale,
  });

  // 2. Render React Email template to HTML
  const eventDate = input.startsAt.toLocaleDateString(input.locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const eventTime = `${input.startsAt.toLocaleTimeString(input.locale, {
    hour: "2-digit",
    minute: "2-digit",
  })} \u2013 ${input.endsAt.toLocaleTimeString(input.locale, {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

  const emailHtml = await render(
    React.createElement(TicketDeliveryEmail, {
      attendeeName: input.attendeeName,
      eventTitle: input.eventTitle,
      eventDate,
      eventTime,
      venueName: input.venueName,
      venueAddress: input.venueAddress,
      tierName: input.tierName,
      ticketShortId: input.ticketToken.slice(0, 8).toUpperCase(),
      orderUrl: input.orderUrl,
      locale: input.locale,
    })
  );

  // 3. Build subject line
  const subject = SUBJECT_TRANSLATIONS[input.locale].replace(
    "{event}",
    input.eventTitle
  );

  // 4. Send via Resend
  const resend = createEmailClient();
  const fromAddress =
    process.env.RESEND_FROM_ADDRESS ?? "DBC Germany <tickets@dbc-germany.com>";

  const result = await resend.emails.send({
    from: fromAddress,
    to: input.attendeeEmail,
    subject,
    html: emailHtml,
    attachments: [
      {
        filename: `ticket-${input.ticketToken.slice(0, 8)}.pdf`,
        content: pdfBuffer,
      },
    ],
  });

  if (result.error) {
    throw new Error(`Resend error: ${result.error.message}`);
  }

  return { id: result.data?.id ?? "" };
}
