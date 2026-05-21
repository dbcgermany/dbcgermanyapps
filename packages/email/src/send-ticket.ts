import { render } from "@react-email/components";
import React from "react";
import { createEmailClient, fromAddressFor, replyToAddressFor } from "./client";
import { generateTicketPdf } from "./pdf/generate-ticket";
import { generateInvitationLetterPdf } from "./pdf/generate-invitation-letter";
import { generateBriefingPackPdf } from "./pdf/generate-briefing-pack";
import {
  generateSponsorsPdf,
  type SponsorRow,
} from "./pdf/generate-sponsors";
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
  legalForm?: string;
  supportEmail?: string;
  primaryColor?: string;
  logoUrl?: string;
  // Sender postal address — used for the formal invitation letter
  senderLine1?: string;
  senderPostalCode?: string;
  senderCity?: string;
  senderCountry?: string;
  senderPhone?: string;
  // Bank details — optional, shown in invitation letter footer
  accountHolder?: string;
  iban?: string;
  bic?: string;
  bankName?: string;
  isInvitation?: boolean;
  // Formal invitation fields (only used when isInvitation === true)
  gender?: "female" | "male" | "diverse" | null;
  title?: string | null;
  lastName?: string | null;
  customBody?: string | null;
  /**
   * Optional transfer surface. When both fields are set AND the cutoff is
   * still in the future, the informal ticket-delivery email renders a small
   * "Plans changed? Transfer this ticket…" notice with a link to /transfer.
   * Suppressed for invitation emails.
   */
  transferUrl?: string;
  transferCutoffDate?: string; // pre-formatted in the caller's locale
  /**
   * When true, generates and attaches the Briefing Pack PDF (Essen guide,
   * languages, dress code, glossary). Skipped for invitation emails.
   */
  includeBriefingPack?: boolean;
  /**
   * Confirmed sponsors for this event. When the array is non-empty, the
   * email gets a third attachment: the trilingual Sponsors PDF. Caller
   * passes the locale-agnostic rows; we localize inside the generator.
   */
  sponsors?: SponsorRow[];
  /**
   * "Add to Google Wallet" deep link. When present, renders a second CTA
   * button next to "View order online" in the email. Caller drops the
   * prop when GOOGLE_WALLET_ISSUER_ID is unset on the deployment.
   */
  googleWalletUrl?: string;
  /**
   * Per-ticket catering pre-order URL. When set, the informal and formal
   * templates both render a dedicated "choose your meal" section + CTA.
   * Use `computeCateringUrl()` from this package to derive it from
   * event.catering_enabled / tier.catering_included / catering_eligible_roles.
   */
  cateringUrl?: string;
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

  let letterBuffer: Buffer | null = null;

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

    // Generate formal invitation letter PDF (in parallel with HTML render)
    const [html, invLetterPdf] = await Promise.all([
      render(
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
          logoUrl: input.logoUrl,
          cateringUrl: input.cateringUrl,
        })
      ),
      generateInvitationLetterPdf({
        salutation,
        closing,
        bodyText,
        eventTitle: input.eventTitle,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        venueName: input.venueName,
        venueAddress: input.venueAddress,
        tierName: input.tierName,
        ticketShortId,
        locale: input.locale,
        brandName: input.brandName,
        legalName: input.legalName,
        legalForm: input.legalForm,
        senderLine1: input.senderLine1,
        senderPostalCode: input.senderPostalCode,
        senderCity: input.senderCity,
        senderCountry: input.senderCountry,
        senderPhone: input.senderPhone,
        supportEmail: input.supportEmail,
        accountHolder: input.accountHolder,
        iban: input.iban,
        bic: input.bic,
        bankName: input.bankName,
        primaryColor: input.primaryColor,
        logoUrl: input.logoUrl,
        recipientName: input.attendeeName,
        recipientEmail: input.attendeeEmail,
      }),
    ]);

    emailHtml = html;
    letterBuffer = invLetterPdf;

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
        logoUrl: input.logoUrl,
        transferUrl: input.transferUrl,
        transferCutoffDate: input.transferCutoffDate,
        googleWalletUrl: input.googleWalletUrl,
        cateringUrl: input.cateringUrl,
      })
    );

    subject = SUBJECT_TRANSLATIONS[input.locale].replace(
      "{event}",
      input.eventTitle
    );
  }

  // 3b. Optionally generate the Briefing Pack PDF as a second attachment.
  // Skipped for invitation emails (different audience, different tone) and
  // when the caller opts out.
  let briefingPackBuffer: Buffer | null = null;
  if (input.includeBriefingPack && !input.isInvitation) {
    try {
      briefingPackBuffer = await generateBriefingPackPdf({
        attendeeName: input.attendeeName,
        eventTitle: input.eventTitle,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        venueName: input.venueName,
        venueAddress: input.venueAddress,
        city: input.city,
        locale: input.locale,
        brandName: input.brandName,
        legalName: input.legalName,
        supportEmail: input.supportEmail,
        primaryColor: input.primaryColor,
        logoUrl: input.logoUrl,
      });
    } catch (err) {
      // Briefing Pack is a "nice to have" attachment — never let its
      // failure block the ticket itself from going out.
      console.error("Briefing Pack generation failed:", err);
      briefingPackBuffer = null;
    }
  }

  // 3c. Optionally generate the Sponsors PDF as a third attachment.
  // Renders only when the caller passed at least one confirmed sponsor;
  // suppressed for invitation emails to keep the formal letter clean.
  let sponsorsBuffer: Buffer | null = null;
  if (
    !input.isInvitation &&
    input.sponsors &&
    input.sponsors.length > 0
  ) {
    try {
      sponsorsBuffer = await generateSponsorsPdf({
        eventTitle: input.eventTitle,
        startsAt: input.startsAt,
        city: input.city,
        sponsors: input.sponsors,
        locale: input.locale,
        brandName: input.brandName,
        primaryColor: input.primaryColor,
        logoUrl: input.logoUrl,
      });
    } catch (err) {
      // Same posture as the Briefing Pack — failure must not block delivery.
      console.error("Sponsors PDF generation failed:", err);
      sponsorsBuffer = null;
    }
  }

  // 4. Send via Resend
  const resend = createEmailClient();
  const fromAddress = fromAddressFor("tickets");

  const result = await resend.emails.send({
    from: fromAddress,
    replyTo: replyToAddressFor("tickets"),
    to: input.attendeeEmail,
    subject,
    html: emailHtml,
    attachments: [
      ...(letterBuffer
        ? [{ filename: `invitation-${ticketShortId}.pdf`, content: letterBuffer }]
        : []),
      {
        filename: `ticket-${ticketShortId}.pdf`,
        content: pdfBuffer,
      },
      ...(briefingPackBuffer
        ? [
            {
              filename: `briefing-pack-${input.locale}.pdf`,
              content: briefingPackBuffer,
            },
          ]
        : []),
      ...(sponsorsBuffer
        ? [
            {
              filename: `sponsors-${input.locale}.pdf`,
              content: sponsorsBuffer,
            },
          ]
        : []),
    ],
  });

  if (result.error) {
    throw new Error(`Resend error: ${JSON.stringify(result.error)}`);
  }

  return { id: result.data?.id ?? "" };
}
