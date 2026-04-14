import {
  Html,
  Head,
  Body,
  Container,
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
}

const TRANSLATIONS = {
  en: {
    preview: "Your ticket for {event}",
    greeting: "Hi {name},",
    intro: "Your ticket for {event} is attached to this email as a PDF.",
    detailsTitle: "Event details",
    dateLabel: "Date",
    venueLabel: "Venue",
    tierLabel: "Ticket type",
    ticketLabel: "Ticket #",
    instructions: "Present the QR code on your PDF ticket at the entrance for fast check-in. You can also access your order online anytime.",
    viewOrder: "View order online",
    footer: "Sent by DBC Germany (UG i.G.) \u00B7 ticket.dbc-germany.com",
    questions: "Questions? Reply to this email or contact us at hello@dbc-germany.com.",
  },
  de: {
    preview: "Ihr Ticket f\u00FCr {event}",
    greeting: "Hallo {name},",
    intro: "Ihr Ticket f\u00FCr {event} ist als PDF an diese E-Mail angeh\u00E4ngt.",
    detailsTitle: "Veranstaltungsdetails",
    dateLabel: "Datum",
    venueLabel: "Veranstaltungsort",
    tierLabel: "Ticketart",
    ticketLabel: "Ticket-Nr.",
    instructions: "Zeigen Sie den QR-Code auf Ihrem PDF-Ticket am Eingang f\u00FCr einen schnellen Check-in vor. Sie k\u00F6nnen Ihre Bestellung jederzeit online einsehen.",
    viewOrder: "Bestellung online ansehen",
    footer: "Gesendet von DBC Germany (UG i.G.) \u00B7 ticket.dbc-germany.com",
    questions: "Fragen? Antworten Sie auf diese E-Mail oder kontaktieren Sie uns unter hello@dbc-germany.com.",
  },
  fr: {
    preview: "Votre billet pour {event}",
    greeting: "Bonjour {name},",
    intro: "Votre billet pour {event} est joint \u00E0 cet e-mail au format PDF.",
    detailsTitle: "D\u00E9tails de l\u2019\u00E9v\u00E9nement",
    dateLabel: "Date",
    venueLabel: "Lieu",
    tierLabel: "Type de billet",
    ticketLabel: "Billet n\u00B0",
    instructions: "Pr\u00E9sentez le code QR sur votre billet PDF \u00E0 l\u2019entr\u00E9e pour un enregistrement rapide. Vous pouvez \u00E9galement consulter votre commande en ligne \u00E0 tout moment.",
    viewOrder: "Voir la commande en ligne",
    footer: "Envoy\u00E9 par DBC Germany (UG i.G.) \u00B7 ticket.dbc-germany.com",
    questions: "Des questions ? R\u00E9pondez \u00E0 cet e-mail ou contactez-nous \u00E0 hello@dbc-germany.com.",
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
              <Text className="m-0 text-xl font-bold tracking-wider text-[#c8102e]">
                DBC GERMANY
              </Text>
              <Text className="m-0 mt-1 text-xs text-neutral-500">
                Africa\u2019s Top Business Group
              </Text>
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
