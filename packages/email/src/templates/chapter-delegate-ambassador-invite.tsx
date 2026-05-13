import { Section, Text, Link } from "@react-email/components";
import {
  EmailLayout,
  FOOTER_SIGNATURE,
  FOOTER_QUESTIONS,
} from "./_layout";

export interface ChapterDelegateAmbassadorInviteEmailProps {
  recipientName: string;
  eventTitle: string;
  eventDateLabel: string;
  eventCity: string;
  registrationUrl: string;
  locale: "en" | "de" | "fr";
}

const T = {
  en: {
    preview: "Please forward to your DBC branch team — registration link inside",
    greeting: "Hi {name},",
    intro:
      "Quick note ahead of {event} ({date}{cityTail}). Could you share the registration link below with your DBC branch team? Each team member registers themselves through that link — and they can add a +1 companion inside the same form. Their entry tickets are on us, but only registered people get past the door.",
    cta: "Open registration link",
    forwardHint:
      "When they register they can name you as their Branch Ambassador, and we’ll automatically CC you on each confirmation — so you stay in the loop on who’s coming.",
    accessRule:
      "⚠ Anyone not registered will be turned away at the venue. Please forward this link to every team member who plans to attend.",
    closing: "Many thanks,",
    team: "The DBC Germany Team",
  },
  de: {
    preview:
      "Bitte weiterleiten an dein DBC-Niederlassungs-Team — Anmeldelink im Inneren",
    greeting: "Hallo {name},",
    intro:
      "Kurz vor {event} ({date}{cityTail}): kannst du den unten stehenden Anmeldelink an dein DBC-Niederlassungs-Team weiterleiten? Jede:r Team-Mitglied meldet sich selbst über den Link an — eine Begleitperson kann direkt im selben Formular ergänzt werden. Die Eintrittstickets übernehmen wir, am Einlass kommen aber nur registrierte Personen rein.",
    cta: "Zum Anmeldeformular",
    forwardHint:
      "Bei der Anmeldung können sie dich als Niederlassungs-Botschafter:in eintragen. Wir setzen dich dann automatisch auf jede Bestätigungs-E-Mail in CC — so weißt du, wer kommt.",
    accessRule:
      "⚠ Wer nicht registriert ist, wird am Einlass abgewiesen. Bitte leite den Link an alle Team-Mitglieder weiter, die teilnehmen möchten.",
    closing: "Vielen Dank,",
    team: "Das DBC Germany Team",
  },
  fr: {
    preview:
      "Merci de transférer à ton équipe de succursale DBC — lien d’inscription à l’intérieur",
    greeting: "Bonjour {name},",
    intro:
      "Petit message avant {event} ({date}{cityTail}) : pourrais-tu transférer le lien d’inscription ci-dessous à ton équipe de succursale DBC ? Chaque membre s’inscrit personnellement via ce lien — il/elle pourra ajouter un·e accompagnateur·rice directement dans le même formulaire. Les billets d’entrée sont offerts, mais seules les personnes inscrites passent l’entrée.",
    cta: "Ouvrir le formulaire d’inscription",
    forwardHint:
      "Au moment de s’inscrire, ils/elles peuvent te désigner comme leur Ambassadeur·rice de succursale. Nous te mettrons automatiquement en copie de chaque confirmation, pour que tu saches qui vient.",
    accessRule:
      "⚠ Toute personne non inscrite se verra refuser l’accès au lieu. Merci de transférer le lien à chaque membre de l’équipe qui prévoit de venir.",
    closing: "Merci beaucoup,",
    team: "L’équipe DBC Germany",
  },
};

export function ChapterDelegateAmbassadorInviteEmail(
  props: ChapterDelegateAmbassadorInviteEmailProps
) {
  const t = T[props.locale];
  const cityTail = props.eventCity ? `, ${props.eventCity}` : "";
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

      <Section className="mt-6">
        <Link
          href={props.registrationUrl}
          className="inline-block rounded-md bg-[#c8102e] px-5 py-2.5 text-sm font-medium text-white no-underline"
        >
          {t.cta}
        </Link>
      </Section>

      <Section className="mt-5 rounded-md bg-amber-50 p-4">
        <Text className="m-0 text-xs leading-5 text-amber-900">
          {t.accessRule}
        </Text>
      </Section>

      <Section className="mt-5">
        <Text className="m-0 text-xs leading-5 text-neutral-500">
          {t.forwardHint}
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
