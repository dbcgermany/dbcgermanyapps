import { Link, Section, Text } from "@react-email/components";
import {
  EmailLayout,
  FOOTER_QUESTIONS,
  FOOTER_SIGNATURE,
} from "./_layout";

interface AftercareSequenceEmailProps {
  subject: string;
  body: string; // Pre-rendered plain-text / markdown-lite body
  eventTitle: string;
  galleryUrl?: string | null;
  locale: "en" | "de" | "fr";
}

const T = {
  en: {
    gallery: "View event gallery",
    thanks: "Thank you for being part of {event}.",
  },
  de: {
    gallery: "Galerie ansehen",
    thanks: "Vielen Dank, dass Sie Teil von {event} waren.",
  },
  fr: {
    gallery: "Voir la galerie",
    thanks: "Merci d\u2019avoir particip\u00E9 \u00E0 {event}.",
  },
};

export function AftercareSequenceEmail(props: AftercareSequenceEmailProps) {
  const t = T[props.locale];
  const thanks = t.thanks.replace("{event}", props.eventTitle);

  const paragraphs = props.body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <EmailLayout
      locale={props.locale}
      preview={props.subject}
      footerQuestions={FOOTER_QUESTIONS[props.locale]}
      footerSignature={FOOTER_SIGNATURE}
    >
      <Section className="mt-6">
        <Text className="m-0 text-base font-semibold text-neutral-900">
          {props.subject}
        </Text>
        <Text className="mt-2 text-sm text-neutral-500">{thanks}</Text>
      </Section>

      <Section className="mt-4">
        {paragraphs.map((p, i) => (
          <Text
            key={i}
            className="m-0 mb-4 text-sm leading-6 text-neutral-700"
          >
            {p}
          </Text>
        ))}
      </Section>

      {props.galleryUrl && (
        <Section className="mt-2">
          <Link
            href={props.galleryUrl}
            className="inline-block rounded-md bg-[#c8102e] px-5 py-2.5 text-sm font-medium text-white no-underline"
          >
            {t.gallery}
          </Link>
        </Section>
      )}
    </EmailLayout>
  );
}
