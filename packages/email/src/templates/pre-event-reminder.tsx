import { Section, Heading, Text, Hr, Link } from "@react-email/components";
import {
  EmailLayout,
  DetailRow,
  FOOTER_SIGNATURE,
  FOOTER_QUESTIONS,
} from "./_layout";

export interface PreEventReminderEmailProps {
  attendeeName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  venueName: string;
  venueAddress: string;
  ticketShortId: string;
  orderUrl: string;
  locale: "en" | "de" | "fr";
}

const T = {
  en: {
    preview: "{event} is coming up!",
    greeting: "Hi {name},",
    body: "Just a friendly reminder that {event} is coming up soon. We look forward to seeing you there!",
    instructions:
      "Please have your ticket QR code ready at the entrance for fast check-in. You can access your ticket online anytime.",
    detailsTitle: "Event details",
    dateLabel: "Date",
    venueLabel: "Venue",
    ticketLabel: "Ticket #",
    cta: "View my ticket",
    closing: "See you there!",
    team: "The DBC Germany Team",
  },
  de: {
    preview: "{event} steht bevor!",
    greeting: "Hallo {name},",
    body: "Eine freundliche Erinnerung: {event} findet bald statt. Wir freuen uns auf Sie!",
    instructions:
      "Bitte halten Sie Ihren Ticket-QR-Code am Eingang bereit. Sie k\u00F6nnen Ihr Ticket jederzeit online abrufen.",
    detailsTitle: "Veranstaltungsdetails",
    dateLabel: "Datum",
    venueLabel: "Veranstaltungsort",
    ticketLabel: "Ticket-Nr.",
    cta: "Mein Ticket ansehen",
    closing: "Bis bald!",
    team: "Das DBC Germany Team",
  },
  fr: {
    preview: "{event} approche\u00A0!",
    greeting: "Bonjour {name},",
    body: "Un petit rappel\u00A0: {event} a lieu bient\u00F4t. Nous avons h\u00E2te de vous y accueillir\u00A0!",
    instructions:
      "Veuillez pr\u00E9parer votre code QR \u00E0 l\u2019entr\u00E9e pour un enregistrement rapide. Vous pouvez acc\u00E9der \u00E0 votre billet en ligne \u00E0 tout moment.",
    detailsTitle: "D\u00E9tails de l\u2019\u00E9v\u00E9nement",
    dateLabel: "Date",
    venueLabel: "Lieu",
    ticketLabel: "Billet n\u00B0",
    cta: "Voir mon billet",
    closing: "\u00C0 bient\u00F4t\u00A0!",
    team: "L\u2019\u00E9quipe DBC Germany",
  },
};

export function PreEventReminderEmail(props: PreEventReminderEmailProps) {
  const t = T[props.locale];

  return (
    <EmailLayout
      locale={props.locale}
      preview={t.preview.replace("{event}", props.eventTitle)}
      footerQuestions={FOOTER_QUESTIONS[props.locale]}
      footerSignature={FOOTER_SIGNATURE}
    >
      <Section className="mt-6">
        <Text className="m-0 text-base text-neutral-800">
          {t.greeting.replace("{name}", props.attendeeName)}
        </Text>
        <Text className="mt-3 text-sm leading-6 text-neutral-700">
          {t.body.replace("{event}", props.eventTitle)}
        </Text>
      </Section>

      <Section className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-5">
        <Heading className="m-0 mb-3 text-base font-semibold text-neutral-900">
          {t.detailsTitle}
        </Heading>
        <Hr className="my-3 border-neutral-200" />
        <DetailRow
          label={t.dateLabel}
          value={`${props.eventDate} \u00B7 ${props.eventTime}`}
        />
        <DetailRow
          label={t.venueLabel}
          value={`${props.venueName}, ${props.venueAddress}`}
        />
        <DetailRow label={t.ticketLabel} value={props.ticketShortId} mono />
      </Section>

      <Section className="mt-6">
        <Text className="text-sm leading-6 text-neutral-700">
          {t.instructions}
        </Text>
        <Link
          href={props.orderUrl}
          className="mt-3 inline-block rounded-md bg-[#c8102e] px-5 py-2.5 text-sm font-medium text-white no-underline"
        >
          {t.cta}
        </Link>
      </Section>

      <Section className="mt-8">
        <Text className="m-0 text-sm text-neutral-800">{t.closing}</Text>
        <Text className="m-0 mt-2 text-sm font-semibold text-neutral-800">
          {t.team}
        </Text>
      </Section>
    </EmailLayout>
  );
}
