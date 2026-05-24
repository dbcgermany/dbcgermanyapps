import { NextResponse } from "next/server";
import { createServerClient, requireRole } from "@dbc/supabase/server";
import { generateBudgetPdf, type BudgetPdfItem } from "@dbc/email";

type Locale = "en" | "de" | "fr";

function pickDescription(
  row: {
    description: string | null;
    description_en: string | null;
    description_de: string | null;
    description_fr: string | null;
  },
  locale: Locale
): string {
  const map = {
    en: row.description_en,
    de: row.description_de,
    fr: row.description_fr,
  };
  return (
    map[locale] ||
    row.description_fr ||
    row.description_en ||
    row.description_de ||
    row.description ||
    ""
  );
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  await requireRole("manager");

  const url = new URL(req.url);
  const localeParam = url.searchParams.get("locale");
  const locale = (localeParam === "de" || localeParam === "fr"
    ? localeParam
    : "en") as Locale;

  const supabase = await createServerClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, title_en, title_de, title_fr, starts_at")
    .eq("id", eventId)
    .single();

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const { data: items } = await supabase
    .from("event_expenses")
    .select(
      "category, description, description_en, description_de, description_fr, amount_cents, vendor_name, due_date, paid_at, provider:contacts!event_expenses_provider_contact_id_fkey(first_name, last_name, email)"
    )
    .eq("event_id", eventId)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  const { data: company } = await supabase
    .from("company_info")
    .select(
      "brand_name, legal_name, legal_form, support_email, primary_color, logo_light_url"
    )
    .eq("id", 1)
    .maybeSingle();

  const eventTitle =
    (event[`title_${locale}` as keyof typeof event] as string) ||
    event.title_en;

  const todayIso = new Date().toISOString().slice(0, 10);
  let totalCents = 0;
  let paidCents = 0;
  let overdueCents = 0;
  const pdfItems: BudgetPdfItem[] = (items ?? []).map((r) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rel: any = (r as any).provider;
    const provider = Array.isArray(rel) ? rel[0] : rel;
    const providerName = provider
      ? [provider.first_name, provider.last_name].filter(Boolean).join(" ") ||
        provider.email
      : null;
    const desc = pickDescription(r, locale);
    totalCents += r.amount_cents ?? 0;
    if (r.paid_at) paidCents += r.amount_cents ?? 0;
    else if (r.due_date && r.due_date < todayIso) {
      overdueCents += r.amount_cents ?? 0;
    }
    return {
      description: desc,
      category: r.category,
      amountCents: r.amount_cents ?? 0,
      vendor: providerName || r.vendor_name || null,
      dueDate: r.due_date,
      paidAt: r.paid_at,
    };
  });
  const unpaidCents = totalCents - paidCents;

  const legalName = company
    ? [company.legal_name, company.legal_form].filter(Boolean).join(" ")
    : "DBC Germany";

  const pdfBuffer = await generateBudgetPdf({
    eventTitle,
    eventStartsAt: new Date(event.starts_at),
    totalCents,
    paidCents,
    unpaidCents,
    overdueCents,
    items: pdfItems,
    locale,
    brandName: company?.brand_name ?? "DBC Germany",
    legalName,
    supportEmail: company?.support_email ?? "info@dbc-germany.com",
    primaryColor: company?.primary_color ?? undefined,
    logoUrl: company?.logo_light_url ?? undefined,
  });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="budget-${eventId.slice(0, 8)}.pdf"`,
    },
  });
}
