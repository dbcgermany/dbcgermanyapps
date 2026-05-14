import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
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

// The banner image is wrapped in a link pointing here, so recipients can
// click the hero and land on the marketing site. Falls back to the public
// brand domain if NEXT_PUBLIC_SITE_URL isn't set (this module is imported
// by cron routes + server actions where the env may be partial).
const HERO_LINK_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://dbc-germany.com";

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
                 4378×1313 source). Full-bleed, natural aspect. Wrapped
                 in a link so clicking the hero opens the marketing site. */}
            <Link
              href={HERO_LINK_URL}
              style={{ display: "block", textDecoration: "none" }}
            >
              <Img
                src={EMAIL_HERO_URL}
                alt="DBC Germany · Richesses d'Afrique"
                width="600"
                height="180"
                style={{
                  display: "block",
                  width: "100%",
                  height: "auto",
                  border: 0,
                  outline: "none",
                }}
              />
            </Link>

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
  "DBC Germany UG \u00B7 tickets.dbc-germany.com";
// No email in the footer \u2014 the recipient already has the From / Reply-To
// addresses to write back to. Listing a separate "contact us at hello@\u2026"
// adds noise (and historically used the wrong inbox).
export const FOOTER_QUESTIONS = {
  en: "Questions? Just reply to this email.",
  de: "Fragen? Antworten Sie einfach auf diese E-Mail.",
  fr: "Des questions ? R\u00E9pondez simplement \u00E0 cet e-mail.",
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
