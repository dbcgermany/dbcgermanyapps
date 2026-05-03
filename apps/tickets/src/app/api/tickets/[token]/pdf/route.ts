import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateTicketPdf } from "@dbc/email";
import { captureServerError } from "@/lib/observe";

// Public PDF download for a single ticket. The ticket_token is a v4 UUID so
// guessing is impractical (same security model as the email attachment).
// The route refuses to serve tickets attached to non-paid / non-comped orders.

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token || !/^[0-9a-fA-F-]{32,40}$/.test(token)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: ticket } = await supabase
    .from("tickets")
    .select(
      "id, attendee_name, attendee_email, ticket_token, tier_id, order_id"
    )
    .eq("ticket_token", token)
    .maybeSingle();

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, event_id, locale, acquisition_type")
    .eq("id", ticket.order_id)
    .single();

  if (!order || (order.status !== "paid" && order.status !== "comped")) {
    return NextResponse.json(
      { error: "Order not paid yet" },
      { status: 403 }
    );
  }

  const { data: event } = await supabase
    .from("events")
    .select(
      "title_en, title_de, title_fr, event_type, starts_at, ends_at, venue_name, venue_address, city, timezone"
    )
    .eq("id", order.event_id)
    .single();

  const { data: tier } = await supabase
    .from("ticket_tiers")
    .select("name_en, name_de, name_fr")
    .eq("id", ticket.tier_id)
    .single();

  const { data: company } = await supabase
    .from("company_info")
    .select(
      "brand_name, legal_name, legal_form, support_email, primary_color, logo_light_url"
    )
    .eq("id", 1)
    .maybeSingle();

  const locale = (order.locale as "en" | "de" | "fr") ?? "en";
  const eventTitle =
    (event?.[`title_${locale}` as keyof typeof event] as string | undefined) ||
    event?.title_en ||
    "Event";
  const tierName =
    (tier?.[`name_${locale}` as keyof typeof tier] as string | undefined) ||
    tier?.name_en ||
    "Ticket";

  const legalName = company
    ? [company.legal_name, company.legal_form].filter(Boolean).join(" ")
    : undefined;

  try {
    const pdfBuffer = await generateTicketPdf({
      attendeeName: ticket.attendee_name,
      attendeeEmail: ticket.attendee_email,
      eventTitle,
      eventType: event?.event_type ?? "",
      startsAt: new Date(event?.starts_at ?? Date.now()),
      endsAt: new Date(event?.ends_at ?? Date.now()),
      venueName: event?.venue_name ?? "",
      venueAddress: event?.venue_address ?? "",
      city: event?.city ?? "",
      timezone: event?.timezone ?? "Europe/Berlin",
      tierName,
      ticketToken: ticket.ticket_token,
      locale,
      brandName: company?.brand_name ?? undefined,
      legalName,
      supportEmail: company?.support_email ?? undefined,
      primaryColor: company?.primary_color ?? undefined,
      logoUrl: company?.logo_light_url ?? undefined,
      isInvitation:
        order.acquisition_type === "invited" ||
        order.acquisition_type === "assigned",
    });

    const shortId = ticket.ticket_token.slice(0, 8).toUpperCase();
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="ticket-${shortId}.pdf"`,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (err) {
    captureServerError(err, {
      scope: "ticket_pdf_download",
      data: { ticket_id: ticket.id, order_id: order.id },
    });
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
