// Server-side markdown rendering pipeline for legal documents.
//
// Used by the public legal pages (site + tickets) and by the admin
// preview pane. Three jobs:
//   1. Replace {{template}} variables with values pulled from
//      company_info (so admin doesn't have to retype the legal name
//      in 15 places — they'd drift, and one Rechtsanwalt note can
//      sync them all at once via the company_info form instead).
//   2. Run the body through `marked` to produce HTML.
//   3. Sanitize the HTML to defang any accidental script/iframe/onerror
//      payloads. Admin is trusted but XSS-by-typo is a real concern with
//      rich text.
//
// Sanitization uses `sanitize-html` (htmlparser2-based) — NOT DOMPurify.
// DOMPurify needs a DOM, so it pulled in jsdom via isomorphic-dompurify;
// jsdom cannot run in the Vercel serverless runtime (bundled it breaks on
// dynamic requires; externalised it hits ERR_REQUIRE_ESM on a transitive
// ESM-only dep), which silently broke every admin news save. sanitize-html
// is pure JS with no DOM dependency, so it works in build AND at runtime.

import { marked } from "marked";
import sanitizeHtml from "sanitize-html";
import type { PublicCompanyInfo } from "./company";
import {
  formatRegisteredAddress,
  formatOfficeAddress,
  formatFrenchAddress,
  formatParentAddress,
} from "./company";
import { TEMPLATE_VARIABLES } from "./template-variables";

// Re-export so render.ts is still the canonical place to read it from
// the server side, but template-variables.ts is the actual source of
// truth that admin clients import without dragging marked + dompurify.
export { TEMPLATE_VARIABLES };

marked.setOptions({
  gfm: true,
  breaks: false,
  pedantic: false,
});

const ALLOWED_TAGS = [
  "p", "br", "hr", "h1", "h2", "h3", "h4", "h5", "h6",
  "strong", "em", "b", "i", "u", "code", "pre",
  "ul", "ol", "li",
  "a", "abbr",
  "table", "thead", "tbody", "tr", "th", "td",
  "blockquote",
  "div", "span", "address",
  // Inline media for news/blog bodies (images + captions + safe embeds).
  "img", "figure", "figcaption", "iframe",
];

const ALLOWED_ATTR = [
  "href", "title", "target", "rel", "class", "lang",
  "colspan", "rowspan", "align",
  // Media attributes.
  "src", "alt", "width", "height", "loading",
  "allow", "allowfullscreen", "frameborder", "sandbox",
];

// Embeds are restricted to a known-safe allowlist (YouTube / Vimeo). Any
// other <iframe> is dropped. Legal docs have no iframes so they're unaffected.
const ALLOWED_IFRAME_HOSTS = [
  "www.youtube.com",
  "youtube.com",
  "www.youtube-nocookie.com",
  "youtube-nocookie.com",
  "player.vimeo.com",
];
const ALLOWED_IFRAME_SRC =
  /^https:\/\/(www\.)?(youtube-nocookie\.com\/embed\/|youtube\.com\/embed\/|player\.vimeo\.com\/video\/)/;

// Shared sanitize pass. `allowIframe` enables the YouTube/Vimeo embed
// allow-list (rich bodies); email + legal pass it false. The exclusiveFilter
// drops any iframe whose src isn't a known embed path (hostname allow-list
// alone wouldn't constrain the path).
function runSanitize(
  html: string,
  tags: string[],
  attrs: string[],
  allowIframe: boolean
): string {
  return sanitizeHtml(html, {
    allowedTags: tags,
    allowedAttributes: { "*": attrs },
    allowedIframeHostnames: allowIframe ? ALLOWED_IFRAME_HOSTS : [],
    allowIframeRelativeUrls: false,
    exclusiveFilter: (frame) =>
      frame.tag === "iframe" &&
      !ALLOWED_IFRAME_SRC.test(frame.attribs?.src ?? ""),
  });
}

export interface TemplateContext {
  company: PublicCompanyInfo | null;
  locale: "en" | "de" | "fr";
  privacyEmail: string;
  legalEmail: string;
  supportEmail: string;
  marketingSiteUrl: string;
  ticketsSiteUrl: string;
}

function buildTemplateContext(
  company: PublicCompanyInfo | null,
  locale: "en" | "de" | "fr",
  marketingSiteUrl: string,
  ticketsSiteUrl: string
): TemplateContext {
  return {
    company,
    locale,
    privacyEmail:
      company?.privacy_email ?? company?.primary_email ?? "",
    legalEmail: company?.legal_email ?? company?.primary_email ?? "",
    supportEmail: company?.support_email ?? company?.primary_email ?? "",
    marketingSiteUrl,
    ticketsSiteUrl,
  };
}

// Available {{placeholders}} the admin can use in the markdown body.
// Keep this list narrow — every placeholder is contract: rename one
// and every published page breaks until the admin re-saves.
function resolveTemplate(key: string, ctx: TemplateContext): string {
  const c = ctx.company;
  switch (key) {
    case "legal_name":
      return c?.legal_name ?? "";
    case "legal_form":
      return c?.legal_form ?? "";
    case "legal_name_with_form":
      return c
        ? `${c.legal_name}${c.legal_form ? ` (${c.legal_form})` : ""}`
        : "";
    case "trade_name":
      return c?.trade_name ?? "";
    case "brand_name":
      return c?.brand_name ?? "";
    case "registered_address":
      return formatRegisteredAddress(c, { oneLine: true });
    case "office_address":
      return formatOfficeAddress(c, { oneLine: true });
    case "fr_address":
      return formatFrenchAddress(c, { oneLine: true });
    case "parent_address":
      return formatParentAddress(c, { oneLine: true });
    case "primary_email":
      return c?.primary_email ?? "";
    case "privacy_email":
      return ctx.privacyEmail;
    case "legal_email":
      return ctx.legalEmail;
    case "support_email":
      return ctx.supportEmail;
    case "phone":
      return c?.phone ?? "";
    case "vat_id":
      return c?.vat_id ?? "";
    case "tax_id":
      return c?.tax_id ?? "";
    case "hrb":
      return c
        ? [c.hrb_number, c.hrb_court].filter(Boolean).join(", ")
        : "";
    case "managing_directors":
      return c?.managing_directors ?? "";
    case "responsible_person":
      return c?.responsible_person ?? "";
    case "supervisory_authority":
      return c?.supervisory_authority ?? "";
    case "marketing_site_url":
      return ctx.marketingSiteUrl;
    case "tickets_site_url":
      return ctx.ticketsSiteUrl;
    case "privacy_url":
      return `${ctx.marketingSiteUrl}/${ctx.locale}/privacy`;
    case "cookies_url":
      return `${ctx.marketingSiteUrl}/${ctx.locale}/cookies`;
    case "terms_url":
      return `${ctx.marketingSiteUrl}/${ctx.locale}/terms`;
    case "imprint_url":
      return `${ctx.marketingSiteUrl}/${ctx.locale}/imprint`;
    default:
      // Unknown placeholder — leave as-is so the admin spots the typo
      // in preview rather than ending up with a quiet empty string in
      // the published version.
      return `{{${key}}}`;
  }
}

function applyTemplates(body: string, ctx: TemplateContext): string {
  return body.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_match, key) =>
    resolveTemplate(key as string, ctx)
  );
}

export interface RenderOptions {
  body_markdown: string;
  company: PublicCompanyInfo | null;
  locale: "en" | "de" | "fr";
  marketingSiteUrl: string;
  ticketsSiteUrl: string;
}

/**
 * Sanitize a block of trusted-but-fallible rich HTML (e.g. a news/blog
 * article body authored in the admin) using the same allow-list as the
 * legal renderer. No markdown parsing and no template interpolation —
 * the input is already HTML. Keeps `<a href target rel>` so internal and
 * external hyperlinks survive, allows inline images + YouTube/Vimeo embeds,
 * strips any script / disallowed-iframe / onerror payloads.
 */
export function sanitizeRichHtml(html: string): string {
  return runSanitize(html, ALLOWED_TAGS, ALLOWED_ATTR, true);
}

// Email-safe allow-list: no iframe/script/media-embeds (email clients don't
// run them), no class/id (most clients strip them anyway). Keeps links,
// basic formatting, lists, tables and inline images.
const EMAIL_ALLOWED_TAGS = [
  "p", "br", "hr", "h1", "h2", "h3", "h4", "h5", "h6",
  "strong", "em", "b", "i", "u",
  "ul", "ol", "li", "a", "blockquote",
  "table", "thead", "tbody", "tr", "th", "td",
  "img", "span", "div",
];
const EMAIL_ALLOWED_ATTR = ["href", "title", "target", "rel", "src", "alt", "width", "height", "align"];

/** Sanitize a rich-HTML body for email (stricter than sanitizeRichHtml). */
export function sanitizeEmailHtml(html: string): string {
  return runSanitize(html, EMAIL_ALLOWED_TAGS, EMAIL_ALLOWED_ATTR, false);
}

/** Derive a plain-text alternative from HTML (for the multipart text part). */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<\/(p|div|h[1-6]|li|tr|blockquote)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function renderLegalMarkdown(
  options: RenderOptions
): Promise<string> {
  const ctx = buildTemplateContext(
    options.company,
    options.locale,
    options.marketingSiteUrl,
    options.ticketsSiteUrl
  );
  const interpolated = applyTemplates(options.body_markdown, ctx);
  const html = await marked.parse(interpolated, { async: true });
  return runSanitize(html, ALLOWED_TAGS, ALLOWED_ATTR, false);
}

