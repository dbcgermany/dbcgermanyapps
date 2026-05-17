import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import {
  BriefingPackPdf,
  type BriefingPackPdfProps,
} from "./briefing-pack-pdf";

export interface GenerateBriefingPackInput {
  attendeeName: string;
  eventTitle: string;
  startsAt: Date;
  endsAt: Date;
  venueName: string;
  venueAddress: string;
  city: string;
  locale: "en" | "de" | "fr";
  brandName?: string;
  legalName?: string;
  supportEmail?: string;
  primaryColor?: string;
  logoUrl?: string;
}

export async function generateBriefingPackPdf(
  input: GenerateBriefingPackInput
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

  const props: BriefingPackPdfProps = {
    attendeeName: input.attendeeName,
    eventTitle: input.eventTitle,
    eventDate,
    eventTime,
    venueName: input.venueName,
    venueAddress: input.venueAddress,
    city: input.city,
    locale: input.locale,
    brandName: input.brandName,
    legalName: input.legalName,
    supportEmail: input.supportEmail,
    primaryColor: input.primaryColor,
    logoUrl: input.logoUrl,
  };

  const pdfBuffer = await renderToBuffer(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    React.createElement(BriefingPackPdf, props) as any
  );

  return pdfBuffer;
}
