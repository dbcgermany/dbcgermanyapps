import { Section, Text } from "@react-email/components";
import {
  EmailLayout,
  FOOTER_SIGNATURE,
  FOOTER_QUESTIONS,
} from "./_layout";

export interface ContactFormConfirmEmailProps {
  name: string;
  locale: "en" | "de" | "fr";
}

const T = {
  en: {
    preview: "We received your message",
    greeting: "Hi {name},",
    body1:
      "Thank you for reaching out to DBC Germany. We have received your message and our team will get back to you as soon as possible.",
    body2:
      "If your inquiry is urgent, you can also reach us directly at hello@dbc-germany.com.",
    closing: "Best regards,",
    team: "The DBC Germany Team",
  },
  de: {
    preview: "Wir haben Ihre Nachricht erhalten",
    greeting: "Hallo {name},",
    body1:
      "vielen Dank f\u00FCr Ihre Nachricht an DBC Germany. Wir haben Ihre Anfrage erhalten und unser Team wird sich so schnell wie m\u00F6glich bei Ihnen melden.",
    body2:
      "F\u00FCr dringende Anfragen erreichen Sie uns auch direkt unter hello@dbc-germany.com.",
    closing: "Mit freundlichen Gr\u00FC\u00DFen,",
    team: "Das DBC Germany Team",
  },
  fr: {
    preview: "Nous avons re\u00E7u votre message",
    greeting: "Bonjour {name},",
    body1:
      "Merci d\u2019avoir contact\u00E9 DBC Germany. Nous avons bien re\u00E7u votre message et notre \u00E9quipe vous r\u00E9pondra dans les meilleurs d\u00E9lais.",
    body2:
      "Pour toute demande urgente, vous pouvez \u00E9galement nous contacter directement \u00E0 hello@dbc-germany.com.",
    closing: "Cordialement,",
    team: "L\u2019\u00E9quipe DBC Germany",
  },
};

export function ContactFormConfirmEmail(
  props: ContactFormConfirmEmailProps
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
          {t.greeting.replace("{name}", props.name)}
        </Text>
        <Text className="mt-3 text-sm leading-6 text-neutral-700">
          {t.body1}
        </Text>
        <Text className="mt-3 text-sm leading-6 text-neutral-700">
          {t.body2}
        </Text>
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
