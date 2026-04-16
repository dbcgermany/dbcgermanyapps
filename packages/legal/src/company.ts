import { createServerClient } from "@dbc/supabase/server";
import { cache } from "react";

/**
 * Read-only snapshot of every legal/identity fact about the company.
 * Every field below is editable in the admin Company Info form, and every
 * legal page renders these values dynamically — no company fact is ever
 * hardcoded in a legal body.
 */
export interface PublicCompanyInfo {
  // Identity
  legal_name: string;
  legal_form: string | null;
  trade_name: string | null;
  registered_address: string | null;
  registered_postal_code: string | null;
  registered_city: string | null;
  registered_country: string | null;
  hrb_number: string | null;
  hrb_court: string | null;
  vat_id: string | null;
  tax_id: string | null;
  managing_directors: string | null;
  responsible_person: string | null;
  chamber_of_commerce: string | null;
  professional_liability_insurance: string | null;
  supervisory_authority: string | null;

  // Parent organization (Diambilay Business Center, Lubumbashi)
  parent_company_name: string | null;
  parent_company_address: string | null;
  parent_company_city: string | null;
  parent_company_country: string | null;

  // French entity
  fr_legal_name: string | null;
  fr_legal_form: string | null;
  fr_siren: string | null;
  fr_registered_address: string | null;
  fr_line1: string | null;
  fr_line2: string | null;
  fr_postal_code: string | null;
  fr_city: string | null;
  fr_country: string | null;
  fr_director: string | null;

  // Contact
  primary_email: string;
  support_email: string;
  press_email: string;
  privacy_email: string | null;
  legal_email: string | null;
  careers_email: string | null;
  contact_form_url: string | null;
  phone: string | null;
  office_address: string | null;
  office_line1: string | null;
  office_line2: string | null;
  office_postal_code: string | null;
  office_city: string | null;
  office_country: string | null;
  office_hours: string | null;

  // Data protection
  dpo_required: boolean | null;
  dpo_name: string | null;
  dpo_email: string | null;
  eu_representative_name: string | null;
  eu_representative_address: string | null;
  uk_representative_name: string | null;
  uk_representative_address: string | null;
  popia_info_officer_name: string | null;
  popia_info_officer_email: string | null;
  ndpr_dpco_name: string | null;
  ndpr_dpco_email: string | null;
  eu_odr_link: string | null;
  vsbg_statement: "not_willing" | "willing_specified" | "willing_general" | null;

  // Brand
  brand_name: string;
  brand_tagline_en: string | null;
  brand_tagline_de: string | null;
  brand_tagline_fr: string | null;
  logo_light_url: string | null;
  logo_dark_url: string | null;
  logo_wordmark_url: string | null;
  favicon_url: string | null;
  og_default_image_url: string | null;
  primary_color: string | null;

  // Social
  linkedin_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  whatsapp_url: string | null;
  youtube_url: string | null;
  twitter_url: string | null;

  // SEO
  seo_title_en: string | null;
  seo_title_de: string | null;
  seo_title_fr: string | null;
  seo_description_en: string | null;
  seo_description_de: string | null;
  seo_description_fr: string | null;

  // Banking
  bank_name: string | null;
  account_holder: string | null;
  iban: string | null;
  bic: string | null;
}

export const getCompanyInfo = cache(
  async (): Promise<PublicCompanyInfo | null> => {
    try {
      const supabase = await createServerClient();
      const { data } = await supabase
        .from("company_info")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      return (data as PublicCompanyInfo) ?? null;
    } catch {
      return null;
    }
  }
);

export function getTagline(
  info: PublicCompanyInfo | null,
  locale: string
): string | null {
  if (!info) return null;
  const key = `brand_tagline_${locale}` as keyof PublicCompanyInfo;
  return (info[key] as string | null) ?? info.brand_tagline_en;
}

const NON_BREAKING_SPACE = "\u00a0";

function joinParts(parts: Array<string | null | undefined>, sep = ", "): string {
  return parts.filter((p): p is string => !!p && p.trim() !== "").join(sep);
}

export function formatOfficeAddress(
  info: PublicCompanyInfo | null,
  { oneLine = false }: { oneLine?: boolean } = {}
): string {
  if (!info) return "";
  const line1 = info.office_line1?.trim() ?? "";
  const line2 = info.office_line2?.trim() ?? "";
  const cityLine = joinParts(
    [info.office_postal_code, info.office_city],
    NON_BREAKING_SPACE
  );
  const parts = [line1, line2, cityLine, info.office_country].filter(
    (p): p is string => !!p && p.trim() !== ""
  );
  if (parts.length === 0 && info.office_address) return info.office_address;
  return oneLine ? parts.join(", ") : parts.join("\n");
}

export function formatRegisteredAddress(
  info: PublicCompanyInfo | null,
  { oneLine = false }: { oneLine?: boolean } = {}
): string {
  if (!info) return "";
  const cityLine = joinParts(
    [info.registered_postal_code, info.registered_city],
    NON_BREAKING_SPACE
  );
  const parts = [info.registered_address, cityLine, info.registered_country].filter(
    (p): p is string => !!p && p.trim() !== ""
  );
  return oneLine ? parts.join(", ") : parts.join("\n");
}

export function formatFrenchAddress(
  info: PublicCompanyInfo | null,
  { oneLine = false }: { oneLine?: boolean } = {}
): string {
  if (!info) return "";
  const line1 = info.fr_line1?.trim() ?? "";
  const line2 = info.fr_line2?.trim() ?? "";
  const cityLine = joinParts(
    [info.fr_postal_code, info.fr_city],
    NON_BREAKING_SPACE
  );
  const parts = [line1, line2, cityLine, info.fr_country].filter(
    (p): p is string => !!p && p.trim() !== ""
  );
  if (parts.length === 0 && info.fr_registered_address)
    return info.fr_registered_address;
  return oneLine ? parts.join(", ") : parts.join("\n");
}

export function formatParentAddress(
  info: PublicCompanyInfo | null,
  { oneLine = false }: { oneLine?: boolean } = {}
): string {
  if (!info) return "";
  const parts = [
    info.parent_company_address,
    info.parent_company_city,
    info.parent_company_country,
  ].filter((p): p is string => !!p && p.trim() !== "");
  return oneLine ? parts.join(", ") : parts.join("\n");
}

/**
 * Which fields must be populated for the legal pages to render a compliant
 * Impressum / Privacy / ToS. Used by the admin "Legal readiness" widget and
 * by the no-hardcoded-fact audit.
 */
export const LEGAL_REQUIRED_FIELDS: Array<{
  key: keyof PublicCompanyInfo;
  label: string;
  why: string;
}> = [
  { key: "legal_name", label: "Legal name", why: "Impressum § 5 DDG" },
  { key: "legal_form", label: "Legal form", why: "Impressum § 5 DDG" },
  { key: "registered_address", label: "Registered street", why: "Impressum § 5 DDG" },
  { key: "registered_postal_code", label: "Registered postal code", why: "Impressum § 5 DDG" },
  { key: "registered_city", label: "Registered city", why: "Impressum § 5 DDG" },
  { key: "registered_country", label: "Registered country", why: "Impressum § 5 DDG" },
  { key: "managing_directors", label: "Managing director(s)", why: "Impressum § 5 DDG" },
  { key: "responsible_person", label: "Responsible person (MStV)", why: "§ 18 Abs. 2 MStV" },
  { key: "hrb_number", label: "HRB number", why: "Impressum § 5 DDG (once registered)" },
  { key: "hrb_court", label: "Register court", why: "Impressum § 5 DDG (once registered)" },
  { key: "vat_id", label: "VAT ID", why: "Impressum § 5 DDG (if applicable)" },
  { key: "primary_email", label: "Primary email", why: "Impressum § 5 DDG" },
  { key: "phone", label: "Phone", why: "Impressum § 5 DDG" },
  { key: "privacy_email", label: "Privacy email", why: "GDPR Art. 13 contact" },
  { key: "legal_email", label: "Legal email", why: "ToS dispute notice" },
];

export function getLegalReadiness(info: PublicCompanyInfo | null): {
  total: number;
  filled: number;
  missing: Array<{ key: keyof PublicCompanyInfo; label: string; why: string }>;
} {
  const total = LEGAL_REQUIRED_FIELDS.length;
  if (!info) return { total, filled: 0, missing: LEGAL_REQUIRED_FIELDS.slice() };
  const missing = LEGAL_REQUIRED_FIELDS.filter((f) => {
    const v = info[f.key];
    return v === null || v === undefined || v === "";
  });
  return { total, filled: total - missing.length, missing };
}
