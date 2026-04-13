import { Heading, Link, Section, Text } from "@react-email/components";
import {
  DetailRow,
  EmailLayout,
  FOOTER_QUESTIONS,
  FOOTER_SIGNATURE,
} from "./_layout";

interface OrderReceiptEmailProps {
  recipientName: string;
  orderShortId: string;
  eventTitle: string;
  subtotalFormatted: string;
  discountFormatted: string | null;
  totalFormatted: string;
  paymentMethod: string | null;
  orderUrl: string;
  lineItems: Array<{ description: string; amount: string }>;
  locale: "en" | "de" | "fr";
}

const T = {
  en: {
    preview: "Receipt for your {event} order",
    greeting: "Hi {name},",
    intro:
      "Thanks for your purchase. Here\u2019s your receipt. Tickets will arrive in separate emails, one per attendee.",
    summary: "Order summary",
    subtotal: "Subtotal",
    discount: "Discount",
    total: "Total paid",
    payment: "Payment method",
    orderLabel: "Order #",
    cta: "View order online",
  },
  de: {
    preview: "Quittung f\u00FCr Ihre Bestellung \u2013 {event}",
    greeting: "Hallo {name},",
    intro:
      "Vielen Dank f\u00FCr Ihren Einkauf. Hier ist Ihre Quittung. Die Tickets kommen in separaten E-Mails \u2013 eines pro Teilnehmer.",
    summary: "Bestell\u00FCbersicht",
    subtotal: "Zwischensumme",
    discount: "Rabatt",
    total: "Gesamt",
    payment: "Zahlungsart",
    orderLabel: "Bestell-Nr.",
    cta: "Bestellung ansehen",
  },
  fr: {
    preview: "Re\u00E7u pour votre commande \u2013 {event}",
    greeting: "Bonjour {name},",
    intro:
      "Merci pour votre achat. Voici votre re\u00E7u. Les billets arriveront s\u00E9par\u00E9ment, un par participant.",
    summary: "R\u00E9sum\u00E9 de la commande",
    subtotal: "Sous-total",
    discount: "R\u00E9duction",
    total: "Total pay\u00E9",
    payment: "Moyen de paiement",
    orderLabel: "Commande n\u00B0",
    cta: "Voir la commande",
  },
};

function interp(s: string, vars: Record<string, string>): string {
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}

export function OrderReceiptEmail(props: OrderReceiptEmailProps) {
  const t = T[props.locale];
  const vars = { name: props.recipientName, event: props.eventTitle };

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
          {t.intro}
        </Text>
      </Section>

      <Section className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-5">
        <Heading className="m-0 mb-3 text-base font-semibold text-neutral-900">
          {t.summary}
        </Heading>
        <Text className="m-0 mb-3 text-base font-bold text-neutral-900">
          {props.eventTitle}
        </Text>

        {props.lineItems.map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <Text className="m-0 text-sm text-neutral-700">
              {item.description}
            </Text>
            <Text className="m-0 text-sm text-neutral-900">{item.amount}</Text>
          </div>
        ))}

        <div
          style={{
            borderTop: "1px solid #e5e5e5",
            marginTop: 12,
            paddingTop: 12,
          }}
        >
          <DetailRow label={t.subtotal} value={props.subtotalFormatted} />
          {props.discountFormatted && (
            <DetailRow label={t.discount} value={props.discountFormatted} />
          )}
          <Text className="mt-2 text-base font-bold text-neutral-900">
            {t.total}: {props.totalFormatted}
          </Text>
          {props.paymentMethod && (
            <Text className="m-0 mt-1 text-xs uppercase tracking-wide text-neutral-500">
              {t.payment}: {props.paymentMethod}
            </Text>
          )}
          <Text className="m-0 mt-2 font-mono text-xs text-neutral-500">
            {t.orderLabel}: {props.orderShortId}
          </Text>
        </div>
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
