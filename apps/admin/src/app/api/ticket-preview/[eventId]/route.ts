import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, requireRole } from "@dbc/supabase/server";
import { generateTicketPdf } from "@dbc/email";

/**
 * GET /api/ticket-preview/[eventId]?locale=en
 *
 * Generates a sample PDF ticket for the given event using a dummy attendee.
 * Returns the PDF as a downloadable file. Manager+ only.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  await requireRole("manager");
  const { eventId } = await params;
  const locale = (request.nextUrl.searchParams.get("locale") || "en") as
    | "en"
    | "de"
    | "fr";

  const supabase = await createServerClient();

  const [eventRes, companyRes, tierRes] = await Promise.all([
    supabase
      .from("events")
      .select(
        "title_en, title_de, title_fr, event_type, starts_at, ends_at, venue_name, venue_address, city, timezone"
      )
      .eq("id", eventId)
      .single(),
    supabase
      .from("company_info")
      .select(
        "brand_name, legal_name, legal_form, support_email, primary_color, logo_light_url"
      )
      .eq("id", 1)
      .maybeSingle(),
    supabase
      .from("ticket_tiers")
      .select("name_en, name_de, name_fr")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: true })
      .limit(1),
  ]);

  if (eventRes.error || !eventRes.data) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const event = eventRes.data;
  const company = companyRes.data;
  const tier = tierRes.data?.[0];

  const titleKey = `title_${locale}` as keyof typeof event;
  const eventTitle = (event[titleKey] as string) || event.title_en;
  const tierNameKey = `name_${locale}` as keyof NonNullable<typeof tier>;
  const tierName = tier
    ? ((tier[tierNameKey] as string) || tier.name_en)
    : "General Admission";

  const legalName = company
    ? [company.legal_name, company.legal_form].filter(Boolean).join(" ")
    : undefined;

  const pdfBuffer = await generateTicketPdf({
    eventTitle,
    eventType: event.event_type,
    startsAt: new Date(event.starts_at),
    endsAt: new Date(event.ends_at),
    venueName: event.venue_name ?? "",
    venueAddress: event.venue_address ?? "",
    city: event.city ?? "",
    timezone: event.timezone ?? "Europe/Berlin",
    attendeeName: "Jane Doe (Sample)",
    attendeeEmail: "sample@preview.local",
    tierName,
    ticketToken: "00000000-0000-0000-0000-000000000000",
    locale,
    brandName: company?.brand_name ?? undefined,
    legalName,
    supportEmail: company?.support_email ?? undefined,
    primaryColor: company?.primary_color ?? undefined,
    logoUrl: company?.logo_light_url ?? undefined,
    isInvitation: false,
  });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="ticket-preview-${eventId}.pdf"`,
    },
  });
}
