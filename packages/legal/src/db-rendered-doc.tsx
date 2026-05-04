// Public legal-page renderer. Tries DB first; on miss / empty / error,
// the caller falls back to the JSX component shipped in code.
//
// Why split this file from `render.ts`: server components import this,
// and we want the marked + dompurify cost confined to that import path
// rather than the admin write-side actions.

import { getPublishedLegalPage, type LegalDocumentType } from "./db";
import { renderLegalMarkdown } from "./render";
import type { LegalContext } from "./types";

interface Props extends LegalContext {
  documentType: LegalDocumentType;
}

export async function MaybeDbLegalDoc({
  documentType,
  company,
  locale,
  marketingSiteUrl,
  ticketsSiteUrl,
}: Props): Promise<React.ReactElement | null> {
  const published = await getPublishedLegalPage(documentType, locale);
  if (!published) return null;

  const html = await renderLegalMarkdown({
    body_markdown: published.body_markdown,
    company,
    locale,
    marketingSiteUrl,
    ticketsSiteUrl,
  });

  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      {published.title && <h1>{published.title}</h1>}
      <div dangerouslySetInnerHTML={{ __html: html }} />
      {published.published_at && (
        <p className="text-xs text-muted-foreground">
          Last updated: {new Date(published.published_at).toLocaleDateString(locale)}
        </p>
      )}
    </article>
  );
}
