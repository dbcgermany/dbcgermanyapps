import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

// Shared brand chrome for every transactional email. Templates compose this
// and only supply their own content Sections.
export function EmailLayout({
  locale,
  preview,
  children,
  footerQuestions,
  footerSignature,
}: {
  locale: "en" | "de" | "fr";
  preview: string;
  children: ReactNode;
  footerQuestions: string;
  footerSignature: string;
}) {
  return (
    <Html lang={locale}>
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body className="bg-neutral-50 font-sans">
          <Container className="mx-auto my-8 max-w-xl rounded-lg bg-white p-8 shadow-sm">
            <Section className="border-b-2 border-[#c8102e] pb-4">
              <Text className="m-0 text-xl font-bold tracking-wider text-[#c8102e]">
                DBC GERMANY
              </Text>
              <Text className="m-0 mt-1 text-xs text-neutral-500">
                Africa&rsquo;s Top Business Group
              </Text>
            </Section>

            {children}

            <Hr className="my-8 border-neutral-200" />

            <Section>
              <Text className="m-0 text-xs text-neutral-500">
                {footerQuestions}
              </Text>
              <Text className="mt-3 text-xs text-neutral-400">
                {footerSignature}
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export const FOOTER_SIGNATURE =
  "Sent by DBC Germany (UG i.G.) \u00B7 ticket.dbc-germany.com";
export const FOOTER_QUESTIONS = {
  en: "Questions? Reply to this email or contact hello@dbc-germany.com.",
  de: "Fragen? Antworten Sie auf diese E-Mail oder schreiben Sie an hello@dbc-germany.com.",
  fr: "Des questions ? R\u00E9pondez \u00E0 cet e-mail ou \u00E9crivez \u00E0 hello@dbc-germany.com.",
};

export function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div style={{ marginBottom: 6 }}>
      <Text className="m-0 text-xs uppercase tracking-wide text-neutral-500">
        {label}
      </Text>
      <Text
        className={`m-0 text-sm text-neutral-900 ${mono ? "font-mono" : ""}`}
      >
        {value}
      </Text>
    </div>
  );
}
