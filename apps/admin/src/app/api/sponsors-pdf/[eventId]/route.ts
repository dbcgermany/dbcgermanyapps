import { NextResponse } from "next/server";
import { createServerClient, requireRole } from "@dbc/supabase/server";
import { generateSponsorsPdf, type SponsorRow } from "@dbc/email";

/**
 * Staff-gated preview of the attendee-facing Sponsors PDF.
 * Usage: /api/sponsors-pdf/[eventId]?locale=en|de|fr&all=1
 *   - ?all=1   include every sponsor row regardless of status (handy for
 *              previewing layouts before deals are signed)
 *   - default  only sponsors with status IN (confirmed, active, completed)
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
  const includeAll = url.searchParams.get("all") === "1";

  const supabase = await createServerClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, title_en, title_de, title_fr, starts_at, city")
    .eq("id", eventId)
    .single();

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("event_sponsors")
    .select(
      "id, company_name, tier, sector, description_en, description_de, description_fr, logo_url, website_url"
    )
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });

  if (!includeAll) {
    query = query.in("status", ["confirmed", "active", "completed"]);
  }

  const { data: sponsors } = await query;
  const rows = (sponsors ?? []) as SponsorRow[];

  const { data: company } = await supabase
    .from("company_info")
    .select("brand_name, primary_color, logo_light_url")
    .eq("id", 1)
    .maybeSingle();

  const eventTitle =
    (event[`title_${locale}` as keyof typeof event] as string) ||
    event.title_en;

  const pdfBuffer = await generateSponsorsPdf({
    eventTitle,
    startsAt: new Date(event.starts_at),
    city: event.city ?? "",
    sponsors: rows,
    locale,
    brandName: company?.brand_name ?? "DBC Germany",
    primaryColor: company?.primary_color ?? undefined,
    logoUrl: company?.logo_light_url ?? undefined,
  });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="sponsors-${eventId.slice(0, 8)}-${locale}.pdf"`,
    },
  });
}
