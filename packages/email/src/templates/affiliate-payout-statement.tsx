import { Section, Text, Link, Hr } from "@react-email/components";
import {
  EmailLayout,
  DetailRow,
  FOOTER_SIGNATURE,
  FOOTER_QUESTIONS,
} from "./_layout";

export interface AffiliatePayoutStatementEmailProps {
  recipientName: string;
  amountFormatted: string;
  periodLabel: string; // e.g. "May 2026" or "Richesses 2026"
  paymentReference: string | null;
  dashboardUrl: string | null;
  locale: "en" | "de" | "fr";
}

const T = {
  en: {
    preview: "Your affiliate payout is on the way",
    greeting: "Hi {name},",
    body: "We've initiated a bank transfer for your affiliate commissions covering {period}. The statement is attached as a PDF.",
    detailsTitle: "Payout details",
    amountLabel: "Total amount",
    periodLabel: "Period",
    referenceLabel: "Bank reference",
    note: "If you have any questions about this statement, just reply to this email.",
    cta: "View your dashboard",
    closing: "Thank you for your work,",
    team: "The DBC Germany Team",
  },
  de: {
    preview: "Deine Affiliate-Auszahlung ist unterwegs",
    greeting: "Hallo {name},",
    body: "Wir haben eine Banküberweisung für deine Affiliate-Provisionen für {period} angestoßen. Die Aufstellung findest du im Anhang als PDF.",
    detailsTitle: "Auszahlungsdetails",
    amountLabel: "Gesamtbetrag",
    periodLabel: "Zeitraum",
    referenceLabel: "Bankreferenz",
    note: "Bei Fragen zu dieser Aufstellung einfach auf diese E-Mail antworten.",
    cta: "Dashboard ansehen",
    closing: "Vielen Dank für deine Arbeit,",
    team: "Das DBC Germany Team",
  },
  fr: {
    preview: "Votre paiement d'affiliation est en route",
    greeting: "Bonjour {name},",
    body: "Nous avons lancé un virement bancaire pour vos commissions d'affiliation couvrant {period}. Le relevé est en pièce jointe au format PDF.",
    detailsTitle: "Détails du paiement",
    amountLabel: "Montant total",
    periodLabel: "Période",
    referenceLabel: "Référence bancaire",
    note: "Pour toute question sur ce relevé, répondez simplement à cet e-mail.",
    cta: "Voir votre tableau de bord",
    closing: "Merci pour votre travail,",
    team: "L'équipe DBC Germany",
  },
} as const;

export function AffiliatePayoutStatementEmail(
  props: AffiliatePayoutStatementEmailProps
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
          {t.body.replace("{period}", props.periodLabel)}
        </Text>
      </Section>

      <Section className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-5">
        <Text className="m-0 mb-3 text-base font-semibold text-neutral-900">
          {t.detailsTitle}
        </Text>
        <Hr className="my-3 border-neutral-200" />
        <DetailRow label={t.amountLabel} value={props.amountFormatted} />
        <DetailRow label={t.periodLabel} value={props.periodLabel} />
        {props.paymentReference && (
          <DetailRow
            label={t.referenceLabel}
            value={props.paymentReference}
            mono
          />
        )}
      </Section>

      {props.dashboardUrl && (
        <Section className="mt-6">
          <Link
            href={props.dashboardUrl}
            className="inline-block rounded border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-900 no-underline"
          >
            {t.cta}
          </Link>
        </Section>
      )}

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
