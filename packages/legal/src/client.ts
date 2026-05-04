// Client-safe entry point. ONLY pure data + types. No imports from
// @dbc/supabase/server, marked, or any other module that would drag
// server-only code into a browser bundle.

export { TEMPLATE_VARIABLES } from "./template-variables";
export type { LegalLocale, LegalContext, LegalCopy } from "./types";
export type { LegalDocumentType, PublishedLegalPage } from "./db";
export type { PublicCompanyInfo } from "./company";
