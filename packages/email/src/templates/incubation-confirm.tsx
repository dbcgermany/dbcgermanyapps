import { Section, Text, Link } from "@react-email/components";
import {
  EmailLayout,
  FOOTER_SIGNATURE,
  FOOTER_QUESTIONS,
} from "./_layout";

export interface IncubationApplicationConfirmEmailProps {
  applicantName: string;
  locale: "en" | "de" | "fr";
}

const T = {
  en: {
    preview: "We received your DBC application",
    greeting: "Hi {name},",
    body1:
      "Thank you for applying to work with DBC DACH. Our team in D\u00fcsseldorf reads every submission.",
    nextSteps: "What happens next:",
    step1: "We review your application carefully.",
    step2: "You hear back from a named person within 10 business days.",
    step3: "If we are a fit, we invite you to a 30-minute call.",
    cta: "Visit dbc-germany.com",
    closing: "Best regards,",
    team: "The DBC DACH Team",
  },
  de: {
    preview: "Wir haben deine DBC-Bewerbung erhalten",
    greeting: "Hallo {name},",
    body1:
      "vielen Dank f\u00fcr deine Bewerbung bei DBC DACH. Unser Team in D\u00fcsseldorf liest jede Bewerbung.",
    nextSteps: "So geht es weiter:",
    step1: "Wir pr\u00fcfen deine Bewerbung sorgf\u00e4ltig.",
    step2:
      "Du h\u00f6rst innerhalb von 10 Werktagen von einer benannten Ansprechperson.",
    step3: "Wenn es passt, laden wir dich zu einem 30-min\u00fctigen Call ein.",
    cta: "dbc-germany.com besuchen",
    closing: "Viele Gr\u00fc\u00dfe,",
    team: "Das DBC DACH Team",
  },
  fr: {
    preview: "Nous avons bien re\u00e7u ta candidature DBC",
    greeting: "Bonjour {name},",
    body1:
      "Merci pour ta candidature aupr\u00e8s de DBC DACH. Notre \u00e9quipe \u00e0 D\u00fcsseldorf lit chaque candidature.",
    nextSteps: "La suite :",
    step1: "Nous \u00e9tudions attentivement ta candidature.",
    step2:
      "Tu re\u00e7ois un retour d'une personne identifi\u00e9e sous 10 jours ouvr\u00e9s.",
    step3:
      "Si c'est un match, nous t'invitons \u00e0 un appel de 30 minutes.",
    cta: "Visiter dbc-germany.com",
    closing: "Cordialement,",
    team: "L'\u00e9quipe DBC DACH",
  },
};

export function IncubationApplicationConfirmEmail(
  props: IncubationApplicationConfirmEmailProps
) {
  const t = T[props.locale];
  const steps = [t.step1, t.step2, t.step3];

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
          {t.body1}
        </Text>
      </Section>

      <Section className="mt-6">
        <Text className="m-0 text-sm font-semibold text-neutral-900">
          {t.nextSteps}
        </Text>
        {steps.map((s, i) => (
          <Text key={i} className="mt-2 text-sm leading-6 text-neutral-700">
            <span style={{ color: "#c8102e", fontWeight: 600 }}>
              {i + 1}.
            </span>{" "}
            {s}
          </Text>
        ))}
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
