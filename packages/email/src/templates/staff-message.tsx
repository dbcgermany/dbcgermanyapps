import { Link, Section, Text } from "@react-email/components";
import { EmailLayout, FOOTER_QUESTIONS, FOOTER_SIGNATURE } from "./_layout";

interface StaffMessageEmailProps {
  subject: string;
  body: string;
  senderName: string;
  locale: "en" | "de" | "fr";
}

export function StaffMessageEmail(props: StaffMessageEmailProps) {
  // Split body on blank lines so each chunk becomes a <Text> paragraph.
  // We drop the `m-0` shorthand that the prior template used — when
  // React-Email compiles `m-0 mb-4` to inline styles, the four individual
  // margin-* declarations from m-0 land AFTER mb-4 and override it,
  // leaving paragraphs with no spacing. Explicit mt-0 + mb-4 keeps the
  // gap intact in every email client.
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
        <Text className="mt-0 mb-0 text-base font-semibold text-neutral-900">
          {props.subject}
        </Text>
      </Section>
      <Section className="mt-4">
        {paragraphs.map((p, i) => (
          <Text
            key={i}
            className="mt-0 mb-4 text-sm leading-6 text-neutral-700"
          >
            {renderParagraphWithLinks(p)}
          </Text>
        ))}
      </Section>
      <Section className="mt-6">
        <Text className="mt-0 mb-0 text-sm text-neutral-700">
          — {props.senderName}
        </Text>
      </Section>
    </EmailLayout>
  );
}

/**
 * Auto-linkify URLs inside a paragraph. The body field accepts plain text
 * with naked URLs (the simplest authoring path for the admin templates
 * editor — no markdown to learn). At render-time every http(s) URL becomes
 * a clickable link with primary-coloured styling and an underline so it
 * reads as an action, not body copy.
 */
function renderParagraphWithLinks(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const urlPattern = /(https?:\/\/[^\s<>"')]+)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyCounter = 0;
  while ((match = urlPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <Link
        key={`l${keyCounter++}`}
        href={match[1]}
        className="font-medium text-[color:rgb(200,16,46)] underline"
      >
        {match[1]}
      </Link>
    );
    lastIndex = match.index + match[1].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts.length > 0 ? parts : text;
}
