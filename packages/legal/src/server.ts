// Server-only entry point for @dbc/legal. Split out from the main
// index.ts because importing this module pulls in `marked` and
// `isomorphic-dompurify` (which lazy-loads `jsdom`) — heavy deps that
// caused lambda boot failures when accidentally bundled into the
// site's [locale]/layout chunk via @/lib/company-info.
//
// Import this from the public legal pages (privacy / terms / imprint /
// cookies / us-privacy-notice) and from the admin Legal Pages preview
// action — i.e. only where the markdown renderer is actually exercised.
//
// Everything else (`getCompanyInfo`, address formatters, the JSX
// components, types) lives in `@dbc/legal` and is safe for layouts.
export { getPublishedLegalPage } from "./db";
export type { LegalDocumentType, PublishedLegalPage } from "./db";
export {
  renderLegalMarkdown,
  TEMPLATE_VARIABLES,
} from "./render";
export type { RenderOptions, TemplateContext } from "./render";
export { MaybeDbLegalDoc } from "./db-rendered-doc";
