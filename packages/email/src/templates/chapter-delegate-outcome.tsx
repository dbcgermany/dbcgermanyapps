import { Section, Text, Hr } from "@react-email/components";
import {
  EmailLayout,
  FOOTER_SIGNATURE,
  FOOTER_QUESTIONS,
} from "./_layout";

export type ChapterDelegateOutcome = "rejected" | "revoked";

export interface ChapterDelegateOutcomeEmailProps {
  recipientName: string;
  eventTitle: string;
  outcome: ChapterDelegateOutcome;
  note?: string | null;
  locale: "en" | "de" | "fr";
}

const T = {
  en: {
    rejected: {
      preview: "Update on your registration",
      subject: "Your DBC registration for {event}",
      greeting: "Hi {name},",
      body: "Unfortunately we couldn't confirm your branch-delegate registration for {event} at this time.",
      noteLabel: "Note from the team",
      ctaText:
        "If this wasn't expected, please reach out to your Branch Ambassador or simply reply to this email.",
      closing: "Thanks,",
      team: "The DBC Germany Team",
    },
    revoked: {
      preview: "Status update on your DBC ticket",
      subject: "Status: your DBC registration for {event}",
      greeting: "Hi {name},",
      body: "Your team ticket for {event} has been revoked.",
      noteLabel: "Note from the team",
      ctaText:
        "If this wasn't expected, please get in touch — simply reply to this email and we'll sort it.",
      closing: "Thanks,",
      team: "The DBC Germany Team",
    },
  },
  de: {
    rejected: {
      preview: "Update zu Ihrer Anmeldung",
      subject: "Ihre DBC-Anmeldung für {event}",
      greeting: "Hallo {name},",
      body: "Leider konnten wir Ihre Anmeldung als Niederlassungs-Delegierte:r für {event} aktuell nicht bestätigen.",
      noteLabel: "Hinweis vom Team",
      ctaText:
        "Falls das nicht erwartet war, sprechen Sie bitte mit Ihrer:Ihrem Niederlassungs-Botschafter:in oder antworten Sie direkt auf diese E-Mail.",
      closing: "Viele Grüße,",
      team: "Das DBC Germany Team",
    },
    revoked: {
      preview: "Statusänderung zu Ihrem DBC-Ticket",
      subject: "Status: Ihre DBC-Anmeldung für {event}",
      greeting: "Hallo {name},",
      body: "Ihr Team-Ticket für {event} wurde widerrufen.",
      noteLabel: "Hinweis vom Team",
      ctaText:
        "Falls das ein Versehen war, melden Sie sich bitte direkt bei uns — antworten Sie einfach auf diese E-Mail und wir kümmern uns darum.",
      closing: "Viele Grüße,",
      team: "Das DBC Germany Team",
    },
  },
  fr: {
    rejected: {
      preview: "Mise à jour concernant votre inscription",
      subject: "Votre inscription DBC pour {event}",
      greeting: "Bonjour {name},",
      body: "Nous n'avons pas pu confirmer votre inscription en tant que délégué·e de succursale pour {event} pour le moment.",
      noteLabel: "Note de l'équipe",
      ctaText:
        "Si cela n'était pas prévu, contactez votre ambassadeur·rice de succursale ou répondez simplement à cet e-mail.",
      closing: "Cordialement,",
      team: "L'équipe DBC Germany",
    },
    revoked: {
      preview: "Mise à jour de votre billet DBC",
      subject: "Statut : votre inscription DBC pour {event}",
      greeting: "Bonjour {name},",
      body: "Votre billet d'équipe pour {event} a été révoqué.",
      noteLabel: "Note de l'équipe",
      ctaText:
        "Si cela n'était pas prévu, contactez-nous — répondez simplement à cet e-mail et nous nous en occuperons.",
      closing: "Cordialement,",
      team: "L'équipe DBC Germany",
    },
  },
};

export function ChapterDelegateOutcomeEmail(
  props: ChapterDelegateOutcomeEmailProps
) {
  const t = T[props.locale][props.outcome];
  const bodyText = t.body.replace("{event}", props.eventTitle);
  const note = props.note?.trim() || null;

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
          {bodyText}
        </Text>
      </Section>

      {note && (
        <Section className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-5">
          <Text className="m-0 mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {t.noteLabel}
          </Text>
          <Text className="m-0 text-sm leading-6 text-neutral-700">{note}</Text>
        </Section>
      )}

      <Section className="mt-6">
        <Text className="text-sm leading-6 text-neutral-700">{t.ctaText}</Text>
      </Section>

      <Hr className="my-6 border-neutral-200" />

      <Section>
        <Text className="m-0 text-sm text-neutral-800">{t.closing}</Text>
        <Text className="m-0 mt-2 text-sm font-semibold text-neutral-800">
          {t.team}
        </Text>
      </Section>
    </EmailLayout>
  );
}

export function chapterDelegateOutcomeSubject(
  outcome: ChapterDelegateOutcome,
  locale: "en" | "de" | "fr",
  eventTitle: string
): string {
  return T[locale][outcome].subject.replace("{event}", eventTitle);
}
