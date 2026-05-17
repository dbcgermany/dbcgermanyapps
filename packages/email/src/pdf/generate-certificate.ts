import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import {
  CertificatePdf,
  type CertificatePdfProps,
} from "./certificate-pdf";

export interface GenerateCertificateInput {
  attendeeName: string;
  eventTitle: string;
  eventDate: Date;
  venueCity: string;
  /**
   * Visible certificate ID. Recommend passing the first 8 chars of
   * `tickets.ticket_token` so attendees can quote it to support and we can
   * trace back to the ticket without exposing the full token.
   */
  certificateId: string;
  /**
   * When the certificate was issued. Defaults to `new Date()` if omitted.
   * Pass through so retries don't keep re-stamping the rendered PDF.
   */
  issuedAt?: Date;
  locale: "en" | "de" | "fr";
  brandName?: string;
  primaryColor?: string;
  logoUrl?: string;
}

export async function generateCertificatePdf(
  input: GenerateCertificateInput
): Promise<Buffer> {
  const eventDate = input.eventDate.toLocaleDateString(input.locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const issuedDate = (input.issuedAt ?? new Date()).toLocaleDateString(
    input.locale,
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  const props: CertificatePdfProps = {
    attendeeName: input.attendeeName,
    eventTitle: input.eventTitle,
    eventDate,
    venueCity: input.venueCity,
    certificateId: input.certificateId,
    issuedDate,
    locale: input.locale,
    brandName: input.brandName,
    primaryColor: input.primaryColor,
    logoUrl: input.logoUrl,
  };

  const pdfBuffer = await renderToBuffer(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    React.createElement(CertificatePdf, props) as any
  );

  return pdfBuffer;
}
