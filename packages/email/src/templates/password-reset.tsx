import { Section, Text, Link } from "@react-email/components";
import {
  EmailLayout,
  FOOTER_SIGNATURE,
  FOOTER_QUESTIONS,
} from "./_layout";

export interface PasswordResetEmailProps {
  recipientName?: string;
  actionLink: string;
  locale: "en" | "de" | "fr";
}

const T = {
  en: {
    preview: "Reset your password",
    greeting: "Hi{name},",
    body: "We received a request to reset the password for your DBC Germany account. Click the button below to choose a new password. This link expires in 60 minutes.",
    cta: "Reset password",
    note: "If you did not request a password reset, you can safely ignore this email. Your password will not change.",
    closing: "Best regards,",
    team: "The DBC Germany Team",
  },
  de: {
    preview: "Passwort zur\u00FCcksetzen",
    greeting: "Hallo{name},",
    body: "Wir haben eine Anfrage zum Zur\u00FCcksetzen des Passworts f\u00FCr Ihr DBC Germany Konto erhalten. Klicken Sie auf die Schaltfl\u00E4che unten, um ein neues Passwort festzulegen. Der Link ist 60 Minuten g\u00FCltig.",
    cta: "Passwort zur\u00FCcksetzen",
    note: "Falls Sie keine Zur\u00FCcksetzung angefordert haben, k\u00F6nnen Sie diese E-Mail ignorieren. Ihr Passwort bleibt unver\u00E4ndert.",
    closing: "Mit freundlichen Gr\u00FC\u00DFen,",
    team: "Das DBC Germany Team",
  },
  fr: {
    preview: "R\u00E9initialisation de votre mot de passe",
    greeting: "Bonjour{name},",
    body: "Nous avons re\u00E7u une demande de r\u00E9initialisation du mot de passe de votre compte DBC Germany. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe. Ce lien expire dans 60 minutes.",
    cta: "R\u00E9initialiser le mot de passe",
    note: "Si vous n\u2019avez pas demand\u00E9 cette r\u00E9initialisation, vous pouvez ignorer cet e-mail. Votre mot de passe reste inchang\u00E9.",
    closing: "Cordialement,",
    team: "L\u2019\u00E9quipe DBC Germany",
  },
};

export function PasswordResetEmail(props: PasswordResetEmailProps) {
  const t = T[props.locale];
  const nameSuffix = props.recipientName ? ` ${props.recipientName}` : "";

  return (
    <EmailLayout
      locale={props.locale}
      preview={t.preview}
      footerQuestions={FOOTER_QUESTIONS[props.locale]}
      footerSignature={FOOTER_SIGNATURE}
    >
      <Section className="mt-6">
        <Text className="m-0 text-base text-neutral-800">
          {t.greeting.replace("{name}", nameSuffix)}
        </Text>
        <Text className="mt-3 text-sm leading-6 text-neutral-700">
          {t.body}
        </Text>
      </Section>

      <Section className="mt-6">
        <Link
          href={props.actionLink}
          className="inline-block rounded-md bg-[#c8102e] px-5 py-2.5 text-sm font-medium text-white no-underline"
        >
          {t.cta}
        </Link>
      </Section>

      <Section className="mt-6">
        <Text className="text-xs leading-5 text-neutral-500">{t.note}</Text>
        <Text className="mt-3 break-all text-xs text-neutral-400">
          {props.actionLink}
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
