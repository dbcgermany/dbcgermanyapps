import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import React from "react";
import {
  WhatsappCardPdf,
  type WhatsappCardPdfProps,
} from "./whatsapp-card-pdf";

export interface GenerateWhatsappCardInput {
  locale: "en" | "de" | "fr";
  /**
   * The WhatsApp join URL. Omit (or pass null) to render a "link coming soon"
   * placeholder — useful while the channel isn't published yet.
   */
  whatsappUrl?: string | null;
  brandName?: string;
  legalName?: string;
  supportEmail?: string;
  primaryColor?: string;
  logoUrl?: string;
}

export async function generateWhatsappCardPdf(
  input: GenerateWhatsappCardInput
): Promise<Buffer> {
  let qrDataUrl: string | undefined;
  if (input.whatsappUrl) {
    qrDataUrl = await QRCode.toDataURL(input.whatsappUrl, {
      errorCorrectionLevel: "M",
      width: 360,
      margin: 1,
      color: { dark: "#111111", light: "#ffffff" },
    });
  }

  const props: WhatsappCardPdfProps = {
    locale: input.locale,
    whatsappUrl: input.whatsappUrl ?? undefined,
    qrDataUrl,
    brandName: input.brandName,
    legalName: input.legalName,
    supportEmail: input.supportEmail,
    primaryColor: input.primaryColor,
    logoUrl: input.logoUrl,
  };

  const pdfBuffer = await renderToBuffer(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    React.createElement(WhatsappCardPdf, props) as any
  );

  return pdfBuffer;
}
