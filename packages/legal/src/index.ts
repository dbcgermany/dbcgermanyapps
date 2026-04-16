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
