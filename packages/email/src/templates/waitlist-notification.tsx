import { Heading, Link, Section, Text } from "@react-email/components";
import {
  DetailRow,
  EmailLayout,
  FOOTER_QUESTIONS,
  FOOTER_SIGNATURE,
} from "./_layout";

interface WaitlistNotificationEmailProps {
  recipientEmail: string;
  eventTitle: string;
  tierName: string;
  expiresAt: string; // pre-formatted
  checkoutUrl: string;
  locale: "en" | "de" | "fr";
}

const T = {
  en: {
    preview: "A ticket just opened up for {event}",
    greeting: "Hello,",
    intro:
      "Good news: a ticket for {event} in the \u201c{tier}\u201d tier just became available and your waitlist spot is up. This reservation is first-come, first-served.",
    detailsTitle: "Reservation",
    tierLabel: "Ticket type",
    expiresLabel: "Reservation holds until",
    cta: "Claim your ticket",
    footerNote:
      "If the link expires before you complete checkout you\u2019ll go back on the waitlist.",
  },
  de: {
    preview: "Ein Ticket f\u00FCr {event} ist freigeworden",
    greeting: "Hallo,",
    intro:
      "Gute Nachrichten: Ein Ticket f\u00FCr {event} in der Kategorie \u201E{tier}\u201C ist wieder verf\u00FCgbar und Ihre Wartelisten-Position ist dran. Nach dem Prinzip \u201Ewer zuerst kommt, mahlt zuerst\u201C.",
    detailsTitle: "Reservierung",
    tierLabel: "Ticketart",
    expiresLabel: "Reserviert bis",
    cta: "Ticket sichern",
    footerNote:
      "Wenn der Link abl\u00E4uft, kommen Sie zur\u00FCck auf die Warteliste.",
  },
  fr: {
    preview: "Un billet est disponible pour {event}",
    greeting: "Bonjour,",
    intro:
      "Bonne nouvelle : un billet pour {event} dans la cat\u00E9gorie \u00AB {tier} \u00BB vient de se lib\u00E9rer et c\u2019est votre tour. Premier arriv\u00E9, premier servi.",
    detailsTitle: "R\u00E9servation",
    tierLabel: "Type de billet",
    expiresLabel: "R\u00E9serv\u00E9 jusqu\u2019au",
    cta: "R\u00E9server mon billet",
    footerNote:
      "Si le lien expire, vous reviendrez automatiquement sur la liste d\u2019attente.",
  },
};

function interp(s: string, vars: Record<string, string>): string {
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}

export function WaitlistNotificationEmail(
  props: WaitlistNotificationEmailProps
) {
  const t = T[props.locale];
  const vars = { event: props.eventTitle, tier: props.tierName };

  return (
    <EmailLayout
      locale={props.locale}
      preview={interp(t.preview, vars)}
      footerQuestions={FOOTER_QUESTIONS[props.locale]}
      footerSignature={FOOTER_SIGNATURE}
    >
      <Section className="mt-6">
        <Text className="m-0 text-base text-neutral-800">{t.greeting}</Text>
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
        <DetailRow label={t.tierLabel} value={props.tierName} />
        <DetailRow label={t.expiresLabel} value={props.expiresAt} />
      </Section>

      <Section className="mt-6">
        <Link
          href={props.checkoutUrl}
          className="inline-block rounded-md bg-[#c8102e] px-5 py-2.5 text-sm font-medium text-white no-underline"
        >
          {t.cta}
        </Link>
        <Text className="mt-3 text-xs text-neutral-500">{t.footerNote}</Text>
      </Section>
    </EmailLayout>
  );
}
