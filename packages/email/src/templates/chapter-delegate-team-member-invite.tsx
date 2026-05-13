import { Section, Text, Link } from "@react-email/components";
import {
  EmailLayout,
  FOOTER_SIGNATURE,
  FOOTER_QUESTIONS,
} from "./_layout";

export interface ChapterDelegateTeamMemberInviteEmailProps {
  recipientName: string;
  eventTitle: string;
  eventDateLabel: string;
  eventCity: string;
  registrationUrl: string;
  locale: "en" | "de" | "fr";
}

const T = {
  en: {
    preview: "You’re invited to Richesses d’Afrique — please register",
    greeting: "Hi {name},",
    intro:
      "You’re invited to {event} on {date}{cityTail}. As a DBC team member of your branch, your entry ticket is on us — and you can also bring one +1 free of charge.",
    formIntro:
      "To make this work cleanly at the door, please complete the short registration form:",
    cta: "Register now",
    bullets: [
      "Anyone not on the registration list will be turned away at the entrance. Please make sure every team member who plans to attend is registered through this form (you can forward this email).",
      "The form asks for your Branch Ambassador — the DBC ambassador responsible for your region. Add their name + email if you can; we’ll CC them on your confirmation so they know you’re coming.",
      "You can add a +1 companion in the form. Their ticket is free as well; their seat is reserved once we confirm your registration.",
      "Tickets are issued only after the DBC Germany team approves your submission. You’ll get a confirmation email with your QR ticket attached.",
    ],
    closing: "Looking forward to seeing you in {city}.",
    closingNoCity: "Looking forward to seeing you.",
    warmly: "Warmly,",
    team: "The DBC Germany Team",
  },
  de: {
    preview: "Du bist zu Richesses d’Afrique eingeladen — bitte registrieren",
    greeting: "Hallo {name},",
    intro:
      "Du bist herzlich zu {event} am {date}{cityTail} eingeladen. Als DBC-Team-Mitglied deiner Niederlassung übernimmt das Germany-Team dein Eintrittsticket — und du darfst eine Begleitperson kostenlos mitbringen.",
    formIntro:
      "Damit am Einlass alles reibungslos läuft, fülle bitte das kurze Registrierungsformular aus:",
    cta: "Jetzt registrieren",
    bullets: [
      "Wer nicht registriert ist, wird am Einlass abgewiesen. Bitte stelle sicher, dass alle Team-Mitglieder, die kommen möchten, sich über dieses Formular anmelden (du kannst diese E-Mail weiterleiten).",
      "Das Formular fragt nach deiner/deinem Niederlassungs-Botschafter:in — der/die zuständige DBC-Botschafter:in deiner Region. Trag Name und E-Mail ein, wenn möglich; wir setzen sie auf CC, damit sie weiß, dass du kommst.",
      "Du kannst eine Begleitperson angeben. Ihr Ticket ist ebenfalls kostenlos; der Platz ist erst reserviert, sobald wir deine Anmeldung freigegeben haben.",
      "Tickets werden erst nach Freigabe durch das DBC Germany Team ausgestellt. Du erhältst eine Bestätigungs-E-Mail mit deinem QR-Ticket als Anhang.",
    ],
    closing: "Wir freuen uns auf dich in {city}.",
    closingNoCity: "Wir freuen uns auf dich.",
    warmly: "Beste Grüße,",
    team: "Das DBC Germany Team",
  },
  fr: {
    preview:
      "Tu es invité·e à Richesses d’Afrique — merci de t’inscrire",
    greeting: "Bonjour {name},",
    intro:
      "Tu es invité·e à {event}, le {date}{cityTail}. En tant que membre de l’équipe DBC de ta succursale, ton billet d’entrée est offert — et tu peux venir avec un·e accompagnateur·rice, également gratuitement.",
    formIntro:
      "Pour que tout soit clair au contrôle d’entrée, merci de remplir le court formulaire d’inscription :",
    cta: "S’inscrire maintenant",
    bullets: [
      "Toute personne non inscrite se verra refuser l’accès au lieu. Assure-toi que chaque membre de l’équipe qui souhaite venir est inscrit·e via ce formulaire (tu peux transférer cet e-mail).",
      "Le formulaire demande ton/ta Ambassadeur·rice de succursale — l’ambassadeur·rice DBC responsable de ta région. Renseigne son nom et son e-mail si possible ; nous le/la mettrons en copie de ta confirmation.",
      "Tu peux indiquer un·e accompagnateur·rice. Son billet est aussi gratuit ; sa place est réservée dès que ton inscription est validée.",
      "Les billets sont émis uniquement après validation par l’équipe DBC Germany. Tu recevras un e-mail de confirmation avec ton billet QR en pièce jointe.",
    ],
    closing: "Au plaisir de te voir à {city}.",
    closingNoCity: "Au plaisir de te voir.",
    warmly: "Cordialement,",
    team: "L’équipe DBC Germany",
  },
};

export function ChapterDelegateTeamMemberInviteEmail(
  props: ChapterDelegateTeamMemberInviteEmailProps
) {
  const t = T[props.locale];
  const cityTail = props.eventCity ? `, ${props.eventCity}` : "";
  const closing = props.eventCity
    ? t.closing.replace("{city}", props.eventCity)
    : t.closingNoCity;
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
          {t.intro
            .replace("{event}", props.eventTitle)
            .replace("{date}", props.eventDateLabel)
            .replace("{cityTail}", cityTail)}
        </Text>
      </Section>

      <Section className="mt-4">
        <Text className="m-0 text-sm leading-6 text-neutral-700">
          {t.formIntro}
        </Text>
      </Section>

      <Section className="mt-4">
        <Link
          href={props.registrationUrl}
          className="inline-block rounded-md bg-[#c8102e] px-5 py-2.5 text-sm font-medium text-white no-underline"
        >
          {t.cta}
        </Link>
      </Section>

      <Section className="mt-6">
        <ul className="m-0 pl-5 text-xs leading-6 text-neutral-700">
          {t.bullets.map((b, i) => (
            <li key={i} className="mb-1">
              {b}
            </li>
          ))}
        </ul>
      </Section>

      <Section className="mt-8">
        <Text className="m-0 text-sm text-neutral-800">{closing}</Text>
        <Text className="m-0 mt-2 text-sm text-neutral-800">{t.warmly}</Text>
        <Text className="m-0 mt-2 text-sm font-semibold text-neutral-800">
          {t.team}
        </Text>
      </Section>
    </EmailLayout>
  );
}
