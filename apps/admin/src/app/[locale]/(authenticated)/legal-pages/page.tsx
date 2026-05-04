import { createServerClient } from "@dbc/supabase/server";
import {
  getCompanyInfo,
  type LegalDocumentType,
  type LegalLocale,
} from "@dbc/legal";
import { PageHeader } from "@/components/page-header";
import { LegalPagesClient } from "./legal-pages-client";

const T = {
  en: {
    title: "Legal Pages",
    description:
      "Edit Impressum, Privacy, Terms, Cookies and the US Privacy Notice across English, German and French. Drafts are saved without going public; click Publish to push the change live (auto-revalidates within seconds across the marketing site and ticket app).",
  },
  de: {
    title: "Rechtstexte",
    description:
      "Bearbeiten Sie Impressum, Datenschutzerklärung, AGB, Cookie-Richtlinie und den US-Hinweis in Deutsch, Englisch und Französisch. Entwürfe sind nicht öffentlich; mit „Veröffentlichen“ geht die neue Fassung live (innerhalb weniger Sekunden auf Marketing-Site und Ticket-App).",
  },
  fr: {
    title: "Textes juridiques",
    description:
      "Modifiez Impressum, Confidentialité, CGU, Cookies et l'avis US en allemand, anglais et français. Les brouillons restent privés ; cliquez sur Publier pour mettre la nouvelle version en ligne (revalidation automatique en quelques secondes sur le site marketing et l'app de billetterie).",
  },
} as const;

const DOCUMENT_TYPES: ReadonlyArray<{
  type: LegalDocumentType;
  label: { en: string; de: string; fr: string };
}> = [
  {
    type: "impressum",
    label: { en: "Imprint", de: "Impressum", fr: "Mentions légales" },
  },
  {
    type: "privacy",
    label: {
      en: "Privacy Policy",
      de: "Datenschutzerklärung",
      fr: "Confidentialité",
    },
  },
  {
    type: "terms",
    label: { en: "Terms of Service", de: "AGB", fr: "CGU" },
  },
  {
    type: "cookies",
    label: {
      en: "Cookie Policy",
      de: "Cookie-Richtlinie",
      fr: "Cookies",
    },
  },
  {
    type: "us_privacy_notice",
    label: {
      en: "US Privacy Notice",
      de: "US-Datenschutzhinweis",
      fr: "Avis US",
    },
  },
];

export default async function LegalPagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: routeLocale } = await params;
  const uiLocale = (
    routeLocale === "de" || routeLocale === "fr" ? routeLocale : "en"
  ) as LegalLocale;
  const t = T[uiLocale];
  const supabase = await createServerClient();

  const [{ data: rows }, company] = await Promise.all([
    supabase
      .from("legal_pages")
      .select(
        "document_type, locale, title, body_markdown, published_title, published_body_markdown, published_at, draft_updated_at"
      )
      .order("document_type", { ascending: true }),
    getCompanyInfo(),
  ]);

  type LegalRow = {
    document_type: string;
    locale: string;
    title: string;
    body_markdown: string;
    published_title: string | null;
    published_body_markdown: string | null;
    published_at: string | null;
    draft_updated_at: string;
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t.title} description={t.description} />

      <LegalPagesClient
        rows={(rows ?? []) as LegalRow[]}
        documentTypes={DOCUMENT_TYPES}
        uiLocale={uiLocale}
        company={company}
      />
    </div>
  );
}
