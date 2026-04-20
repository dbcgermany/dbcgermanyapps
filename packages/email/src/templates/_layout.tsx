import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

// Brand banner supplied by DBC Germany — pre-cropped stage + audience
// framing (4378×1313 source, served as 1200×360 retina JPEG). JPEG
// over WebP because Outlook desktop renders WebP inconsistently.
// Hosted on Supabase public storage so URLs stay stable across Gmail
// / Apple Mail / Outlook.com image proxies.
export const EMAIL_HERO_URL =
  "https://rcqgsexfuaoiiuqcqeka.supabase.co/storage/v1/object/public/brand-assets/dbc-mail-banner.jpg";

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
          <Container className="mx-auto my-8 max-w-xl overflow-hidden rounded-lg bg-white shadow-sm">
            {/* Brand hero — 600×180 (10:3 aspect, matches the supplied
                 4378×1313 source). Full-bleed so the image reaches
                 container edges. Natural aspect, no object-fit trickery. */}
            <Img
              src={EMAIL_HERO_URL}
              alt="DBC Germany · Richesses d'Afrique"
              width="600"
              height="180"
              style={{
                display: "block",
                width: "100%",
                height: "auto",
              }}
            />

            <Section className="border-b-2 border-[#c8102e] px-8 pb-4 pt-6">
              <Text className="m-0 text-xl font-bold tracking-wider text-[#c8102e]">
                DBC GERMANY
              </Text>
              <Text className="m-0 mt-1 text-xs text-neutral-500">
                Africa&rsquo;s Top Business Group
              </Text>
            </Section>

            <div className="px-8 pb-8">
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
            </div>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export const FOOTER_SIGNATURE =
  "Sent by DBC Germany (UG i.G.) \u00B7 tickets.dbc-germany.com";
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
