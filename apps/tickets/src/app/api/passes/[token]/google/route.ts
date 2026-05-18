import { NextResponse } from "next/server";
import { createServerClient } from "@dbc/supabase/server";
import {
  buildAddToGoogleWalletUrl,
  googleWalletConfigured,
} from "@dbc/passes";

/**
 * Per-ticket Google Wallet "Add to Wallet" redirect.
 *
 * Resolves the ticket by its public token (the same value that's encoded in
 * the existing PDF/QR), signs a Google Wallet save-to-wallet JWT, and 302s
 * the user to `https://pay.google.com/gp/v/save/<JWT>`. Chrome on Android
 * opens the native "Add to Google Wallet" sheet; on iOS Safari the URL
 * gracefully degrades to the web preview.
 *
 * No auth — the ticket token itself is the bearer. Same security model as
 * `/api/tickets/[token]/pdf`. Anyone with the link can re-add the pass.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!googleWalletConfigured()) {
    return NextResponse.json(
      {
        error: "Google Wallet is not configured on this deployment.",
      },
      { status: 503 }
    );
  }

  const supabase = await createServerClient();

  const { data: ticket } = await supabase
    .from("tickets")
    .select(
      "id, ticket_token, attendee_name, event_id, tier_id, checked_in_at"
    )
    .eq("ticket_token", token)
    .single();

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  if (ticket.checked_in_at) {
    return NextResponse.json(
      { error: "Ticket already checked in." },
      { status: 410 }
    );
  }

  const [{ data: event }, { data: tier }] = await Promise.all([
    supabase
      .from("events")
      .select(
        "id, slug, title_en, title_de, title_fr, starts_at, ends_at, venue_name, venue_address, city, country, funnel_brand_accent_hex"
      )
      .eq("id", ticket.event_id)
      .single(),
    supabase
      .from("ticket_tiers")
      .select("name_en")
      .eq("id", ticket.tier_id)
      .single(),
  ]);

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const { data: company } = await supabase
    .from("company_info")
    .select("primary_color, logo_light_url")
    .eq("id", 1)
    .maybeSingle();

  const accentHex =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (event as any).funnel_brand_accent_hex ||
    company?.primary_color ||
    "#c8102e";

  const ticketShortId = (ticket.ticket_token as string)
    .slice(0, 8)
    .toUpperCase();

  const url = buildAddToGoogleWalletUrl(
    {
      classSuffix: event.slug as string,
      eventName: {
        en: (event.title_en as string) || "Richesses d'Afrique Germany",
        de: (event.title_de as string) || undefined,
        fr: (event.title_fr as string) || undefined,
      },
      venueName: (event.venue_name as string) || "",
      venueAddress: (event.venue_address as string) || "",
      startIso: new Date(event.starts_at as string).toISOString(),
      endIso: new Date(event.ends_at as string).toISOString(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      countryCode: ((event as any).country as string) || "DE",
      logoUrl: company?.logo_light_url ?? undefined,
      hexBackgroundColor: accentHex,
    },
    {
      objectSuffix: ticket.id as string,
      ticketHolderName: ticket.attendee_name as string,
      ticketNumber: ticketShortId,
      ticketTier: (tier?.name_en as string) || "Ticket",
      qrValue: ticket.ticket_token as string,
    }
  );

  return NextResponse.redirect(url, { status: 302 });
}
