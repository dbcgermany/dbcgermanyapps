import { Section, Text } from "@react-email/components";
import { EmailLayout, FOOTER_SIGNATURE, FOOTER_QUESTIONS } from "./_layout";

export interface StaffPausedEmailProps {
  recipientName: string;
  locale: "en" | "de" | "fr";
  // "paused" = access disabled; "unpaused" = access restored
  state: "paused" | "unpaused";
}

const T = {
  en: {
    previewPaused: "Your DBC Germany access has been paused",
    previewUnpaused: "Your DBC Germany access has been restored",
    greeting: "Hi {name},",
    bodyPaused:
      "An admin has paused your DBC Germany account. You won't be able to sign in until access is restored. If you believe this is a mistake, get in touch.",
    bodyUnpaused:
      "Your DBC Germany account is active again. You can sign in as usual.",
    closing: "Thanks,",
    team: "The DBC Germany Team",
  },
  de: {
    previewPaused: "Dein DBC Germany Zugang wurde pausiert",
    previewUnpaused: "Dein DBC Germany Zugang wurde wiederhergestellt",
    greeting: "Hallo {name},",
    bodyPaused:
      "Ein Admin hat dein DBC Germany Konto pausiert. Du kannst dich nicht einloggen, bis der Zugang wiederhergestellt wird. Falls das ein Versehen ist, melde dich.",
    bodyUnpaused:
      "Dein DBC Germany Konto ist wieder aktiv. Du kannst dich wie gewohnt anmelden.",
    closing: "Danke,",
    team: "Das DBC Germany Team",
  },
  fr: {
    previewPaused: "Votre accès DBC Germany a été suspendu",
    previewUnpaused: "Votre accès DBC Germany a été rétabli",
    greeting: "Bonjour {name},",
    bodyPaused:
      "Un administrateur a suspendu votre compte DBC Germany. Vous ne pourrez pas vous connecter tant que l’accès n’est pas rétabli. S’il s’agit d’une erreur, contactez-nous.",
    bodyUnpaused:
      "Votre compte DBC Germany est de nouveau actif. Vous pouvez vous connecter comme d’habitude.",
    closing: "Merci,",
    team: "L’équipe DBC Germany",
  },
};

export function StaffPausedEmail(props: StaffPausedEmailProps) {
  const t = T[props.locale];
  const preview = props.state === "paused" ? t.previewPaused : t.previewUnpaused;
  const body = props.state === "paused" ? t.bodyPaused : t.bodyUnpaused;
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

      <Section className="mt-8">
        <Text className="m-0 text-sm text-neutral-800">{t.closing}</Text>
        <Text className="m-0 mt-2 text-sm font-semibold text-neutral-800">
          {t.team}
        </Text>
      </Section>
    </EmailLayout>
  );
}
