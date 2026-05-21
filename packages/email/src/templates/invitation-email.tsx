import {
  Html,
  Head,
  Body,
  Container,
  Img,
  Section,
  Heading,
  Text,
  Hr,
  Link,
  Preview,
  Tailwind,
} from "@react-email/components";

export interface InvitationEmailProps {
  salutation: string;
  closing: string;
  bodyText: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  venueName: string;
  venueAddress: string;
  tierName: string;
  ticketShortId: string;
  orderUrl: string;
  locale: "en" | "de" | "fr";
  senderName?: string;
  senderTitle?: string;
  logoUrl?: string;
  /**
   * Per-ticket catering pre-order URL. Renders a dedicated section between
   * the body text and the formal closing when eligible. null/undefined hides
   * the section.
   */
  cateringUrl?: string;
}

// ---------------------------------------------------------------------------
// Default invitation body templates per locale
// ---------------------------------------------------------------------------

export const DEFAULT_INVITATION_BODY: Record<"en" | "de" | "fr", string> = {
  en: "We are pleased to invite you to {event} on {date} at {venue}.\n\nYour complimentary ticket is attached to this email as a PDF. Please present the QR code at the entrance for check-in.\n\nWe look forward to welcoming you.",
  de: "Wir freuen uns, Sie zu {event} am {date} in {venue} einladen zu dürfen.\n\nIhr persönliches Ticket liegt dieser E-Mail als PDF bei. Bitte zeigen Sie den QR-Code am Eingang vor.\n\nWir freuen uns auf Ihren Besuch.",
  fr: "Nous avons le plaisir de vous inviter à {event} le {date} à {venue}.\n\nVotre billet est joint à cet e-mail au format PDF. Veuillez présenter le code QR à l'entrée.\n\nNous nous réjouissons de vous accueillir.",
};

const TRANSLATIONS = {
  en: {
    preview: "Your invitation to {event}",
    detailsTitle: "Event details",
    dateLabel: "Date",
    venueLabel: "Venue",
    tierLabel: "Ticket type",
    ticketLabel: "Ticket #",
    viewOrder: "View order online",
    footer: "Sent by DBC Germany UG \u00B7 tickets.dbc-germany.com",
    questions:
      "Questions? Just reply to this email.",
    cateringHeading: "Catering is included with your ticket",
    cateringNote:
      "Pre-select your meal so the kitchen can plan for dietary requirements ahead of the event.",
    cateringCta: "Choose my meal",
  },
  de: {
    preview: "Ihre Einladung zu {event}",
    detailsTitle: "Veranstaltungsdetails",
    dateLabel: "Datum",
    venueLabel: "Veranstaltungsort",
    tierLabel: "Ticketart",
    ticketLabel: "Ticket-Nr.",
    viewOrder: "Bestellung online ansehen",
    footer: "Gesendet von DBC Germany UG \u00B7 tickets.dbc-germany.com",
    questions:
      "Fragen? Antworten Sie einfach auf diese E-Mail.",
    cateringHeading: "Catering ist in Ihrem Ticket enthalten",
    cateringNote:
      "W\u00E4hlen Sie Ihr Men\u00FC im Voraus, damit die K\u00FCche Ihre Ern\u00E4hrungsw\u00FCnsche vorbereiten kann.",
    cateringCta: "Men\u00FC w\u00E4hlen",
  },
  fr: {
    preview: "Votre invitation \u00E0 {event}",
    detailsTitle: "D\u00E9tails de l\u2019\u00E9v\u00E9nement",
    dateLabel: "Date",
    venueLabel: "Lieu",
    tierLabel: "Type de billet",
    ticketLabel: "Billet n\u00B0",
    viewOrder: "Voir la commande en ligne",
    footer:
      "Envoy\u00E9 par DBC Germany UG \u00B7 tickets.dbc-germany.com",
    questions:
      "Des questions ? R\u00E9pondez simplement \u00E0 cet e-mail.",
    cateringHeading: "La restauration est incluse avec votre billet",
    cateringNote:
      "Pr\u00E9-s\u00E9lectionnez votre menu pour que la cuisine puisse anticiper vos pr\u00E9f\u00E9rences alimentaires.",
    cateringCta: "Choisir mon menu",
  },
};

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? "");
}

export function InvitationEmail(props: InvitationEmailProps) {
  const t = TRANSLATIONS[props.locale];
  const vars = { event: props.eventTitle };

  // Split body text into paragraphs on double newlines
  const paragraphs = props.bodyText.split(/\n\n+/).filter(Boolean);

  return (
    <Html lang={props.locale}>
      <Head />
      <Preview>{interpolate(t.preview, vars)}</Preview>
      <Tailwind>
        <Body className="bg-neutral-50 font-sans">
          <Container className="mx-auto my-8 max-w-xl rounded-lg bg-white p-8 shadow-sm">
            {/* Brand header */}
            <Section className="border-b-2 border-[#c8102e] pb-4">
              <table cellPadding={0} cellSpacing={0} role="presentation">
                <tr>
                  {props.logoUrl && (
                    <td style={{ paddingRight: 12, verticalAlign: "middle" }}>
                      <Img src={props.logoUrl} alt="" width="auto" height={40} style={{ maxWidth: 120, maxHeight: 40, objectFit: "contain", borderRadius: 4 }} />
                    </td>
                  )}
                  <td style={{ verticalAlign: "middle" }}>
                    <Text className="m-0 text-xl font-bold tracking-wider text-[#c8102e]">
                      Germany
                    </Text>
                    <Text className="m-0 mt-1 text-xs text-neutral-500">
                      Africa{"\u2019"}s Top Business Group
                    </Text>
                  </td>
                </tr>
              </table>
            </Section>

            {/* Formal salutation */}
            <Section className="mt-6">
              <Text className="m-0 text-base text-neutral-800">
                {props.salutation},
              </Text>
            </Section>

            {/* Body text paragraphs */}
            <Section className="mt-4">
              {paragraphs.map((p, i) => (
                <Text
                  key={i}
                  className="mt-3 text-sm leading-6 text-neutral-700"
                >
                  {p}
                </Text>
              ))}
            </Section>

            {/* Event details card */}
            <Section className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-5">
              <Heading className="m-0 mb-3 text-base font-semibold text-neutral-900">
                {t.detailsTitle}
              </Heading>
              <Text className="m-0 mb-2 text-base font-bold text-neutral-900">
                {props.eventTitle}
              </Text>

              <Hr className="my-3 border-neutral-200" />

              <DetailRow
                label={t.dateLabel}
                value={`${props.eventDate} \u00B7 ${props.eventTime}`}
              />
              <DetailRow
                label={t.venueLabel}
                value={`${props.venueName}, ${props.venueAddress}`}
              />
              <DetailRow label={t.tierLabel} value={props.tierName} />
              <DetailRow
                label={t.ticketLabel}
                value={props.ticketShortId}
                mono
              />
            </Section>

            {/* CTA button */}
            <Section className="mt-6">
              <Link
                href={props.orderUrl}
                className="inline-block rounded-md bg-[#c8102e] px-5 py-2.5 text-sm font-medium text-white no-underline"
              >
                {t.viewOrder}
              </Link>
            </Section>

            {/* Catering pre-order — eligible holders only, resolved server-side
                via computeCateringUrl. Suppressed when the URL is absent. */}
            {props.cateringUrl && (
              <Section className="mt-6 rounded-lg border border-[#c8102e]/30 bg-[#fff5f6] p-5">
                <Heading className="m-0 mb-2 text-base font-semibold text-neutral-900">
                  {t.cateringHeading}
                </Heading>
                <Text className="m-0 text-sm leading-6 text-neutral-700">
                  {t.cateringNote}
                </Text>
                <Link
                  href={props.cateringUrl}
                  className="mt-3 inline-block rounded-md bg-[#c8102e] px-5 py-2.5 text-sm font-medium text-white no-underline"
                >
                  {t.cateringCta}
                </Link>
              </Section>
            )}

            {/* Formal closing */}
            <Section className="mt-8">
              <Text className="m-0 text-sm text-neutral-800">
                {props.closing}
              </Text>
              {props.senderName && (
                <Text className="m-0 mt-2 text-sm font-semibold text-neutral-800">
                  {props.senderName}
                </Text>
              )}
              {props.senderTitle && (
                <Text className="m-0 text-xs text-neutral-500">
                  {props.senderTitle}
                </Text>
              )}
            </Section>

            <Hr className="my-8 border-neutral-200" />

            {/* Footer */}
            <Section>
              <Text className="m-0 text-xs text-neutral-500">
                {t.questions}
              </Text>
              <Text className="mt-3 text-xs text-neutral-400">{t.footer}</Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div style={{ marginBottom: 6 }}>
      <Text className="m-0 text-xs uppercase tracking-wide text-neutral-500">
        {label}
      </Text>
      <Text
        className={`m-0 text-sm text-neutral-900 ${mono ? "font-mono" : ""}`}
      >
        {value}
      </Text>
    </div>
  );
}
