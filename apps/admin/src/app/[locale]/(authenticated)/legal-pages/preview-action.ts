"use server";

import { getCompanyInfo } from "@dbc/legal";
import { renderLegalMarkdown } from "@dbc/legal/server";
import type { LegalLocale } from "@dbc/legal";

// Server action returning the rendered HTML for a markdown draft so the
// admin client can show a faithful preview (template-variable expansion +
// the same DOMPurify pipeline the public render path uses) without
// dragging marked + jsdom into the admin client bundle.
export async function renderPreview(input: {
  body_markdown: string;
  locale: LegalLocale;
}): Promise<string> {
  const company = await getCompanyInfo();
  return renderLegalMarkdown({
    body_markdown: input.body_markdown,
    company,
    locale: input.locale,
    marketingSiteUrl: "https://dbc-germany.com",
    ticketsSiteUrl: "https://tickets.dbc-germany.com",
  });
}
