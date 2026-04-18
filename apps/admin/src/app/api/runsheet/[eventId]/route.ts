import { NextResponse } from "next/server";
import { createServerClient, requireRole } from "@dbc/supabase/server";
import { generateRunsheetPdf } from "@dbc/email";

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

  const supabase = await createServerClient();

  const { data: event } = await supabase
    .from("events")
    .select(
      "id, title_en, title_de, title_fr, starts_at, venue_name, city"
    )
    .eq("id", eventId)
    .single();

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const { data: items } = await supabase
    .from("event_runsheet_items")
    .select(
      "starts_at, ends_at, title, description, responsible_person, location_note, default_duration_minutes, status, assignee:profiles!event_runsheet_items_assigned_to_fkey(display_name)"
    )
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true })
    .order("starts_at", { ascending: true });

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

  const pdfItems = (items ?? []).map((r) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const assignee = Array.isArray((r as any).assignee)
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (r as any).assignee[0]
      : // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (r as any).assignee;
    return {
      startsAt: r.starts_at,
      endsAt: r.ends_at,
      title: r.title,
      description: r.description,
      assigneeName: assignee?.display_name || r.responsible_person || null,
      locationNote: r.location_note,
      durationMinutes: r.default_duration_minutes,
      status: r.status,
    };
  });

  const legalName = company
    ? [company.legal_name, company.legal_form].filter(Boolean).join(" ")
    : "DBC Germany";

  const venueDisplay = [event.venue_name, event.city]
    .filter(Boolean)
    .join(", ");

  const pdfBuffer = await generateRunsheetPdf({
    eventTitle,
    eventStartsAt: new Date(event.starts_at),
    eventVenue: venueDisplay || undefined,
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
      "Content-Disposition": `inline; filename="runsheet-${eventId.slice(0, 8)}.pdf"`,
    },
  });
}
