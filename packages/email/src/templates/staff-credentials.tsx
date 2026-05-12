import { Section, Text, Link } from "@react-email/components";
import { EmailLayout, FOOTER_SIGNATURE, FOOTER_QUESTIONS } from "./_layout";

export interface StaffCredentialsEmailProps {
  recipientName: string;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
  locale: "en" | "de" | "fr";
  reason: "created" | "reset";
}

const T = {
  en: {
    previewCreated: "Your DBC Germany admin access is ready",
    previewReset: "Your DBC Germany password has been reset",
    greeting: "Hi {name},",
    bodyCreated:
      "An admin has set up your DBC Germany account. Use the credentials below to sign in. You'll be asked to set a new password right after your first sign-in.",
    bodyReset:
      "An admin has reset your DBC Germany password. Use the temporary password below to sign in. You'll be asked to set a new password right away.",
    loginLabel: "Login",
    emailLabel: "Email",
    pwdLabel: "Temporary password",
    cta: "Sign in",
    closing: "Welcome,",
    team: "The DBC Germany Team",
  },
  de: {
    previewCreated: "Dein DBC Germany Admin-Zugang ist bereit",
    previewReset: "Dein DBC Germany Passwort wurde zurückgesetzt",
    greeting: "Hallo {name},",
    bodyCreated:
      "Ein Admin hat dein DBC Germany Konto eingerichtet. Nutze die folgenden Zugangsdaten zum Einloggen. Beim ersten Login wirst du sofort gebeten, ein neues Passwort zu setzen.",
    bodyReset:
      "Ein Admin hat dein Passwort zurückgesetzt. Nutze das temporäre Passwort unten zum Einloggen. Du wirst sofort gebeten, ein neues Passwort zu setzen.",
    loginLabel: "Login",
    emailLabel: "E-Mail",
    pwdLabel: "Temporäres Passwort",
    cta: "Einloggen",
    closing: "Willkommen,",
    team: "Das DBC Germany Team",
  },
  fr: {
    previewCreated: "Votre accès admin DBC Germany est prêt",
    previewReset:
      "Votre mot de passe DBC Germany a été réinitialisé",
    greeting: "Bonjour {name},",
    bodyCreated:
      "Un administrateur a configuré votre compte DBC Germany. Utilisez les identifiants ci-dessous pour vous connecter. Vous serez invité(e) à définir un nouveau mot de passe dès votre première connexion.",
    bodyReset:
      "Un administrateur a réinitialisé votre mot de passe. Utilisez le mot de passe temporaire ci-dessous pour vous connecter. Vous serez invité(e) à en définir un nouveau immédiatement.",
    loginLabel: "Connexion",
    emailLabel: "E-mail",
    pwdLabel: "Mot de passe temporaire",
    cta: "Se connecter",
    closing: "Bienvenue,",
    team: "L’équipe DBC Germany",
  },
};

export function StaffCredentialsEmail(props: StaffCredentialsEmailProps) {
  const t = T[props.locale];
  const preview = props.reason === "created" ? t.previewCreated : t.previewReset;
  const body = props.reason === "created" ? t.bodyCreated : t.bodyReset;
  return (
    <EmailLayout
      locale={props.locale}
      preview={preview}
      footerQuestions={FOOTER_QUESTIONS[props.locale]}
      footerSignature={FOOTER_SIGNATURE}
    >
      <Section className="mt-6">
        <Text className="m-0 text-base text-neutral-800">
          {t.greeting.replace("{name}", props.recipientName)}
        </Text>
        <Text className="mt-3 text-sm leading-6 text-neutral-700">{body}</Text>
      </Section>

      <Section className="mt-4 rounded-md bg-neutral-50 p-4">
        <Text className="m-0 text-xs uppercase tracking-wide text-neutral-500">
          {t.loginLabel}
        </Text>
        <Text className="m-0 mt-1 text-sm">
          <Link href={props.loginUrl} className="text-[#c8102e] underline">
            {props.loginUrl}
          </Link>
        </Text>
        <Text className="m-0 mt-3 text-xs uppercase tracking-wide text-neutral-500">
          {t.emailLabel}
        </Text>
        <Text className="m-0 mt-1 font-mono text-sm text-neutral-800">
          {props.email}
        </Text>
        <Text className="m-0 mt-3 text-xs uppercase tracking-wide text-neutral-500">
          {t.pwdLabel}
        </Text>
        <Text className="m-0 mt-1 font-mono text-sm text-neutral-800">
          {props.temporaryPassword}
        </Text>
      </Section>

      <Section className="mt-6">
        <Link
          href={props.loginUrl}
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
