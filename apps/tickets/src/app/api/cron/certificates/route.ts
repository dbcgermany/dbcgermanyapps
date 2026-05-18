import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthorisedCronRequest } from "@dbc/supabase/server";
import {
  createEmailClient,
  fromAddressFor,
  replyToAddressFor,
  generateCertificatePdf,
} from "@dbc/email";
import { BRAND_HEX } from "@dbc/ui";

/**
 * Cron endpoint that dispatches Certificate of Participation PDFs to
 * attendees who:
 *   1. Checked in at the door (tickets.checked_in_at IS NOT NULL)
 *   2. Have not yet received a certificate (tickets.certificate_sent_at IS NULL)
 *   3. Attended an event that ended at least 24 hours ago
 *
 * Each ticket gets its own personalised PDF (attendee name + certificate ID +
 * event date + venue). The PDF attaches to a short congratulatory email; the
 * `certificate_sent_at` column is stamped only after Resend accepts the send,
 * so a partial-failure batch retries automatically on the next run.
 *
 * Protected by CRON_SECRET. Schedule in apps/tickets/vercel.json daily at
 * 11:00 UTC — a few hours after the email-sequences cron so the post-event
 * recap goes out first, certificate second.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

const SUBJECT_TRANSLATIONS = {
  en: "Your Certificate of Participation — {event}",
  de: "Ihre Teilnahmebescheinigung — {event}",
  fr: "Votre attestation de participation — {event}",
};

const BODY_TRANSLATIONS = {
  en: {
    greeting: "Hi {name},",
    intro:
      "Thanks for being in the room at {event}. Your Certificate of Participation is attached as a PDF — feel free to share it on LinkedIn or keep it for your records.",
    closing:
      "If anything looks wrong on the certificate, reply to this email and we'll fix it.",
    sig: "DBC Germany",
  },
  de: {
    greeting: "Hallo {name},",
    intro:
      "Danke, dass Sie bei {event} im Raum waren. Ihre Teilnahmebescheinigung liegt als PDF an — teilen Sie sie gerne auf LinkedIn oder bewahren Sie sie für Ihre Unterlagen auf.",
    closing:
      "Falls etwas auf der Bescheinigung nicht stimmt, antworten Sie einfach auf diese E-Mail — wir korrigieren das.",
    sig: "DBC Germany",
  },
  fr: {
    greeting: "Bonjour {name},",
    intro:
      "Merci d'avoir été dans la salle à {event}. Votre attestation de participation est jointe en PDF — partage-la sur LinkedIn ou garde-la pour tes archives.",
    closing:
      "Si quelque chose ne va pas sur l'attestation, réponds à cet e-mail et on corrige.",
    sig: "DBC Germany",
  },
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function GET(request: Request) {
  if (!isAuthorisedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Step 1: find events that ended ≥ 24h ago so we don't blast certificates
  // while attendees are still travelling home.
  const cutoffIso = new Date(Date.now() - DAY_MS).toISOString();
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select(
      "id, title_en, title_de, title_fr, ends_at, city, venue_name"
    )
    .lte("ends_at", cutoffIso);

  if (eventsError) {
    return NextResponse.json(
      { error: `events fetch: ${eventsError.message}` },
      { status: 500 }
    );
  }
  if (!events || events.length === 0) {
    return NextResponse.json({ ok: true, eligible_events: 0, sent: 0 });
  }

  // Branding — same pattern as send-tickets-for-order
  const { data: companyInfo } = await supabase
    .from("company_info")
    .select(
      "brand_name, primary_color, logo_light_url"
    )
    .eq("id", 1)
    .maybeSingle();

  const resend = createEmailClient();
  const fromAddress = fromAddressFor("tickets");

  let totalSent = 0;
  let totalFailed = 0;
  const totalSkipped = 0;

  for (const event of events) {
    // Step 2: find tickets that checked in but haven't been certified yet.
    const { data: tickets } = await supabase
      .from("tickets")
      .select(
        "id, ticket_token, attendee_name, attendee_email, order_id"
      )
      .eq("event_id", event.id)
      .not("checked_in_at", "is", null)
      .is("certificate_sent_at", null);

    if (!tickets || tickets.length === 0) {
      continue;
    }

    // Pull order locale once per batch — orders.locale is the source of truth
    // for "in what language should we write to this person".
    const orderIds = [...new Set(tickets.map((t) => t.order_id as string))];
    const { data: orders } = await supabase
      .from("orders")
      .select("id, locale")
      .in("id", orderIds);
    const orderLocale = new Map(
      (orders ?? []).map((o) => [o.id as string, (o.locale as string) ?? "en"])
    );

    for (const ticket of tickets) {
      const locale = (orderLocale.get(ticket.order_id as string) ?? "en") as
        | "en"
        | "de"
        | "fr";
      const eventTitle =
        (event[`title_${locale}` as keyof typeof event] as string) ||
        event.title_en;

      const certificateId = (ticket.ticket_token as string)
        .slice(0, 8)
        .toUpperCase();

      let pdfBuffer: Buffer;
      try {
        pdfBuffer = await generateCertificatePdf({
          attendeeName: ticket.attendee_name as string,
          eventTitle,
          eventDate: new Date(event.ends_at as string),
          venueCity: (event.city as string) ?? "",
          certificateId,
          locale,
          brandName: companyInfo?.brand_name ?? "DBC Germany",
          primaryColor: companyInfo?.primary_color ?? undefined,
          logoUrl: companyInfo?.logo_light_url ?? undefined,
        });
      } catch (err) {
        totalFailed++;
        console.error(
          `[certificates] PDF render failed for ticket ${ticket.id}:`,
          err instanceof Error ? err.message : err
        );
        continue;
      }

      const subject = SUBJECT_TRANSLATIONS[locale].replace(
        "{event}",
        eventTitle
      );
      const body = BODY_TRANSLATIONS[locale];
      const safeName = escapeHtml(ticket.attendee_name as string);
      const safeEvent = escapeHtml(eventTitle);
      const greeting = body.greeting.replace("{name}", safeName);
      const intro = body.intro.replace("{event}", safeEvent);

      const html = `<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:${BRAND_HEX.ink};line-height:1.6;"><p style="margin:0 0 16px;">${greeting}</p><p style="margin:0 0 16px;">${intro}</p><p style="margin:0 0 24px;font-size:13px;color:${BRAND_HEX.inkMuted};">${escapeHtml(body.closing)}</p><hr style="margin:24px 0;border:none;border-top:1px solid ${BRAND_HEX.border};"/><p style="font-size:12px;color:${BRAND_HEX.inkMuted};margin:0;">${escapeHtml(body.sig)} · tickets.dbc-germany.com</p></div>`;

      try {
        const result = await resend.emails.send({
          from: fromAddress,
          replyTo: replyToAddressFor("tickets"),
          to: ticket.attendee_email as string,
          subject,
          html,
          attachments: [
            {
              filename: `certificate-${certificateId}.pdf`,
              content: pdfBuffer,
            },
          ],
        });

        if (result.error) {
          totalFailed++;
          console.error(
            `[certificates] Resend rejected ticket ${ticket.id}:`,
            JSON.stringify(result.error)
          );
          continue;
        }

        // Stamp only after success so a transient failure retries next run.
        await supabase
          .from("tickets")
          .update({ certificate_sent_at: new Date().toISOString() })
          .eq("id", ticket.id);
        totalSent++;
      } catch (err) {
        totalFailed++;
        console.error(
          `[certificates] send failed for ticket ${ticket.id}:`,
          err instanceof Error ? err.message : err
        );
      }
    }
  }

  return NextResponse.json({
    ok: totalFailed === 0,
    eligible_events: events.length,
    sent: totalSent,
    failed: totalFailed,
    skipped: totalSkipped,
  });
}
