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

interface TicketDeliveryEmailProps {
  attendeeName: string;
  eventTitle: string;
  eventDate: string; // Pre-formatted in correct locale
  eventTime: string;
  venueName: string;
  venueAddress: string;
  tierName: string;
  ticketShortId: string;
  orderUrl: string;
  locale: "en" | "de" | "fr";
  logoUrl?: string;
}

const TRANSLATIONS = {
  en: {
    preview: "Your ticket for {event}",
    greeting: "Hi {name},",
    intro:
      "You\u2019re all set for {event} \u2014 your ticket is attached as a PDF.",
    detailsTitle: "Event details",
    dateLabel: "Date",
    venueLabel: "Venue",
    tierLabel: "Ticket type",
    ticketLabel: "Ticket #",
    instructions:
      "Show the QR code on your PDF ticket at the door for fast check-in. You can also pull up your order online anytime below.",
    viewOrder: "View order online",
    footer: "Sent by DBC Germany \u00B7 tickets.dbc-germany.com",
    questions:
      "Questions? Reply to this email and we\u2019ll get back to you.",
  },
  de: {
    preview: "Ihr Ticket f\u00FCr {event}",
    greeting: "Hallo {name},",
    intro:
      "Sie sind f\u00FCr {event} bereit \u2014 Ihr Ticket liegt als PDF an.",
    detailsTitle: "Veranstaltungsdetails",
    dateLabel: "Datum",
    venueLabel: "Veranstaltungsort",
    tierLabel: "Ticketart",
    ticketLabel: "Ticket-Nr.",
    instructions:
      "Zeigen Sie den QR-Code auf Ihrem PDF-Ticket am Eingang f\u00FCr einen schnellen Check-in vor. Ihre Bestellung k\u00F6nnen Sie jederzeit online einsehen.",
    viewOrder: "Bestellung online ansehen",
    footer: "Gesendet von DBC Germany \u00B7 tickets.dbc-germany.com",
    questions:
      "Fragen? Antworten Sie einfach auf diese E-Mail \u2014 wir melden uns zur\u00FCck.",
  },
  fr: {
    preview: "Votre billet pour {event}",
    greeting: "Bonjour {name},",
    intro:
      "Tout est pr\u00EAt pour {event} \u2014 votre billet est joint au format PDF.",
    detailsTitle: "D\u00E9tails de l\u2019\u00E9v\u00E9nement",
    dateLabel: "Date",
    venueLabel: "Lieu",
    tierLabel: "Type de billet",
    ticketLabel: "Billet n\u00B0",
    instructions:
      "Pr\u00E9sentez le code QR de votre billet PDF \u00E0 l\u2019entr\u00E9e pour un enregistrement rapide. Vous pouvez aussi consulter votre commande en ligne \u00E0 tout moment.",
    viewOrder: "Voir la commande en ligne",
    footer: "Envoy\u00E9 par DBC Germany \u00B7 tickets.dbc-germany.com",
    questions:
      "Une question ? R\u00E9pondez \u00E0 cet e-mail et nous vous recontacterons.",
  },
};

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? "");
}

export function TicketDeliveryEmail(props: TicketDeliveryEmailProps) {
  const t = TRANSLATIONS[props.locale];
  const vars = { name: props.attendeeName, event: props.eventTitle };

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
                      DBC GERMANY
                    </Text>
                    <Text className="m-0 mt-1 text-xs text-neutral-500">
                      Africa&rsquo;s Top Business Group
                    </Text>
                  </td>
                </tr>
              </table>
            </Section>

            <Section className="mt-6">
              <Text className="m-0 text-base text-neutral-800">
                {interpolate(t.greeting, vars)}
              </Text>
              <Text className="mt-3 text-sm leading-6 text-neutral-700">
                {interpolate(t.intro, vars)}
              </Text>
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

              <DetailRow label={t.dateLabel} value={`${props.eventDate} \u00B7 ${props.eventTime}`} />
              <DetailRow label={t.venueLabel} value={`${props.venueName}, ${props.venueAddress}`} />
              <DetailRow label={t.tierLabel} value={props.tierName} />
              <DetailRow label={t.ticketLabel} value={props.ticketShortId} mono />
            </Section>

            {/* Instructions */}
            <Section className="mt-6">
              <Text className="text-sm leading-6 text-neutral-700">
                {t.instructions}
              </Text>
              <Link
                href={props.orderUrl}
                className="mt-2 inline-block rounded-md bg-[#c8102e] px-5 py-2.5 text-sm font-medium text-white no-underline"
              >
                {t.viewOrder}
              </Link>
            </Section>

            <Hr className="my-8 border-neutral-200" />

            {/* Footer */}
            <Section>
              <Text className="m-0 text-xs text-neutral-500">{t.questions}</Text>
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
