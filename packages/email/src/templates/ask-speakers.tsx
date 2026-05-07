import { Section, Text, Hr, Link, Img } from "@react-email/components";
import {
  EmailLayout,
  FOOTER_SIGNATURE,
  FOOTER_QUESTIONS,
} from "./_layout";

export interface AskSpeakersEmailSpeaker {
  name: string;
  roleLabel?: string;
  photoUrl?: string | null;
}

export interface AskSpeakersEmailProps {
  attendeeName: string;
  eventTitle: string;
  askUrl: string;
  speakers: AskSpeakersEmailSpeaker[];
  locale: "en" | "de" | "fr";
}

const T = {
  en: {
    preview: "Ask our {event} speakers a question",
    greeting: "Hi {name},",
    body:
      "{event} is just around the corner. To make the conversation as relevant as possible, we'd love to hear what you'd like our speakers to address on stage.",
    instructions:
      "Pick a speaker, write your question, and we'll route it to our programme team. You can submit up to three questions in total — across the same speaker or different ones.",
    cta: "Ask a question",
    speakersTitle: "Featured speakers",
    closing: "See you in Essen,",
    team: "The DBC Germany Team",
  },
  de: {
    preview: "Stellen Sie unseren Speakern bei {event} eine Frage",
    greeting: "Hallo {name},",
    body:
      "{event} steht bevor. Damit der Austausch möglichst relevant wird, möchten wir wissen, welche Themen Sie auf der Bühne sehen möchten.",
    instructions:
      "Wählen Sie eine Speaker:in, formulieren Sie Ihre Frage – unser Programmteam leitet sie weiter. Insgesamt sind bis zu drei Fragen möglich, gerne an denselben oder unterschiedliche Speaker.",
    cta: "Eine Frage stellen",
    speakersTitle: "Speaker",
    closing: "Bis bald in Essen,",
    team: "Das DBC Germany Team",
  },
  fr: {
    preview: "Posez une question à nos intervenants de {event}",
    greeting: "Bonjour {name},",
    body:
      "{event} approche. Pour rendre les échanges aussi pertinents que possible, nous aimerions savoir ce que vous attendez des intervenants sur scène.",
    instructions:
      "Choisissez un intervenant, rédigez votre question — notre équipe programmation se charge de la transmettre. Vous pouvez en envoyer jusqu’à trois au total, pour un seul ou plusieurs intervenants.",
    cta: "Poser une question",
    speakersTitle: "Intervenants",
    closing: "À bientôt à Essen,",
    team: "L’équipe DBC Germany",
  },
};

export function AskSpeakersEmail(props: AskSpeakersEmailProps) {
  const t = T[props.locale];

  return (
    <EmailLayout
      locale={props.locale}
      preview={t.preview.replace("{event}", props.eventTitle)}
      footerQuestions={FOOTER_QUESTIONS[props.locale]}
      footerSignature={FOOTER_SIGNATURE}
    >
      <Section className="mt-6">
        <Text className="m-0 text-base text-neutral-800">
          {t.greeting.replace("{name}", props.attendeeName)}
        </Text>
        <Text className="mt-3 text-sm leading-6 text-neutral-700">
          {t.body.replace("{event}", props.eventTitle)}
        </Text>
        <Text className="mt-3 text-sm leading-6 text-neutral-700">
          {t.instructions}
        </Text>
        <Link
          href={props.askUrl}
          className="mt-4 inline-block rounded-md bg-[#c8102e] px-5 py-2.5 text-sm font-medium text-white no-underline"
        >
          {t.cta}
        </Link>
      </Section>

      {props.speakers.length > 0 && (
        <Section className="mt-8">
          <Text className="m-0 text-xs uppercase tracking-wide text-neutral-500">
            {t.speakersTitle}
          </Text>
          <Hr className="my-3 border-neutral-200" />
          <table
            cellPadding={0}
            cellSpacing={0}
            role="presentation"
            style={{ width: "100%" }}
          >
            <tbody>
              {props.speakers.map((s, i) => (
                <tr key={i}>
                  <td style={{ width: 56, paddingRight: 12, paddingBottom: 12 }}>
                    {s.photoUrl ? (
                      <Img
                        src={s.photoUrl}
                        alt={s.name}
                        width="48"
                        height="48"
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          backgroundColor: "#f5f5f5",
                        }}
                      />
                    )}
                  </td>
                  <td style={{ paddingBottom: 12, verticalAlign: "middle" }}>
                    <Text className="m-0 text-sm font-medium text-neutral-900">
                      {s.name}
                    </Text>
                    {s.roleLabel && (
                      <Text className="m-0 mt-0.5 text-xs text-neutral-500">
                        {s.roleLabel}
                      </Text>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
