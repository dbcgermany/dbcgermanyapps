import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import {
  RunsheetPdf,
  type RunsheetPdfProps,
  type RunsheetPdfItem,
} from "./runsheet-pdf";

export interface GenerateRunsheetInput {
  eventTitle: string;
  eventStartsAt: Date;
  eventVenue?: string;
  items: RunsheetPdfItem[];
  locale: "en" | "de" | "fr";
  brandName?: string;
  legalName?: string;
  supportEmail?: string;
  primaryColor?: string;
  logoUrl?: string;
}

export async function generateRunsheetPdf(
  input: GenerateRunsheetInput
): Promise<Buffer> {
  const eventDate = input.eventStartsAt.toLocaleDateString(input.locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const generatedDate = new Date().toLocaleString(input.locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const props: RunsheetPdfProps = {
    eventTitle: input.eventTitle,
    eventDate,
    eventVenue: input.eventVenue,
    items: input.items,
    locale: input.locale,
    generatedDate,
    brandName: input.brandName || "DBC Germany",
    legalName: input.legalName || "DBC Germany",
    supportEmail: input.supportEmail || "info@dbc-germany.com",
    primaryColor: input.primaryColor,
    logoUrl: input.logoUrl,
  };

  const pdfBuffer = await renderToBuffer(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    React.createElement(RunsheetPdf, props) as any
  );

  return pdfBuffer;
}
