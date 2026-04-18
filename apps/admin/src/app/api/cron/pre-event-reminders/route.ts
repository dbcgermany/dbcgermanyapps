import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendPreEventReminder } from "@dbc/email";

const CRON_SECRET = process.env.CRON_SECRET;
const TICKETS_URL =
  process.env.NEXT_PUBLIC_TICKETS_URL ?? "https://tickets.dbc-germany.com";

export async function GET(req: Request) {
  if (
    CRON_SECRET &&
    req.headers.get("authorization") !== `Bearer ${CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Find events starting in 2-3 days
  const now = new Date();
  const twoDays = new Date(now.getTime() + 2 * 86400000).toISOString();
  const threeDays = new Date(now.getTime() + 3 * 86400000).toISOString();

  const { data: events } = await supabase
    .from("events")
    .select(
      "id, title_en, title_de, title_fr, starts_at, ends_at, venue_name, venue_address, slug"
    )
    .gte("starts_at", twoDays)
    .lt("starts_at", threeDays);

  if (!events || events.length === 0) {
    return NextResponse.json({ sent: 0, events: 0 });
  }

  let totalSent = 0;

  for (const event of events) {
    // Get tickets that haven't received a reminder and aren't checked in
    const { data: tickets } = await supabase
      .from("tickets")
      .select(
        "id, ticket_token, attendee_name, attendee_email, tier:ticket_tiers(name_en), order:orders(locale)"
      )
      .eq("event_id", event.id)
      .is("checked_in_at", null)
      .is("reminder_sent_at", null)
      .limit(500);

    if (!tickets || tickets.length === 0) continue;

    for (const ticket of tickets) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const orderData = ticket.order as any;
        const orderLocale = (orderData?.locale ??
          orderData?.[0]?.locale ??
          "en") as string;
        const locale = (orderLocale === "de" || orderLocale === "fr"
          ? orderLocale
          : "en") as "en" | "de" | "fr";

        const eventTitle =
          (event[`title_${locale}` as keyof typeof event] as string) ||
          event.title_en;

        const eventDate = new Date(event.starts_at).toLocaleDateString(
          locale,
          { weekday: "long", year: "numeric", month: "long", day: "numeric" }
        );
        const eventTime = `${new Date(event.starts_at).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })} \u2013 ${new Date(event.ends_at).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}`;

        await sendPreEventReminder({
          to: ticket.attendee_email,
          attendeeName: ticket.attendee_name,
          eventTitle,
          eventDate,
          eventTime,
          venueName: event.venue_name ?? "",
          venueAddress: event.venue_address ?? "",
          ticketShortId: ticket.ticket_token.slice(0, 8).toUpperCase(),
          orderUrl: `${TICKETS_URL}/${locale}/events/${event.slug}`,
          locale,
        });

        await supabase
          .from("tickets")
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq("id", ticket.id);

        totalSent++;
      } catch (err) {
        console.error(
          `[pre-event-reminder] failed for ticket ${ticket.id}:`,
          err
        );
      }
    }
  }

  return NextResponse.json({
    sent: totalSent,
    events: events.length,
  });
}
