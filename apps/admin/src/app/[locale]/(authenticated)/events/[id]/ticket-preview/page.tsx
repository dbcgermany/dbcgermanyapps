import Link from "next/link";
import { notFound } from "next/navigation";
import { getEvent } from "@/actions/events";
import { getEventTiers } from "@/actions/door-sale";
import { renderEmailPreview } from "@/actions/email-preview";
import { requireRole } from "@dbc/supabase/server";
import { createServerClient } from "@dbc/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Card } from "@dbc/ui";
import { EmailPreviewClient } from "./preview-client";

/**
 * Ticket design preview page.
 * Renders a visual mock of the PDF ticket using the event's real data +
 * company branding + a sample attendee. No real ticket is created.
 *
 * To see the actual PDF, use the "Download sample PDF" link which hits
 * the /api/ticket-preview/[eventId] route.
 */
export default async function TicketPreviewPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  await requireRole("manager");

  let event;
  try {
    event = await getEvent(id);
  } catch {
    notFound();
  }

  const supabase = await createServerClient();
  const safeLocale = (locale === "de" || locale === "fr" ? locale : "en") as
    | "en"
    | "de"
    | "fr";
  const [tiersRes, companyRes, emailPreview] = await Promise.all([
    getEventTiers(id),
    supabase
      .from("company_info")
      .select(
        "brand_name, legal_name, legal_form, support_email, primary_color, logo_light_url"
      )
      .eq("id", 1)
      .maybeSingle(),
    renderEmailPreview(id, safeLocale),
  ]);

  const tiers = tiersRes;
  const company = companyRes.data;
  const l = (locale === "de" || locale === "fr" ? locale : "en") as
    | "en"
    | "de"
    | "fr";
  const title =
    (event[`title_${l}` as keyof typeof event] as string) || event.title_en;
  const primary = company?.primary_color ?? "#c8102e";
  const brandName = company?.brand_name ?? "DBC Germany";
  const legalName = company
    ? [company.legal_name, company.legal_form].filter(Boolean).join(" ")
    : "DBC Germany";
  const supportEmail = company?.support_email ?? "info@dbc-germany.com";
  const tierName =
    tiers.length > 0
      ? ((tiers[0][`name_${l}` as keyof (typeof tiers)[0]] as string) ||
        tiers[0].name_en)
      : "General Admission";

  const dateStr = new Date(event.starts_at).toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = `${new Date(event.starts_at).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  })} \u2013 ${new Date(event.ends_at).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

  const COPY = {
    en: {
      ticket: "Ticket",
      date: "Date",
      venue: "Venue",
      attendee: "Attendee",
      tierLabel: "Ticket Type",
      scanTitle: "Present at entrance",
      scanText:
        "Show this QR code at the entrance for fast check-in. One scan only.",
      support: "Support",
    },
    de: {
      ticket: "Ticket",
      date: "Datum",
      venue: "Veranstaltungsort",
      attendee: "Teilnehmer:in",
      tierLabel: "Ticketart",
      scanTitle: "Am Eingang vorzeigen",
      scanText:
        "Zeigen Sie diesen QR-Code am Eingang. Einmalige Verwendung.",
      support: "Support",
    },
    fr: {
      ticket: "Billet",
      date: "Date",
      venue: "Lieu",
      attendee: "Participant\u00B7e",
      tierLabel: "Type de billet",
      scanTitle: "\u00C0 pr\u00E9senter \u00E0 l\u2019entr\u00E9e",
      scanText:
        "Montrez ce code QR \u00E0 l\u2019entr\u00E9e. Usage unique.",
      support: "Assistance",
    },
  };
  const t = COPY[l];

  return (
    <div>
      <PageHeader
        title="Ticket design preview"
        description="Visual mock of the PDF ticket using real event data. No ticket is created."
        cta={
          <div className="flex gap-2">
            <a
              href={`/api/ticket-preview/${id}?locale=${locale}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              Download sample PDF
            </a>
            <Link
              href={`/${locale}/events/${id}`}
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2 text-sm font-medium hover:bg-muted"
            >
              Back to event
            </Link>
          </div>
        }
      />

      {/* Visual mock — styled to match the PDF layout */}
      <div className="mt-8 mx-auto max-w-[600px]">
        <Card padding="lg" className="rounded-lg bg-white text-black dark:text-black">
          {/* Header */}
          <div
            className="flex items-center justify-between border-b-2 pb-4"
            style={{ borderColor: primary }}
          >
            <div className="flex items-center gap-2">
              {company?.logo_light_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={company.logo_light_url}
                  alt=""
                  className="h-8 w-8 object-contain"
                  referrerPolicy="no-referrer"
                />
              )}
              <span
                className="text-lg font-bold tracking-wider"
                style={{ color: primary }}
              >
                {brandName.toUpperCase()}
              </span>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wide text-neutral-500">
                {t.ticket}
              </p>
              <p className="font-mono text-sm">ABCD1234</p>
            </div>
          </div>

          {/* Event */}
          <div className="mt-6">
            <p
              className="text-[10px] font-semibold uppercase tracking-wide"
              style={{ color: primary }}
            >
              {event.event_type}
            </p>
            <h2 className="mt-1 text-2xl font-bold">{title}</h2>
            <div className="mt-3 h-1 w-20" style={{ backgroundColor: primary }} />
          </div>

          {/* Info grid */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-neutral-500">
                {t.date}
              </p>
              <p className="text-sm font-semibold">{dateStr}</p>
              <p className="text-xs text-neutral-500">{timeStr}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-neutral-500">
                {t.venue}
              </p>
              <p className="text-sm font-semibold">{event.venue_name}</p>
              <p className="text-xs text-neutral-500">
                {event.venue_address}
                {event.city ? `, ${event.city}` : ""}
              </p>
            </div>
          </div>

          {/* Attendee */}
          <div className="mt-6 rounded-md bg-neutral-50 border border-neutral-200 p-4">
            <p className="text-[10px] uppercase tracking-wide text-neutral-500">
              {t.attendee}
            </p>
            <p className="mt-1 text-xl font-bold">Jane Doe</p>
            <p className="text-xs text-neutral-500">jane@example.com</p>
            <div className="mt-3">
              <p className="text-[10px] uppercase tracking-wide text-neutral-500">
                {t.tierLabel}
              </p>
              <p className="text-sm font-semibold">{tierName}</p>
            </div>
          </div>

          {/* QR mock */}
          <div className="mt-6 flex items-center gap-6 rounded-md border border-dashed border-neutral-300 p-5">
            <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-neutral-400">
              <svg width="80" height="80" viewBox="0 0 80 80">
                <rect x="5" y="5" width="25" height="25" rx="2" fill="currentColor" />
                <rect x="50" y="5" width="25" height="25" rx="2" fill="currentColor" />
                <rect x="5" y="50" width="25" height="25" rx="2" fill="currentColor" />
                <rect x="35" y="35" width="10" height="10" rx="1" fill="currentColor" />
                <rect x="55" y="55" width="20" height="20" rx="2" fill="currentColor" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold">{t.scanTitle}</p>
              <p className="mt-1 text-xs text-neutral-500">{t.scanText}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-between border-t border-neutral-200 pt-3 text-[10px] text-neutral-400">
            <p>
              {legalName} \u00B7 {t.support}: {supportEmail}
            </p>
            <p>#ABCD1234</p>
          </div>
        </Card>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          This is a visual preview. Click &ldquo;Download sample PDF&rdquo;
          above to see the actual generated PDF file.
        </p>
      </div>

      {/* Email template previews */}
      <div className="mt-12">
        <h2 className="font-heading text-xl font-bold">Email templates</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Preview how ticket delivery and invitation emails render. Switch between locales and templates.
        </p>
        <EmailPreviewClient
          eventId={id}
          initialLocale={l}
          initialTicketHtml={emailPreview.ticketHtml}
          initialInvitationHtml={emailPreview.invitationHtml}
        />
      </div>
    </div>
  );
}
