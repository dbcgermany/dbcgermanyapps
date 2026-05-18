import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import {
  OutcomesWorksheetPdf,
  type OutcomesWorksheetPdfProps,
} from "./outcomes-worksheet-pdf";

export interface GenerateOutcomesWorksheetInput {
  locale: "en" | "de" | "fr";
  brandName?: string;
  legalName?: string;
  supportEmail?: string;
  primaryColor?: string;
  logoUrl?: string;
  attendeeName?: string | null;
}

export async function generateOutcomesWorksheetPdf(
  input: GenerateOutcomesWorksheetInput
): Promise<Buffer> {
  const props: OutcomesWorksheetPdfProps = {
    locale: input.locale,
    brandName: input.brandName,
    legalName: input.legalName,
    supportEmail: input.supportEmail,
    primaryColor: input.primaryColor,
    logoUrl: input.logoUrl,
    attendeeName: input.attendeeName ?? null,
  };

  const pdfBuffer = await renderToBuffer(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    React.createElement(OutcomesWorksheetPdf, props) as any
  );

  return pdfBuffer;
}
