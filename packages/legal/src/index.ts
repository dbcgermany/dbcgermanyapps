// Light-weight barrel for @dbc/legal. Anything that imports `marked` or
// `isomorphic-dompurify` (which lazy-loads `jsdom`) lives in
// `@dbc/legal/server` instead — those deps were taking down the
// marketing site's locale pages because `@/lib/company-info` imports
// from this barrel and dragged jsdom into every layout chunk.
export { LegalPageShell } from "./legal-page-shell";
export { Impressum } from "./impressum";
export { CookiePolicy } from "./cookies";
export { PrivacyPolicy } from "./privacy";
export { TermsOfService } from "./terms";
export { UsPrivacyNotice } from "./us-privacy-notice";
export {
  getCompanyInfo,
  getTagline,
  formatOfficeAddress,
  formatRegisteredAddress,
  formatFrenchAddress,
  formatParentAddress,
  getLegalReadiness,
  LEGAL_REQUIRED_FIELDS,
} from "./company";
export type { PublicCompanyInfo } from "./company";
export type { LegalContext, LegalLocale, LegalCopy } from "./types";
export { t } from "./types";
export { LEGAL_VERSION, LEGAL_LAST_UPDATED } from "./version";
// Types only — runtime values live behind `@dbc/legal/server`.
export type { LegalDocumentType, PublishedLegalPage } from "./db";
export type { RenderOptions, TemplateContext } from "./render";
