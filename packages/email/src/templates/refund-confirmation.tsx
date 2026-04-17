import { Section, Text, Hr, Link } from "@react-email/components";
import {
  EmailLayout,
  DetailRow,
  FOOTER_SIGNATURE,
  FOOTER_QUESTIONS,
} from "./_layout";

export interface RefundConfirmationEmailProps {
  recipientName: string;
  eventTitle: string;
  orderShortId: string;
  refundAmountFormatted: string;
  locale: "en" | "de" | "fr";
}

const T = {
  en: {
    preview: "Your refund has been processed",
    greeting: "Hi {name},",
    body: "Your refund for the order below has been processed. The amount will be returned to your original payment method within 5\u201310 business days.",
    detailsTitle: "Refund details",
    eventLabel: "Event",
    orderLabel: "Order",
    amountLabel: "Refund amount",
    note: "If you have any questions about this refund, please reply to this email.",
    closing: "Best regards,",
    team: "The DBC Germany Team",
  },
  de: {
    preview: "Ihre R\u00FCckerstattung wurde bearbeitet",
    greeting: "Hallo {name},",
    body: "Ihre R\u00FCckerstattung f\u00FCr die folgende Bestellung wurde bearbeitet. Der Betrag wird innerhalb von 5\u201310 Werktagen auf Ihre urspr\u00FCngliche Zahlungsmethode zur\u00FCck\u00FCberwiesen.",
    detailsTitle: "R\u00FCckerstattungsdetails",
    eventLabel: "Veranstaltung",
    orderLabel: "Bestellung",
    amountLabel: "Erstattungsbetrag",
    note: "Bei Fragen zu dieser R\u00FCckerstattung antworten Sie bitte auf diese E-Mail.",
    closing: "Mit freundlichen Gr\u00FC\u00DFen,",
    team: "Das DBC Germany Team",
  },
  fr: {
    preview: "Votre remboursement a \u00E9t\u00E9 trait\u00E9",
    greeting: "Bonjour {name},",
    body: "Votre remboursement pour la commande ci-dessous a \u00E9t\u00E9 trait\u00E9. Le montant sera retourn\u00E9 sur votre mode de paiement d\u2019origine sous 5 \u00E0 10 jours ouvrables.",
    detailsTitle: "D\u00E9tails du remboursement",
    eventLabel: "\u00C9v\u00E9nement",
    orderLabel: "Commande",
    amountLabel: "Montant rembours\u00E9",
    note: "Pour toute question concernant ce remboursement, r\u00E9pondez \u00E0 cet e-mail.",
    closing: "Cordialement,",
    team: "L\u2019\u00E9quipe DBC Germany",
  },
};

export function RefundConfirmationEmail(
  props: RefundConfirmationEmailProps
) {
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
          {t.body}
        </Text>
      </Section>

      <Section className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-5">
        <Text className="m-0 mb-3 text-base font-semibold text-neutral-900">
          {t.detailsTitle}
        </Text>
        <Hr className="my-3 border-neutral-200" />
        <DetailRow label={t.eventLabel} value={props.eventTitle} />
        <DetailRow
          label={t.orderLabel}
          value={`#${props.orderShortId}`}
          mono
        />
        <DetailRow
          label={t.amountLabel}
          value={props.refundAmountFormatted}
        />
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
