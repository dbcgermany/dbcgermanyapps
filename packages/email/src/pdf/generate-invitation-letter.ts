import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { InvitationLetterPdf } from "./invitation-letter-pdf";

export interface GenerateInvitationLetterInput {
  // Branding
  brandName?: string;
  legalName?: string;
  legalForm?: string;
  primaryColor?: string;
  logoUrl?: string;
  // Sender
  senderLine1?: string;
  senderPostalCode?: string;
  senderCity?: string;
  senderCountry?: string;
  senderPhone?: string;
  supportEmail?: string;
  // Bank details — footer block (optional)
  accountHolder?: string;
  iban?: string;
  bic?: string;
  bankName?: string;
  // Recipient
  recipientName: string;
  recipientEmail?: string;
  // Letter content
  salutation: string;
  closing: string;
  bodyText: string;
  // Event
  eventTitle: string;
  startsAt: Date;
  endsAt: Date;
  venueName: string;
  venueAddress: string;
  tierName: string;
  ticketShortId: string;
  // Meta
  locale: "en" | "de" | "fr";
}

export async function generateInvitationLetterPdf(
  input: GenerateInvitationLetterInput
): Promise<Buffer> {
  const eventDate = input.startsAt.toLocaleDateString(input.locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const eventTime = `${input.startsAt.toLocaleTimeString(input.locale, {
    hour: "2-digit",
    minute: "2-digit",
  })} – ${input.endsAt.toLocaleTimeString(input.locale, {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
  const letterDate = new Date().toLocaleDateString(input.locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const pdfBuffer = await renderToBuffer(
    React.createElement(InvitationLetterPdf, {
      brandName: input.brandName || "DBC Germany",
      legalName: input.legalName || "DBC Germany",
      legalForm: input.legalForm,
      primaryColor: input.primaryColor || "#c8102e",
      logoUrl: input.logoUrl,
      senderLine1: input.senderLine1,
      senderPostalCode: input.senderPostalCode,
      senderCity: input.senderCity,
      senderCountry: input.senderCountry,
      senderPhone: input.senderPhone,
      supportEmail: input.supportEmail || "info@dbc-germany.com",
      accountHolder: input.accountHolder,
      iban: input.iban,
      bic: input.bic,
      bankName: input.bankName,
      recipientName: input.recipientName,
      recipientEmail: input.recipientEmail,
      salutation: input.salutation,
      closing: input.closing,
      bodyText: input.bodyText,
      eventTitle: input.eventTitle,
      eventDate,
      eventTime,
      venueName: input.venueName,
      venueAddress: input.venueAddress,
      tierName: input.tierName,
      ticketShortId: input.ticketShortId,
      locale: input.locale,
      letterDate,
    }) as any // eslint-disable-line @typescript-eslint/no-explicit-any
  );

  return pdfBuffer;
}
