// Read-side accessor for the legal_pages table. Public render path uses
// this; admin actions (write) live in the admin app and use the service
// role client directly.

import { unstable_cache } from "next/cache";
import { createServerClient } from "@dbc/supabase/server";
import type { LegalLocale } from "./types";

export type LegalDocumentType =
  | "impressum"
  | "privacy"
  | "terms"
  | "cookies"
  | "us_privacy_notice";

export interface PublishedLegalPage {
  document_type: LegalDocumentType;
  locale: LegalLocale;
  title: string;
  body_markdown: string;
  published_at: string;
}

/**
 * Returns the published markdown body for (document_type, locale), or null
 * if the admin has never published anything for that pair (in which case
 * the caller falls back to the JSX component shipped in code).
 *
 * Cached with the `legal-content` tag so admin "Publish" actions can
 * propagate via revalidateTag without restarting the app.
 */
const fetchPublishedLegalPage = unstable_cache(
  async (
    documentType: LegalDocumentType,
    locale: LegalLocale
  ): Promise<PublishedLegalPage | null> => {
    try {
      const supabase = await createServerClient();
      const { data } = await supabase
        .from("legal_pages")
        .select(
          "document_type, locale, published_title, published_body_markdown, published_at"
        )
        .eq("document_type", documentType)
        .eq("locale", locale)
        .maybeSingle();

      if (!data) return null;
      const body = (data as { published_body_markdown: string | null })
        .published_body_markdown;
      if (!body || body.trim() === "") return null;

      return {
        document_type: documentType,
        locale,
        title:
          (data as { published_title: string | null }).published_title ??
          "",
        body_markdown: body,
        published_at:
          (data as { published_at: string | null }).published_at ?? "",
      };
    } catch {
      return null;
    }
  },
  ["legal-content"],
  { tags: ["legal-content"], revalidate: 300 }
);

export async function getPublishedLegalPage(
  documentType: LegalDocumentType,
  locale: LegalLocale
): Promise<PublishedLegalPage | null> {
  return fetchPublishedLegalPage(documentType, locale);
}
