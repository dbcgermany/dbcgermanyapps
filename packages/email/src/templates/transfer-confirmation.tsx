import { Heading, Link, Section, Text } from "@react-email/components";
import {
  DetailRow,
  EmailLayout,
  FOOTER_QUESTIONS,
  FOOTER_SIGNATURE,
} from "./_layout";

interface TransferConfirmationEmailProps {
  recipientName: string;
  recipientEmail: string;
  previousHolderName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  venueName: string;
  tierName: string;
  ticketShortId: string;
  orderUrl: string;
  locale: "en" | "de" | "fr";
}

const T = {
  en: {
    preview: "Your ticket for {event} has been transferred",
    greeting: "Hi {name},",
    intro:
      "{previous} has transferred their {event} ticket to you. A new QR code is on its way in a separate email; the previous code is no longer valid.",
    detailsTitle: "Event details",
    dateLabel: "Date",
    venueLabel: "Venue",
    tierLabel: "Ticket type",
    ticketLabel: "New ticket #",
    cta: "View order online",
  },
  de: {
    preview: "Ihr Ticket f\u00FCr {event} wurde \u00FCbertragen",
    greeting: "Hallo {name},",
    intro:
      "{previous} hat Ihnen ihr Ticket f\u00FCr {event} \u00FCbertragen. Ein neuer QR-Code folgt in einer separaten E-Mail; der vorherige Code ist nicht mehr g\u00FCltig.",
    detailsTitle: "Veranstaltungsdetails",
    dateLabel: "Datum",
    venueLabel: "Ort",
    tierLabel: "Ticketart",
    ticketLabel: "Neue Ticket-Nr.",
    cta: "Bestellung online ansehen",
  },
  fr: {
    preview: "Votre billet pour {event} a \u00E9t\u00E9 transf\u00E9r\u00E9",
    greeting: "Bonjour {name},",
    intro:
      "{previous} vous a transf\u00E9r\u00E9 son billet pour {event}. Un nouveau code QR arrive par e-mail ; l\u2019ancien code n\u2019est plus valable.",
    detailsTitle: "D\u00E9tails de l\u2019\u00E9v\u00E9nement",
    dateLabel: "Date",
    venueLabel: "Lieu",
    tierLabel: "Type de billet",
    ticketLabel: "Nouveau billet n\u00B0",
    cta: "Voir la commande",
  },
};

function interp(s: string, vars: Record<string, string>): string {
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}

export function TransferConfirmationEmail(
  props: TransferConfirmationEmailProps
) {
  const t = T[props.locale];
  const vars = {
    name: props.recipientName,
    event: props.eventTitle,
    previous: props.previousHolderName,
  };

  return (
    <EmailLayout
      locale={props.locale}
      preview={interp(t.preview, vars)}
      footerQuestions={FOOTER_QUESTIONS[props.locale]}
      footerSignature={FOOTER_SIGNATURE}
    >
      <Section className="mt-6">
        <Text className="m-0 text-base text-neutral-800">
          {interp(t.greeting, vars)}
        </Text>
        <Text className="mt-3 text-sm leading-6 text-neutral-700">
          {interp(t.intro, vars)}
        </Text>
      </Section>

      <Section className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-5">
        <Heading className="m-0 mb-3 text-base font-semibold text-neutral-900">
          {t.detailsTitle}
        </Heading>
        <Text className="m-0 mb-2 text-base font-bold text-neutral-900">
          {props.eventTitle}
        </Text>
        <DetailRow
          label={t.dateLabel}
          value={`${props.eventDate} \u00B7 ${props.eventTime}`}
        />
        <DetailRow label={t.venueLabel} value={props.venueName} />
        <DetailRow label={t.tierLabel} value={props.tierName} />
        <DetailRow label={t.ticketLabel} value={props.ticketShortId} mono />
      </Section>

      <Section className="mt-6">
        <Link
          href={props.orderUrl}
          className="inline-block rounded-md bg-[#c8102e] px-5 py-2.5 text-sm font-medium text-white no-underline"
        >
          {t.cta}
        </Link>
      </Section>
    </EmailLayout>
  );
}
