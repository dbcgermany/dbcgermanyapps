import { Link, Section, Text } from "@react-email/components";
import { EmailLayout, FOOTER_SIGNATURE } from "./_layout";

interface NewsletterEmailProps {
  subject: string;
  preheader?: string;
  /** Pre-rendered plain-text / markdown-lite body (paragraphs split by blank lines). */
  body: string;
  unsubscribeUrl: string;
  locale: "en" | "de" | "fr";
}

const UNSUB = {
  en: "Unsubscribe",
  de: "Abmelden",
  fr: "Se d\u00e9sabonner",
};

const RECEIVED_BECAUSE = {
  en: "You are receiving this because you subscribed to the DBC Germany newsletter.",
  de: "Sie erhalten diese E-Mail, weil Sie den DBC-Germany-Newsletter abonniert haben.",
  fr: "Vous recevez ce message parce que vous \u00eates abonn\u00e9\u00b7e \u00e0 la newsletter DBC Germany.",
};

export function NewsletterEmail(props: NewsletterEmailProps) {
  const paragraphs = props.body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const footerQuestions = RECEIVED_BECAUSE[props.locale];

  return (
    <EmailLayout
      locale={props.locale}
      preview={props.preheader || props.subject}
      footerQuestions={footerQuestions}
      footerSignature={FOOTER_SIGNATURE}
    >
      <Section className="mt-6">
        <Text className="m-0 text-base font-semibold text-neutral-900">
          {props.subject}
        </Text>
      </Section>
      <Section className="mt-4">
        {paragraphs.map((p, i) => (
          <Text
            key={i}
            className="m-0 mb-4 text-sm leading-6 text-neutral-700"
          >
            {p}
          </Text>
        ))}
      </Section>
      <Section className="mt-6">
        <Text className="m-0 text-xs text-neutral-400">
          <Link
            href={props.unsubscribeUrl}
            className="text-neutral-500 underline"
          >
            {UNSUB[props.locale]}
          </Link>
        </Text>
      </Section>
    </EmailLayout>
  );
}
