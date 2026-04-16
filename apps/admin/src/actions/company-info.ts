"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { revalidatePath } from "next/cache";

export interface CompanyInfo {
  id: number;
  // Legal — identity
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
  // Parent org (e.g., Diambilay Business Center SARL, Lubumbashi DRC)
  parent_company_name: string | null;
  parent_company_address: string | null;
  parent_company_city: string | null;
  parent_company_country: string | null;
  // French entity (structured)
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
  google_site_verification: string | null;
  bing_site_verification: string | null;
  // Banking
  bank_name: string | null;
  account_holder: string | null;
  iban: string | null;
  bic: string | null;
  updated_at: string;
}

const COLUMNS = `
  id, legal_name, legal_form, trade_name, registered_address, registered_postal_code,
  registered_city, registered_country, hrb_number, hrb_court, vat_id, tax_id,
  managing_directors, responsible_person, chamber_of_commerce,
  professional_liability_insurance, supervisory_authority,
  parent_company_name, parent_company_address, parent_company_city, parent_company_country,
  fr_legal_name, fr_legal_form, fr_siren, fr_registered_address,
  fr_line1, fr_line2, fr_postal_code, fr_city, fr_country, fr_director,
  primary_email, support_email, press_email, privacy_email, legal_email,
  careers_email, contact_form_url, phone, office_address,
  office_line1, office_line2, office_postal_code, office_city, office_country,
  office_hours, dpo_required, dpo_name, dpo_email,
  eu_representative_name, eu_representative_address,
  uk_representative_name, uk_representative_address,
  popia_info_officer_name, popia_info_officer_email,
  ndpr_dpco_name, ndpr_dpco_email, eu_odr_link, vsbg_statement,
  brand_name, brand_tagline_en, brand_tagline_de,
  brand_tagline_fr, logo_light_url, logo_dark_url, logo_wordmark_url,
  favicon_url, og_default_image_url, primary_color, linkedin_url,
  instagram_url, facebook_url, whatsapp_url, youtube_url, twitter_url,
  seo_title_en, seo_title_de, seo_title_fr, seo_description_en,
  seo_description_de, seo_description_fr, google_site_verification,
  bing_site_verification, bank_name, account_holder, iban, bic, updated_at
`;

export async function getCompanyInfo(): Promise<CompanyInfo> {
  await requireRole("manager");
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("company_info")
    .select(COLUMNS)
    .eq("id", 1)
    .single();
  if (error) throw new Error(error.message);
  return data as CompanyInfo;
}

type Section =
  | "legal"
  | "parent"
  | "france"
  | "contact"
  | "privacy"
  | "brand"
  | "social"
  | "seo"
  | "banking";

const SECTION_FIELDS: Record<Section, Array<keyof CompanyInfo>> = {
  legal: [
    "legal_name",
    "legal_form",
    "trade_name",
    "registered_address",
    "registered_postal_code",
    "registered_city",
    "registered_country",
    "hrb_number",
    "hrb_court",
    "vat_id",
    "tax_id",
    "managing_directors",
    "responsible_person",
    "chamber_of_commerce",
    "professional_liability_insurance",
    "supervisory_authority",
  ],
  parent: [
    "parent_company_name",
    "parent_company_address",
    "parent_company_city",
    "parent_company_country",
  ],
  france: [
    "fr_legal_name",
    "fr_legal_form",
    "fr_siren",
    "fr_director",
    "fr_registered_address",
    "fr_line1",
    "fr_line2",
    "fr_postal_code",
    "fr_city",
    "fr_country",
  ],
  contact: [
    "primary_email",
    "support_email",
    "press_email",
    "privacy_email",
    "legal_email",
    "careers_email",
    "contact_form_url",
    "phone",
    "office_address",
    "office_line1",
    "office_line2",
    "office_postal_code",
    "office_city",
    "office_country",
    "office_hours",
  ],
  privacy: [
    "dpo_required",
    "dpo_name",
    "dpo_email",
    "eu_representative_name",
    "eu_representative_address",
    "uk_representative_name",
    "uk_representative_address",
    "popia_info_officer_name",
    "popia_info_officer_email",
    "ndpr_dpco_name",
    "ndpr_dpco_email",
    "eu_odr_link",
    "vsbg_statement",
  ],
  brand: [
    "brand_name",
    "brand_tagline_en",
    "brand_tagline_de",
    "brand_tagline_fr",
    "logo_light_url",
    "logo_dark_url",
    "logo_wordmark_url",
    "favicon_url",
    "og_default_image_url",
    "primary_color",
  ],
  social: [
    "linkedin_url",
    "instagram_url",
    "facebook_url",
    "whatsapp_url",
    "youtube_url",
    "twitter_url",
  ],
  seo: [
    "seo_title_en",
    "seo_title_de",
    "seo_title_fr",
    "seo_description_en",
    "seo_description_de",
    "seo_description_fr",
    "google_site_verification",
    "bing_site_verification",
  ],
  banking: ["bank_name", "account_holder", "iban", "bic"],
};

export async function updateCompanyInfoSection(
  section: Section,
  formData: FormData
) {
  const user = await requireRole("admin");
  const supabase = await createServerClient();

  const fields = SECTION_FIELDS[section];
  if (!fields) return { error: "Unknown section." };

  const patch: Record<string, string | boolean | null> = {};
  for (const field of fields) {
    if (field === "dpo_required") {
      patch[field] = formData.get(field) === "on";
      continue;
    }
    const raw = formData.get(field);
    const value = typeof raw === "string" ? raw.trim() : "";
    patch[field] = value === "" ? null : value;
  }

  // primary_email must never be empty; fall back to current if blanked.
  if (section === "contact") {
    if (!patch.primary_email) delete patch.primary_email;
    if (!patch.support_email) delete patch.support_email;
    if (!patch.press_email) delete patch.press_email;
  }
  if (section === "legal" && !patch.legal_name) delete patch.legal_name;
  if (section === "brand" && !patch.brand_name) delete patch.brand_name;

  const { error } = await supabase
    .from("company_info")
    .update({ ...patch, updated_by: user.userId })
    .eq("id", 1);
  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "update_company_info",
    entity_type: "company_info",
    entity_id: "1",
    details: { section, fields: Object.keys(patch) },
  });

  revalidatePath("/", "layout");
  return { success: true };
}

export async function uploadBrandAsset(
  field:
    | "logo_light_url"
    | "logo_dark_url"
    | "logo_wordmark_url"
    | "favicon_url"
    | "og_default_image_url",
  file: File
) {
  const user = await requireRole("admin");
  const supabase = await createServerClient();

  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `${field}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("brand-assets")
    .upload(path, file, { upsert: false, contentType: file.type });
  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("brand-assets").getPublicUrl(path);

  const { error } = await supabase
    .from("company_info")
    .update({ [field]: publicUrl, updated_by: user.userId })
    .eq("id", 1);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { success: true, url: publicUrl };
}
