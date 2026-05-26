import { renderToBuffer } from "@react-pdf/renderer";
import { StatementPdf, type StatementLineItem } from "./statement-pdf";
import type { AffiliateLocale } from "../types";

export interface GenerateStatementInput {
  locale: AffiliateLocale;
  statementNumber: string;
  payeeName: string;
  payeeEmail: string;
  periodLabel: string;
  totalCents: number;
  currency: string;
  paymentReference: string | null;
  paymentDate: string | null;
  lineItems: StatementLineItem[];
}

export async function generateAffiliateStatementPdf(
  input: GenerateStatementInput
): Promise<Buffer> {
  const totalFormatted = new Intl.NumberFormat(
    input.locale === "de" ? "de-DE" : input.locale === "fr" ? "fr-FR" : "en-US",
    { style: "currency", currency: input.currency }
  ).format(input.totalCents / 100);

  const pdfBuffer = await renderToBuffer(
    <StatementPdf
      locale={input.locale}
      statementNumber={input.statementNumber}
      payeeName={input.payeeName}
      payeeEmail={input.payeeEmail}
      periodLabel={input.periodLabel}
      totalFormatted={totalFormatted}
      paymentReference={input.paymentReference}
      paymentDate={input.paymentDate}
      lineItems={input.lineItems}
    />
  );
  return pdfBuffer;
}
