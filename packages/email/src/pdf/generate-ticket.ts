import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { TicketPdf } from "./ticket-pdf";
import React from "react";

export interface GenerateTicketInput {
  eventTitle: string;
  eventType: string;
  startsAt: Date;
  endsAt: Date;
  venueName: string;
  venueAddress: string;
  city: string;
  timezone: string;
  attendeeName: string;
  attendeeEmail: string;
  tierName: string;
  ticketToken: string;
  locale: "en" | "de" | "fr";
}

/**
 * Generates a PDF ticket as a Buffer.
 * The QR code embeds the ticket_token (uuid) which scanners use to look up
 * the ticket in the database via the check_in_ticket() RPC.
 */
export async function generateTicketPdf(
  input: GenerateTicketInput
): Promise<Buffer> {
  // Generate QR code as data URL
  const qrDataUrl = await QRCode.toDataURL(input.ticketToken, {
    errorCorrectionLevel: "M",
    width: 320,
    margin: 1,
    color: {
      dark: "#111111",
      light: "#ffffff",
    },
  });

  // Render PDF (cast required because @react-pdf/renderer's TS types
  // expect a DocumentProps element, but TicketPdf returns a Document
  // internally — runtime works correctly).
  const pdfBuffer = await renderToBuffer(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    React.createElement(TicketPdf, { ...input, qrDataUrl }) as any
  );

  return pdfBuffer;
}
