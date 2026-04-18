import { Section, Text, Link } from "@react-email/components";
import {
  EmailLayout,
  FOOTER_SIGNATURE,
  FOOTER_QUESTIONS,
} from "./_layout";

export interface StaffInviteEmailProps {
  recipientName: string;
  role: string;
  actionLink: string;
  locale: "en" | "de" | "fr";
}

const ROLE_LABEL = {
  en: {
    team_member: "team member",
    manager: "manager",
    admin: "administrator",
    super_admin: "super administrator",
  },
  de: {
    team_member: "Teammitglied",
    manager: "Manager",
    admin: "Administrator",
    super_admin: "Super-Administrator",
  },
  fr: {
    team_member: "membre de l’équipe",
    manager: "gestionnaire",
    admin: "administrateur",
    super_admin: "super administrateur",
  },
};

const T = {
  en: {
    preview: "You’ve been invited to DBC Germany",
    greeting: "Hi {name},",
    body: "You’ve been invited to join the DBC Germany team as a {role}. Click the button below to set your password and sign in for the first time. This link expires in 7 days.",
    cta: "Set my password",
    note: "If you weren’t expecting this invite, you can ignore this email and the account will remain inactive.",
    linkFallback: "Button not working? Paste this link into your browser:",
    closing: "Welcome aboard,",
    team: "The DBC Germany Team",
  },
  de: {
    preview: "Sie wurden zu DBC Germany eingeladen",
    greeting: "Hallo {name},",
    body: "Sie wurden eingeladen, dem DBC-Germany-Team als {role} beizutreten. Klicken Sie auf die Schaltfläche unten, um Ihr Passwort festzulegen und sich erstmals anzumelden. Dieser Link ist 7 Tage gültig.",
    cta: "Passwort festlegen",
    note: "Falls Sie diese Einladung nicht erwartet haben, können Sie diese E-Mail ignorieren. Das Konto bleibt dann inaktiv.",
    linkFallback: "Schaltfläche funktioniert nicht? Kopieren Sie diesen Link in Ihren Browser:",
    closing: "Willkommen im Team,",
    team: "Das DBC Germany Team",
  },
  fr: {
    preview: "Vous avez été invité(e) à DBC Germany",
    greeting: "Bonjour {name},",
    body: "Vous avez été invité(e) à rejoindre l’équipe DBC Germany en tant que {role}. Cliquez sur le bouton ci-dessous pour définir votre mot de passe et vous connecter pour la première fois. Ce lien expire dans 7 jours.",
    cta: "Définir mon mot de passe",
    note: "Si vous n’attendiez pas cette invitation, vous pouvez ignorer cet e-mail. Le compte restera inactif.",
    linkFallback: "Le bouton ne fonctionne pas ? Collez ce lien dans votre navigateur :",
    closing: "Bienvenue dans l’équipe,",
    team: "L’équipe DBC Germany",
  },
};

export function StaffInviteEmail(props: StaffInviteEmailProps) {
  const t = T[props.locale];
  const roleLabel =
    ROLE_LABEL[props.locale][
      props.role as keyof (typeof ROLE_LABEL)["en"]
    ] ?? props.role;

  return (
    <EmailLayout
      locale={props.locale}
      preview={t.preview}
      footerQuestions={FOOTER_QUESTIONS[props.locale]}
      footerSignature={FOOTER_SIGNATURE}
    >
      <Section className="mt-6">
        <Text className="m-0 text-base text-neutral-800">
          {t.greeting.replace("{name}", props.recipientName)}
        </Text>
        <Text className="mt-3 text-sm leading-6 text-neutral-700">
          {t.body.replace("{role}", roleLabel)}
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
        <Text className="mt-4 text-xs text-neutral-500">
          {t.linkFallback}
        </Text>
        <Text className="mt-1 break-all text-xs text-neutral-400">
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
