import { Section, Text, Link } from "@react-email/components";
import {
  EmailLayout,
  FOOTER_SIGNATURE,
  FOOTER_QUESTIONS,
} from "./_layout";

export interface JobApplicationConfirmEmailProps {
  applicantName: string;
  jobTitle: string;
  locale: "en" | "de" | "fr";
}

const T = {
  en: {
    preview: "We received your application",
    greeting: "Hi {name},",
    body1: 'Thank you for applying to "{job}" at DBC Germany.',
    body2:
      "We have received your application and our team will review it carefully. We will be in touch with you shortly.",
    body3:
      "In the meantime, feel free to explore our upcoming events and initiatives.",
    cta: "Visit dbc-germany.com",
    closing: "Best regards,",
    team: "The DBC Germany Team",
  },
  de: {
    preview: "Wir haben Ihre Bewerbung erhalten",
    greeting: "Hallo {name},",
    body1:
      'vielen Dank f\u00FCr Ihre Bewerbung auf die Stelle "{job}" bei DBC Germany.',
    body2:
      "Wir haben Ihre Unterlagen erhalten und werden sie sorgf\u00E4ltig pr\u00FCfen. Wir melden uns in K\u00FCrze bei Ihnen.",
    body3:
      "In der Zwischenzeit k\u00F6nnen Sie gerne unsere kommenden Veranstaltungen und Initiativen entdecken.",
    cta: "dbc-germany.com besuchen",
    closing: "Mit freundlichen Gr\u00FC\u00DFen,",
    team: "Das DBC Germany Team",
  },
  fr: {
    preview: "Nous avons re\u00E7u votre candidature",
    greeting: "Bonjour {name},",
    body1:
      'Merci pour votre candidature au poste de "{job}" chez DBC Germany.',
    body2:
      "Nous avons bien re\u00E7u votre dossier et notre \u00E9quipe l\u2019examinera attentivement. Nous reviendrons vers vous rapidement.",
    body3:
      "En attendant, n\u2019h\u00E9sitez pas \u00E0 d\u00E9couvrir nos prochains \u00E9v\u00E9nements et initiatives.",
    cta: "Visiter dbc-germany.com",
    closing: "Cordialement,",
    team: "L\u2019\u00E9quipe DBC Germany",
  },
};

export function JobApplicationConfirmEmail(
  props: JobApplicationConfirmEmailProps
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
          {t.greeting.replace("{name}", props.applicantName)}
        </Text>
        <Text className="mt-3 text-sm leading-6 text-neutral-700">
          {t.body1.replace("{job}", props.jobTitle)}
        </Text>
        <Text className="mt-3 text-sm leading-6 text-neutral-700">
          {t.body2}
        </Text>
        <Text className="mt-3 text-sm leading-6 text-neutral-700">
          {t.body3}
        </Text>
      </Section>

      <Section className="mt-6">
        <Link
          href="https://dbc-germany.com"
          className="inline-block rounded-md bg-[#c8102e] px-5 py-2.5 text-sm font-medium text-white no-underline"
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
