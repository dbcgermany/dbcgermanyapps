import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import {
  BudgetPdf,
  type BudgetPdfProps,
  type BudgetPdfItem,
} from "./budget-pdf";

export interface GenerateBudgetPdfInput {
  eventTitle: string;
  eventStartsAt: Date;
  totalCents: number;
  paidCents: number;
  unpaidCents: number;
  overdueCents: number;
  items: BudgetPdfItem[];
  locale: "en" | "de" | "fr";
  brandName?: string;
  legalName?: string;
  supportEmail?: string;
  primaryColor?: string;
  logoUrl?: string;
}

export async function generateBudgetPdf(
  input: GenerateBudgetPdfInput
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

  const props: BudgetPdfProps = {
    eventTitle: input.eventTitle,
    eventDate,
    totalCents: input.totalCents,
    paidCents: input.paidCents,
    unpaidCents: input.unpaidCents,
    overdueCents: input.overdueCents,
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
    React.createElement(BudgetPdf, props) as any
  );

  return pdfBuffer;
}
