import { Section, Text, Hr, Link } from "@react-email/components";
import {
  EmailLayout,
  DetailRow,
  FOOTER_SIGNATURE,
  FOOTER_QUESTIONS,
} from "./_layout";

export interface PaymentReminderEmailProps {
  recipientName: string;
  eventTitle: string;
  orderShortId: string;
  totalFormatted: string;
  orderUrl: string;
  locale: "en" | "de" | "fr";
}

const T = {
  en: {
    preview: "Payment reminder for your order",
    greeting: "Hi {name},",
    body: "We noticed that your order for {event} has not been paid yet. Please complete the payment at your earliest convenience to secure your ticket.",
    detailsTitle: "Order details",
    eventLabel: "Event",
    orderLabel: "Order",
    amountLabel: "Amount due",
    cta: "Complete payment",
    note: "If you have already completed the payment, please disregard this message. Bank transfers may take 1\u20132 business days to process.",
    closing: "Best regards,",
    team: "The DBC Germany Team",
  },
  de: {
    preview: "Zahlungserinnerung f\u00FCr Ihre Bestellung",
    greeting: "Hallo {name},",
    body: "Wir haben festgestellt, dass Ihre Bestellung f\u00FCr {event} noch nicht bezahlt wurde. Bitte schlie\u00DFen Sie die Zahlung ab, um Ihr Ticket zu sichern.",
    detailsTitle: "Bestelldetails",
    eventLabel: "Veranstaltung",
    orderLabel: "Bestellung",
    amountLabel: "Offener Betrag",
    cta: "Zahlung abschlie\u00DFen",
    note: "Falls Sie die Zahlung bereits get\u00E4tigt haben, k\u00F6nnen Sie diese Nachricht ignorieren. Bank\u00FCberweisungen k\u00F6nnen 1\u20132 Werktage dauern.",
    closing: "Mit freundlichen Gr\u00FC\u00DFen,",
    team: "Das DBC Germany Team",
  },
  fr: {
    preview: "Rappel de paiement pour votre commande",
    greeting: "Bonjour {name},",
    body: "Nous avons constat\u00E9 que votre commande pour {event} n\u2019a pas encore \u00E9t\u00E9 r\u00E9gl\u00E9e. Veuillez effectuer le paiement afin de s\u00E9curiser votre billet.",
    detailsTitle: "D\u00E9tails de la commande",
    eventLabel: "\u00C9v\u00E9nement",
    orderLabel: "Commande",
    amountLabel: "Montant d\u00FB",
    cta: "Compl\u00E9ter le paiement",
    note: "Si vous avez d\u00E9j\u00E0 effectu\u00E9 le paiement, veuillez ignorer ce message. Les virements bancaires peuvent prendre 1 \u00E0 2 jours ouvrables.",
    closing: "Cordialement,",
    team: "L\u2019\u00E9quipe DBC Germany",
  },
};

export function PaymentReminderEmail(props: PaymentReminderEmailProps) {
  const t = T[props.locale];

  return (
    <EmailLayout
      locale={props.locale}
      preview={t.preview}
      footerQuestions={FOOTER_QUESTIONS[props.locale]}
      footerSignature={FOOTER_SIGNATURE}
    >
      <Section className="mt-6">
        <Text className="m-0 text-base text-neutral-800">
          {t.greeting.replace("{name}", props.recipientName)}
        </Text>
        <Text className="mt-3 text-sm leading-6 text-neutral-700">
          {t.body.replace("{event}", props.eventTitle)}
        </Text>
      </Section>

      <Section className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-5">
        <Text className="m-0 mb-3 text-base font-semibold text-neutral-900">
          {t.detailsTitle}
        </Text>
        <Hr className="my-3 border-neutral-200" />
        <DetailRow label={t.eventLabel} value={props.eventTitle} />
        <DetailRow label={t.orderLabel} value={`#${props.orderShortId}`} mono />
        <DetailRow label={t.amountLabel} value={props.totalFormatted} />
      </Section>

      <Section className="mt-6">
        <Link
          href={props.orderUrl}
          className="inline-block rounded-md bg-[#c8102e] px-5 py-2.5 text-sm font-medium text-white no-underline"
        >
          {t.cta}
        </Link>
      </Section>

      <Section className="mt-6">
        <Text className="text-sm leading-6 text-neutral-500">{t.note}</Text>
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
