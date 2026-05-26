import { Section, Text, Link, Hr } from "@react-email/components";
import {
  EmailLayout,
  DetailRow,
  FOOTER_SIGNATURE,
  FOOTER_QUESTIONS,
} from "./_layout";

export interface AffiliateConversionEmailProps {
  recipientName: string;
  eventTitle: string;
  commissionAmountFormatted: string; // "€15.00"
  ticketCount: number;
  dashboardUrl: string;
  locale: "en" | "de" | "fr";
}

const T = {
  en: {
    preview: "You just earned a commission from {event}",
    greeting: "Hi {name},",
    body: "Good news — your code was just used to buy {n} ticket(s) for {event}.",
    detailsTitle: "This sale",
    eventLabel: "Event",
    ticketsLabel: "Tickets sold",
    commissionLabel: "You earned",
    cta: "View your dashboard",
    note: "Commissions are paid out by bank transfer after the event.",
    closing: "Cheers,",
    team: "The DBC Germany Team",
  },
  de: {
    preview: "Du hast gerade eine Provision für {event} verdient",
    greeting: "Hallo {name},",
    body: "Gute Nachricht — dein Code wurde gerade verwendet, um {n} Ticket(s) für {event} zu kaufen.",
    detailsTitle: "Dieser Verkauf",
    eventLabel: "Veranstaltung",
    ticketsLabel: "Verkaufte Tickets",
    commissionLabel: "Du verdienst",
    cta: "Dashboard ansehen",
    note: "Provisionen werden per Banküberweisung nach dem Event ausgezahlt.",
    closing: "Viele Grüße,",
    team: "Das DBC Germany Team",
  },
  fr: {
    preview: "Vous venez de gagner une commission pour {event}",
    greeting: "Bonjour {name},",
    body: "Bonne nouvelle — votre code vient d'être utilisé pour acheter {n} billet(s) pour {event}.",
    detailsTitle: "Cette vente",
    eventLabel: "Événement",
    ticketsLabel: "Billets vendus",
    commissionLabel: "Vous avez gagné",
    cta: "Voir votre tableau de bord",
    note: "Les commissions sont versées par virement bancaire après l'événement.",
    closing: "Cordialement,",
    team: "L'équipe DBC Germany",
  },
} as const;

export function AffiliateConversionEmail(props: AffiliateConversionEmailProps) {
  const t = T[props.locale];
  const body = t.body
    .replace("{n}", String(props.ticketCount))
    .replace("{event}", props.eventTitle);
  return (
    <EmailLayout
      locale={props.locale}
      preview={t.preview.replace("{event}", props.eventTitle)}
      footerQuestions={FOOTER_QUESTIONS[props.locale]}
      footerSignature={FOOTER_SIGNATURE}
    >
      <Section className="mt-6">
        <Text className="m-0 text-base text-neutral-800">
          {t.greeting.replace("{name}", props.recipientName)}
        </Text>
        <Text className="mt-3 text-sm leading-6 text-neutral-700">{body}</Text>
      </Section>

      <Section className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-5">
        <Text className="m-0 mb-3 text-base font-semibold text-neutral-900">
          {t.detailsTitle}
        </Text>
        <Hr className="my-3 border-neutral-200" />
        <DetailRow label={t.eventLabel} value={props.eventTitle} />
        <DetailRow label={t.ticketsLabel} value={String(props.ticketCount)} />
        <DetailRow
          label={t.commissionLabel}
          value={props.commissionAmountFormatted}
        />
      </Section>

      <Section className="mt-6">
        <Link
          href={props.dashboardUrl}
          className="inline-block rounded bg-[#c8102e] px-4 py-2 text-sm font-semibold text-white no-underline"
        >
          {t.cta}
        </Link>
      </Section>

      <Section className="mt-6">
        <Text className="text-sm leading-6 text-neutral-700">{t.note}</Text>
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
