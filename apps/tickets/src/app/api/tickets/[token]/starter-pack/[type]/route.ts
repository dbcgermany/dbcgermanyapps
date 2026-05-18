import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  generateOutcomesWorksheetPdf,
  generateGlossaryCardPdf,
  generateWhatsappCardPdf,
} from "@dbc/email";
import { captureServerError } from "@/lib/observe";

// Starter Pack PDFs — three small, brand-styled handouts that ship with every
// ticket. Same token-gating model as /api/tickets/[token]/pdf: the ticket_token
// is a v4 UUID and we refuse to serve when the order isn't paid/comped.

const TOKEN_RE = /^[0-9a-fA-F-]{32,40}$/;
const SUPPORTED_TYPES = ["worksheet", "glossary", "whatsapp"] as const;
type StarterPackType = (typeof SUPPORTED_TYPES)[number];

function isType(s: string): s is StarterPackType {
  return (SUPPORTED_TYPES as readonly string[]).includes(s);
}

function resolveLocale(
  url: URL,
  fallback: "en" | "de" | "fr"
): "en" | "de" | "fr" {
  const q = url.searchParams.get("locale");
  if (q === "en" || q === "de" || q === "fr") return q;
  return fallback;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string; type: string }> }
) {
  const { token, type } = await params;

  if (!token || !TOKEN_RE.test(token)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }
  if (!isType(type)) {
    return NextResponse.json({ error: "Unknown pack type" }, { status: 404 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: ticket } = await supabase
    .from("tickets")
    .select("id, order_id")
    .eq("ticket_token", token)
    .maybeSingle();

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, locale")
    .eq("id", ticket.order_id)
    .single();

  if (!order || (order.status !== "paid" && order.status !== "comped")) {
    return NextResponse.json(
      { error: "Order not paid yet" },
      { status: 403 }
    );
  }

  const { data: company } = await supabase
    .from("company_info")
    .select(
      "brand_name, legal_name, legal_form, support_email, primary_color, logo_light_url"
    )
    .eq("id", 1)
    .maybeSingle();

  const locale = resolveLocale(
    new URL(request.url),
    (order.locale as "en" | "de" | "fr") ?? "en"
  );

  const legalName = company
    ? [company.legal_name, company.legal_form].filter(Boolean).join(" ")
    : undefined;

  const branding = {
    locale,
    brandName: company?.brand_name ?? undefined,
    legalName,
    supportEmail: company?.support_email ?? undefined,
    primaryColor: company?.primary_color ?? undefined,
    logoUrl: company?.logo_light_url ?? undefined,
  };

  try {
    let pdfBuffer: Buffer;
    let filename: string;

    if (type === "worksheet") {
      pdfBuffer = await generateOutcomesWorksheetPdf(branding);
      filename = `outcomes-worksheet-${locale}.pdf`;
    } else if (type === "glossary") {
      pdfBuffer = await generateGlossaryCardPdf(branding);
      filename = `glossary-card-${locale}.pdf`;
    } else {
      pdfBuffer = await generateWhatsappCardPdf({
        ...branding,
        whatsappUrl: process.env.WHATSAPP_CLASS_2026_URL ?? null,
      });
      filename = `class-of-2026-${locale}.pdf`;
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (err) {
    captureServerError(err, {
      scope: "starter_pack_pdf",
      data: { ticket_id: ticket.id, order_id: order.id, type },
    });
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
