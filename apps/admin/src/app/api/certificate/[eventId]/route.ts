import { NextResponse } from "next/server";
import { createServerClient, requireRole } from "@dbc/supabase/server";
import { generateCertificatePdf } from "@dbc/email";

/**
 * Staff-gated preview of the Certificate of Participation PDF.
 * Usage: /api/certificate/[eventId]?locale=en|de|fr&name=Jay+Kalala&id=ABCD1234
 */
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
  const certificateId =
    url.searchParams.get("id")?.toUpperCase() || "PREVIEW1";

  const supabase = await createServerClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, title_en, title_de, title_fr, ends_at, city")
    .eq("id", eventId)
    .single();

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const { data: company } = await supabase
    .from("company_info")
    .select("brand_name, primary_color, logo_light_url")
    .eq("id", 1)
    .maybeSingle();

  const eventTitle =
    (event[`title_${locale}` as keyof typeof event] as string) ||
    event.title_en;

  const pdfBuffer = await generateCertificatePdf({
    attendeeName: previewName,
    eventTitle,
    eventDate: new Date(event.ends_at),
    venueCity: event.city ?? "",
    certificateId,
    locale,
    brandName: company?.brand_name ?? "DBC Germany",
    primaryColor: company?.primary_color ?? undefined,
    logoUrl: company?.logo_light_url ?? undefined,
  });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="certificate-${eventId.slice(0, 8)}-${locale}.pdf"`,
    },
  });
}
