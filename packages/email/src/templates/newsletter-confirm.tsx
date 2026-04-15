import { Link, Section, Text } from "@react-email/components";
import { EmailLayout, FOOTER_QUESTIONS, FOOTER_SIGNATURE } from "./_layout";

interface NewsletterConfirmEmailProps {
  confirmUrl: string;
  locale: "en" | "de" | "fr";
}

const T = {
  en: {
    subject: "Confirm your DBC Germany newsletter subscription",
    headline: "One last step",
    body: "Tap the button below to confirm you'd like to hear from DBC Germany. If you didn't request this, just ignore this email — you won't be subscribed.",
    cta: "Confirm subscription",
  },
  de: {
    subject: "Best\u00e4tigen Sie Ihre Newsletter-Anmeldung",
    headline: "Ein letzter Schritt",
    body: "Tippen Sie auf die Schaltfl\u00e4che, um Ihre Anmeldung zum DBC-Germany-Newsletter zu best\u00e4tigen. Falls Sie das nicht angefordert haben, ignorieren Sie diese E-Mail einfach.",
    cta: "Anmeldung best\u00e4tigen",
  },
  fr: {
    subject: "Confirmez votre inscription \u00e0 la newsletter",
    headline: "Un dernier pas",
    body: "Cliquez ci-dessous pour confirmer votre inscription \u00e0 la newsletter DBC Germany. Si vous n'\u00eates pas \u00e0 l'origine de cette demande, ignorez cet e-mail.",
    cta: "Confirmer l'inscription",
  },
};

export function NewsletterConfirmEmail(props: NewsletterConfirmEmailProps) {
  const t = T[props.locale];
  return (
    <EmailLayout
      locale={props.locale}
      preview={t.subject}
      footerQuestions={FOOTER_QUESTIONS[props.locale]}
      footerSignature={FOOTER_SIGNATURE}
    >
      <Section className="mt-6">
        <Text className="m-0 text-lg font-semibold text-neutral-900">
          {t.headline}
        </Text>
        <Text className="mt-3 text-sm leading-6 text-neutral-700">{t.body}</Text>
        <Link
          href={props.confirmUrl}
          className="mt-4 inline-block rounded-md bg-[#c8102e] px-5 py-2.5 text-sm font-medium text-white no-underline"
        >
          {t.cta}
        </Link>
      </Section>
    </EmailLayout>
  );
}

export const NEWSLETTER_CONFIRM_SUBJECT = {
  en: T.en.subject,
  de: T.de.subject,
  fr: T.fr.subject,
};
