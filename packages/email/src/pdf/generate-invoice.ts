import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { InvoicePdf, type InvoicePdfProps } from "./invoice-pdf";

export interface GenerateInvoiceInput {
  invoiceNumber: string;
  buyerName: string;
  buyerEmail: string;
  eventTitle: string;
  lineItems: { description: string; quantity: number; unitPriceCents: number }[];
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  currency: string;
  paymentMethod: string | null;
  locale: "en" | "de" | "fr";
  taxRatePct?: number;
  brandName?: string;
  legalName?: string;
  companyAddress?: string;
  supportEmail?: string;
  logoUrl?: string;
  primaryColor?: string;
  bankDetails?: string;
}

export async function generateInvoicePdf(
  input: GenerateInvoiceInput
): Promise<Buffer> {
  const taxRatePct = input.taxRatePct ?? 19;
  const taxCents = Math.round(
    input.totalCents - input.totalCents / (1 + taxRatePct / 100)
  );

  const invoiceDate = new Date().toLocaleDateString(input.locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const props: InvoicePdfProps = {
    invoiceNumber: input.invoiceNumber,
    invoiceDate,
    buyerName: input.buyerName,
    buyerEmail: input.buyerEmail,
    eventTitle: input.eventTitle,
    lineItems: input.lineItems,
    subtotalCents: input.subtotalCents,
    discountCents: input.discountCents,
    taxRatePct,
    taxCents,
    totalCents: input.totalCents,
    currency: input.currency,
    paymentMethod: input.paymentMethod,
    locale: input.locale,
    brandName: input.brandName || "DBC Germany",
    legalName: input.legalName || "DBC Germany",
    companyAddress: input.companyAddress || "",
    supportEmail: input.supportEmail || "info@dbc-germany.com",
    logoUrl: input.logoUrl,
    primaryColor: input.primaryColor,
    bankDetails: input.bankDetails,
  };

  const pdfBuffer = await renderToBuffer(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    React.createElement(InvoicePdf, props) as any
  );

  return pdfBuffer;
}
