import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import {
  GlossaryCardPdf,
  type GlossaryCardPdfProps,
} from "./glossary-card-pdf";

export interface GenerateGlossaryCardInput {
  locale: "en" | "de" | "fr";
  brandName?: string;
  legalName?: string;
  supportEmail?: string;
  primaryColor?: string;
  logoUrl?: string;
}

export async function generateGlossaryCardPdf(
  input: GenerateGlossaryCardInput
): Promise<Buffer> {
  const props: GlossaryCardPdfProps = {
    locale: input.locale,
    brandName: input.brandName,
    legalName: input.legalName,
    supportEmail: input.supportEmail,
    primaryColor: input.primaryColor,
    logoUrl: input.logoUrl,
  };

  const pdfBuffer = await renderToBuffer(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    React.createElement(GlossaryCardPdf, props) as any
  );

  return pdfBuffer;
}
