import { createServerClient } from "@dbc/supabase/server";
import { cache } from "react";

export interface PublicCompanyInfo {
  // Legal
  legal_name: string;
  legal_form: string | null;
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
  fr_legal_name: string | null;
  fr_siren: string | null;
  fr_registered_address: string | null;
  // Contact
  primary_email: string;
  support_email: string;
  press_email: string;
  phone: string | null;
  office_address: string | null;
  office_hours: string | null;
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

/**
 * Reads the single company_info row. Cached per request via React.cache —
 * every server component on a page hits the DB exactly once.
 */
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
