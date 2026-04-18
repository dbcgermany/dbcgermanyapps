import { NextResponse } from "next/server";
import { createServerClient, requireRole } from "@dbc/supabase/server";
import { generateInvoicePdf } from "@dbc/email";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  await requireRole("manager");

  const supabase = await createServerClient();

  const { data: order } = await supabase
    .from("orders")
    .select(
      `id, total_cents, subtotal_cents, discount_cents, currency, status,
       payment_method, recipient_name, recipient_email, locale,
       event:events(title_en, title_de, title_fr)`
    )
    .eq("id", orderId)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const { data: tickets } = await supabase
    .from("tickets")
    .select("attendee_name, tier:ticket_tiers(name_en, price_cents)")
    .eq("order_id", orderId);

  const { data: company } = await supabase
    .from("company_info")
    .select(
      "brand_name, legal_name, legal_form, support_email, primary_color, logo_light_url, registered_address, default_tax_rate_pct, bank_name, bank_iban, bank_bic"
    )
    .eq("id", 1)
    .maybeSingle();

  const locale = (order.locale === "de" || order.locale === "fr"
    ? order.locale
    : "en") as "en" | "de" | "fr";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eventTitle = (order.event as any)?.title_en ?? "Event";

  // Build line items from tickets
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lineItems = (tickets ?? []).map((t: any) => ({
    description: t.tier?.name_en ?? "Ticket",
    quantity: 1,
    unitPriceCents: t.tier?.price_cents ?? 0,
  }));

  // Group identical line items
  const grouped = new Map<string, { description: string; quantity: number; unitPriceCents: number }>();
  for (const item of lineItems) {
    const key = `${item.description}:${item.unitPriceCents}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.quantity += 1;
    } else {
      grouped.set(key, { ...item });
    }
  }

  const legalName = company
    ? [company.legal_name, company.legal_form].filter(Boolean).join(" ")
    : "DBC Germany";

  const bankDetails =
    company?.bank_iban
      ? `${company.bank_name || "Bank"} | IBAN: ${company.bank_iban}${company.bank_bic ? ` | BIC: ${company.bank_bic}` : ""}`
      : undefined;

  const pdfBuffer = await generateInvoicePdf({
    invoiceNumber: `INV-${orderId.slice(0, 8).toUpperCase()}`,
    buyerName: order.recipient_name || "Customer",
    buyerEmail: order.recipient_email,
    eventTitle,
    lineItems: [...grouped.values()],
    subtotalCents: order.subtotal_cents ?? order.total_cents,
    discountCents: order.discount_cents ?? 0,
    totalCents: order.total_cents,
    currency: order.currency || "EUR",
    paymentMethod: order.payment_method,
    locale,
    taxRatePct: company?.default_tax_rate_pct ?? 19,
    brandName: company?.brand_name ?? "DBC Germany",
    legalName,
    companyAddress: company?.registered_address ?? "",
    supportEmail: company?.support_email ?? "info@dbc-germany.com",
    logoUrl: company?.logo_light_url ?? undefined,
    primaryColor: company?.primary_color ?? undefined,
    bankDetails,
  });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="invoice-${orderId.slice(0, 8).toUpperCase()}.pdf"`,
    },
  });
}
