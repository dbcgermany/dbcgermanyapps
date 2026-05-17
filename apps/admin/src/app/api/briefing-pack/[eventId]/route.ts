import { NextResponse } from "next/server";
import { createServerClient, requireRole } from "@dbc/supabase/server";
import { generateBriefingPackPdf } from "@dbc/email";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  await requireRole("team_member");

  const url = new URL(req.url);
  const localeParam = url.searchParams.get("locale");
  const locale = (localeParam === "de" || localeParam === "fr"
    ? localeParam
    : "en") as "en" | "de" | "fr";
  const previewName = url.searchParams.get("name") || "Sample Attendee";

  const supabase = await createServerClient();

  const { data: event } = await supabase
    .from("events")
    .select(
      "id, title_en, title_de, title_fr, starts_at, ends_at, venue_name, venue_address, city"
    )
    .eq("id", eventId)
    .single();

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

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

  const legalName = company
    ? [company.legal_name, company.legal_form].filter(Boolean).join(" ")
    : "DBC Germany";

  const pdfBuffer = await generateBriefingPackPdf({
    attendeeName: previewName,
    eventTitle,
    startsAt: new Date(event.starts_at),
    endsAt: new Date(event.ends_at),
    venueName: event.venue_name ?? "",
    venueAddress: event.venue_address ?? "",
    city: event.city ?? "",
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
      "Content-Disposition": `inline; filename="briefing-pack-${eventId.slice(0, 8)}-${locale}.pdf"`,
    },
  });
}
