import { render } from "@react-email/components";
import React from "react";
import { createEmailClient, fromAddressFor } from "./client";
import { generateTicketPdf } from "./pdf/generate-ticket";
import { TicketDeliveryEmail } from "./templates/ticket-delivery";
import {
  InvitationEmail,
  DEFAULT_INVITATION_BODY,
} from "./templates/invitation-email";
import { formalSalutation, formalClosing } from "./salutation";

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
  // Branding — pulled from company_info at call time
  brandName?: string;
  legalName?: string;
  supportEmail?: string;
  primaryColor?: string;
  logoUrl?: string;
  isInvitation?: boolean;
  // Formal invitation fields (only used when isInvitation === true)
  gender?: "female" | "male" | "diverse" | null;
  title?: string | null;
  lastName?: string | null;
  customBody?: string | null;
}

const SUBJECT_TRANSLATIONS = {
  en: "Your ticket for {event}",
  de: "Ihr Ticket für {event}",
  fr: "Votre billet pour {event}",
};

const INVITATION_SUBJECT_TRANSLATIONS = {
  en: "Your invitation to {event}",
  de: "Ihre Einladung zu {event}",
  fr: "Votre invitation à {event}",
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
    brandName: input.brandName,
    legalName: input.legalName,
    supportEmail: input.supportEmail,
    primaryColor: input.primaryColor,
    logoUrl: input.logoUrl,
    isInvitation: input.isInvitation,
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

  const ticketShortId = input.ticketToken.slice(0, 8).toUpperCase();

  let emailHtml: string;
  let subject: string;

  if (input.isInvitation) {
    // Formal invitation email
    const salutation = formalSalutation(
      input.locale,
      input.gender,
      input.title,
      input.lastName,
      input.attendeeName
    );
    const closing = formalClosing(input.locale);

    // Build the body text: use custom body or default, then interpolate vars
    const rawBody =
      input.customBody?.trim() ||
      DEFAULT_INVITATION_BODY[input.locale];
    const bodyText = rawBody
      .replace(/\{event\}/g, input.eventTitle)
      .replace(/\{date\}/g, eventDate)
      .replace(/\{venue\}/g, input.venueName);

    emailHtml = await render(
      React.createElement(InvitationEmail, {
        salutation,
        closing,
        bodyText,
        eventTitle: input.eventTitle,
        eventDate,
        eventTime,
        venueName: input.venueName,
        venueAddress: input.venueAddress,
        tierName: input.tierName,
        ticketShortId,
        orderUrl: input.orderUrl,
        locale: input.locale,
        senderName: "DBC Germany Team",
        senderTitle: "Event Management",
      })
    );

    subject = INVITATION_SUBJECT_TRANSLATIONS[input.locale].replace(
      "{event}",
      input.eventTitle
    );
  } else {
    // Standard ticket delivery email (informal)
    emailHtml = await render(
      React.createElement(TicketDeliveryEmail, {
        attendeeName: input.attendeeName,
        eventTitle: input.eventTitle,
        eventDate,
        eventTime,
        venueName: input.venueName,
        venueAddress: input.venueAddress,
        tierName: input.tierName,
        ticketShortId,
        orderUrl: input.orderUrl,
        locale: input.locale,
      })
    );

    subject = SUBJECT_TRANSLATIONS[input.locale].replace(
      "{event}",
      input.eventTitle
    );
  }

  // 4. Send via Resend
  const resend = createEmailClient();
  const fromAddress = fromAddressFor("tickets");

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
