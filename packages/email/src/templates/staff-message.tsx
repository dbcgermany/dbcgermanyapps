import { Section, Text } from "@react-email/components";
import { EmailLayout, FOOTER_QUESTIONS, FOOTER_SIGNATURE } from "./_layout";

interface StaffMessageEmailProps {
  subject: string;
  body: string;
  senderName: string;
  locale: "en" | "de" | "fr";
}

export function StaffMessageEmail(props: StaffMessageEmailProps) {
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
      <Section className="mt-6">
        <Text className="m-0 text-sm text-neutral-700">— {props.senderName}</Text>
      </Section>
    </EmailLayout>
  );
}
