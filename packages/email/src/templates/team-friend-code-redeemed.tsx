import { Section, Text, Hr } from "@react-email/components";
import {
  EmailLayout,
  DetailRow,
  FOOTER_SIGNATURE,
  FOOTER_QUESTIONS,
} from "./_layout";

export interface TeamFriendCodeRedeemedEmailProps {
  recipientName: string;
  eventTitle: string;
  redeemerName: string;
  redeemerEmail: string;
  codeTail: string;
  locale: "en" | "de" | "fr";
}

const T = {
  en: {
    preview: "Your invite code was used",
    greeting: "Hi {name},",
    body: "Heads-up — one of your DBC team-friend invite codes was just redeemed for {event}.",
    detailsTitle: "Redemption details",
    eventLabel: "Event",
    codeLabel: "Code",
    friendLabel: "Redeemed by",
    note: "If you didn't expect this, reply to this email and we'll take a look.",
    closing: "Thanks,",
    team: "The DBC Germany Team",
  },
  de: {
    preview: "Dein Einladungscode wurde verwendet",
    greeting: "Hallo {name},",
    body: "Kurze Info — einer deiner DBC-Team-Friend-Einladungscodes wurde gerade für {event} eingelöst.",
    detailsTitle: "Einlösung",
    eventLabel: "Veranstaltung",
    codeLabel: "Code",
    friendLabel: "Eingelöst von",
    note: "Falls das unerwartet war, antworte einfach auf diese E-Mail und wir schauen nach.",
    closing: "Viele Grüße,",
    team: "Das DBC Germany Team",
  },
  fr: {
    preview: "Votre code d'invitation a été utilisé",
    greeting: "Bonjour {name},",
    body: "Petite info — l'un de vos codes d'invitation Team-Friend DBC vient d'être utilisé pour {event}.",
    detailsTitle: "Détails de l'utilisation",
    eventLabel: "Événement",
    codeLabel: "Code",
    friendLabel: "Utilisé par",
    note: "Si cela n'était pas prévu, répondez à cet e-mail et nous vérifierons.",
    closing: "Cordialement,",
    team: "L'équipe DBC Germany",
  },
};

export function TeamFriendCodeRedeemedEmail(
  props: TeamFriendCodeRedeemedEmailProps
) {
  const t = T[props.locale];
  const bodyText = t.body.replace("{event}", props.eventTitle);
  const redeemerLabel = props.redeemerEmail
    ? `${props.redeemerName} · ${props.redeemerEmail}`
    : props.redeemerName;

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

      <Section className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-5">
        <Text className="m-0 mb-3 text-base font-semibold text-neutral-900">
          {t.detailsTitle}
        </Text>
        <Hr className="my-3 border-neutral-200" />
        <DetailRow label={t.eventLabel} value={props.eventTitle} />
        <DetailRow label={t.codeLabel} value={`…${props.codeTail}`} mono />
        <DetailRow label={t.friendLabel} value={redeemerLabel} />
      </Section>

      <Section className="mt-6">
        <Text className="text-sm leading-6 text-neutral-700">{t.note}</Text>
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
