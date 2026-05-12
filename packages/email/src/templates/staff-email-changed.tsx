import { Section, Text, Link } from "@react-email/components";
import { EmailLayout, FOOTER_SIGNATURE, FOOTER_QUESTIONS } from "./_layout";

export interface StaffEmailChangedEmailProps {
  recipientName: string;
  oldEmail: string;
  newEmail: string;
  loginUrl: string;
  locale: "en" | "de" | "fr";
  // "new" → this email arrived at the NEW address: "this is now your login"
  // "old" → this email arrived at the OLD address: "your login was changed"
  side: "new" | "old";
}

const T = {
  en: {
    previewNew: "This is now your DBC Germany login",
    previewOld: "Your DBC Germany login email was changed",
    greeting: "Hi {name},",
    bodyNew:
      "An admin updated your DBC Germany login email. From now on, sign in with the address below. Your password did not change.",
    bodyOld:
      "An admin changed the login email on your DBC Germany account. If this wasn't expected, contact us right away. Otherwise no action is needed — this address ({old}) will no longer receive admin sign-in notifications.",
    fromLabel: "Previous email",
    toLabel: "New email",
    cta: "Sign in",
    closing: "Thanks,",
    team: "The DBC Germany Team",
  },
  de: {
    previewNew: "Das ist jetzt dein DBC Germany Login",
    previewOld: "Deine DBC Germany Login-E-Mail wurde geändert",
    greeting: "Hallo {name},",
    bodyNew:
      "Ein Admin hat deine DBC Germany Login-E-Mail aktualisiert. Ab sofort meldest du dich mit der unten stehenden Adresse an. Dein Passwort hat sich nicht geändert.",
    bodyOld:
      "Ein Admin hat die Login-E-Mail deines DBC Germany Kontos geändert. Falls das nicht von dir kam, melde dich bitte sofort. Andernfalls ist nichts weiter zu tun — diese Adresse ({old}) erhält keine Admin-Login-Benachrichtigungen mehr.",
    fromLabel: "Bisherige E-Mail",
    toLabel: "Neue E-Mail",
    cta: "Einloggen",
    closing: "Danke,",
    team: "Das DBC Germany Team",
  },
  fr: {
    previewNew: "Voici votre nouvel identifiant DBC Germany",
    previewOld:
      "L’adresse de connexion de votre compte DBC Germany a été modifiée",
    greeting: "Bonjour {name},",
    bodyNew:
      "Un administrateur a mis à jour l’adresse e-mail de connexion. Connectez-vous désormais avec l’adresse ci-dessous. Votre mot de passe est inchangé.",
    bodyOld:
      "Un administrateur a modifié l’adresse e-mail de connexion de votre compte. Si ce n’est pas vous, contactez-nous immédiatement. Sinon, aucune action requise — cette adresse ({old}) ne recevra plus de notifications de connexion administrateur.",
    fromLabel: "Ancienne adresse",
    toLabel: "Nouvelle adresse",
    cta: "Se connecter",
    closing: "Merci,",
    team: "L’équipe DBC Germany",
  },
};

export function StaffEmailChangedEmail(props: StaffEmailChangedEmailProps) {
  const t = T[props.locale];
  const preview = props.side === "new" ? t.previewNew : t.previewOld;
  const body =
    props.side === "new"
      ? t.bodyNew
      : t.bodyOld.replace("{old}", props.oldEmail);

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
          {t.fromLabel}
        </Text>
        <Text className="m-0 mt-1 font-mono text-sm text-neutral-800">
          {props.oldEmail}
        </Text>
        <Text className="m-0 mt-3 text-xs uppercase tracking-wide text-neutral-500">
          {t.toLabel}
        </Text>
        <Text className="m-0 mt-1 font-mono text-sm text-neutral-800">
          {props.newEmail}
        </Text>
      </Section>

      {props.side === "new" && (
        <Section className="mt-6">
          <Link
            href={props.loginUrl}
            className="inline-block rounded-md bg-[#c8102e] px-5 py-2.5 text-sm font-medium text-white no-underline"
          >
            {t.cta}
          </Link>
        </Section>
      )}

      <Section className="mt-8">
        <Text className="m-0 text-sm text-neutral-800">{t.closing}</Text>
        <Text className="m-0 mt-2 text-sm font-semibold text-neutral-800">
          {t.team}
        </Text>
      </Section>
    </EmailLayout>
  );
}
