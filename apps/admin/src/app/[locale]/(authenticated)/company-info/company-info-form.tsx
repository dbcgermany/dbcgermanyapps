"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { AssetUpload } from "@dbc/ui";
import {
  updateCompanyInfoSection,
  uploadBrandAsset,
  type CompanyInfo,
} from "@/actions/company-info";

type BrandAssetField =
  | "logo_light_url"
  | "logo_dark_url"
  | "logo_wordmark_url"
  | "favicon_url"
  | "og_default_image_url";

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

const TABS: Array<{ id: Section; label: string }> = [
  { id: "legal", label: "Legal · Impressum" },
  { id: "parent", label: "Parent org" },
  { id: "france", label: "France entity" },
  { id: "contact", label: "Contact" },
  { id: "privacy", label: "Data protection" },
  { id: "brand", label: "Brand assets" },
  { id: "social", label: "Social links" },
  { id: "seo", label: "SEO defaults" },
  { id: "banking", label: "Banking" },
];

interface FieldDef {
  name: keyof CompanyInfo;
  label: string;
  type?:
    | "text"
    | "email"
    | "url"
    | "textarea"
    | "color"
    | "asset"
    | "checkbox"
    | "select";
  placeholder?: string;
  help?: string;
  options?: Array<{ value: string; label: string }>;
}

const FIELDS: Record<Section, FieldDef[]> = {
  legal: [
    { name: "legal_name", label: "Registered legal name" },
    {
      name: "legal_form",
      label: "Legal form",
      placeholder: "UG (haftungsbeschränkt) i.G. / GmbH / SAS …",
    },
    {
      name: "trade_name",
      label: "Trade name (if different)",
      help: "Optional public-facing name if it differs from the legal name.",
    },
    { name: "registered_address", label: "Street & number" },
    { name: "registered_postal_code", label: "Postal code" },
    { name: "registered_city", label: "City" },
    {
      name: "registered_country",
      label: "Country (ISO-2)",
      placeholder: "DE",
      help: "Two-letter ISO-3166 code.",
    },
    { name: "hrb_number", label: "HRB number" },
    {
      name: "hrb_court",
      label: "Register court (Amtsgericht)",
      placeholder: "Amtsgericht Düsseldorf",
    },
    { name: "vat_id", label: "VAT ID (USt-IdNr.)" },
    { name: "tax_id", label: "Tax ID (Steuernummer)" },
    {
      name: "managing_directors",
      label: "Managing director(s)",
      placeholder: "Comma-separated names",
    },
    {
      name: "responsible_person",
      label: "Responsible per §18 Abs. 2 MStV",
      help: "Named person legally accountable for published content.",
    },
    {
      name: "chamber_of_commerce",
      label: "Chamber of commerce",
      placeholder: "IHK Düsseldorf",
    },
    {
      name: "professional_liability_insurance",
      label: "Professional liability insurance (if applicable)",
      help: "Leave blank for non-regulated activities.",
    },
    {
      name: "supervisory_authority",
      label: "Supervisory authority (if applicable)",
      help: "Leave blank for non-regulated activities.",
    },
  ],
  parent: [
    {
      name: "parent_company_name",
      label: "Parent company name",
      placeholder: "Diambilay Business Center SARL",
    },
    { name: "parent_company_address", label: "Parent company address" },
    { name: "parent_company_city", label: "Parent company city" },
    {
      name: "parent_company_country",
      label: "Parent company country (ISO-2)",
      placeholder: "CD",
    },
  ],
  france: [
    { name: "fr_legal_name", label: "FR legal name" },
    { name: "fr_legal_form", label: "FR legal form", placeholder: "SAS" },
    { name: "fr_siren", label: "FR SIREN" },
    { name: "fr_director", label: "FR Directeur(s) Général(aux)" },
    { name: "fr_line1", label: "FR Street & number" },
    { name: "fr_line2", label: "FR Line 2 (optional)" },
    { name: "fr_postal_code", label: "FR Postal code" },
    { name: "fr_city", label: "FR City" },
    { name: "fr_country", label: "FR Country (ISO-2)", placeholder: "FR" },
    {
      name: "fr_registered_address",
      label: "FR address (legacy single-line, optional)",
      help: "Kept for backward compatibility; prefer the structured fields above.",
    },
  ],
  contact: [
    {
      name: "primary_email",
      label: "Primary email (info@)",
      type: "email",
      help: "Appears in Impressum and general contact.",
    },
    {
      name: "support_email",
      label: "Support email",
      type: "email",
      placeholder: "hello@ or support@",
    },
    { name: "press_email", label: "Press email", type: "email" },
    {
      name: "privacy_email",
      label: "Privacy email",
      type: "email",
      placeholder: "privacy@dbc-germany.com",
      help: "Shown on Privacy Policy — add as a Google Workspace alias.",
    },
    {
      name: "legal_email",
      label: "Legal email",
      type: "email",
      placeholder: "legal@dbc-germany.com",
      help: "Used for ToS dispute notice + arbitration notifications.",
    },
    {
      name: "careers_email",
      label: "Careers email",
      type: "email",
      placeholder: "careers@dbc-germany.com",
    },
    {
      name: "contact_form_url",
      label: "Contact form URL",
      type: "url",
      placeholder: "https://dbc-germany.com/en/contact",
    },
    {
      name: "phone",
      label: "Phone (E.164)",
      placeholder: "+4921199999999",
    },
    {
      name: "office_address",
      label: "Office address (legacy single-line)",
      help: "Kept for backward compatibility; prefer the structured fields below.",
    },
    { name: "office_line1", label: "Office street & number" },
    { name: "office_line2", label: "Office line 2 (optional)" },
    { name: "office_postal_code", label: "Office postal code" },
    { name: "office_city", label: "Office city" },
    {
      name: "office_country",
      label: "Office country (ISO-2)",
      placeholder: "DE",
    },
    {
      name: "office_hours",
      label: "Office hours",
      placeholder: "Mon–Fri · 09:00–18:00 CET",
    },
  ],
  privacy: [
    {
      name: "dpo_required",
      label: "Data Protection Officer is legally required",
      type: "checkbox",
      help: "Tick only if Art. 37 GDPR threshold is met. When unticked, the Privacy Policy renders 'not required'.",
    },
    { name: "dpo_name", label: "DPO name (if designated)" },
    { name: "dpo_email", label: "DPO email", type: "email" },
    {
      name: "eu_representative_name",
      label: "EU representative (Art. 27, only if no EU establishment)",
    },
    {
      name: "eu_representative_address",
      label: "EU representative address",
      type: "textarea",
    },
    { name: "uk_representative_name", label: "UK representative (if any)" },
    {
      name: "uk_representative_address",
      label: "UK representative address",
      type: "textarea",
    },
    {
      name: "popia_info_officer_name",
      label: "POPIA Information Officer (ZA)",
      help: "Required if processing personal info of South African data subjects.",
    },
    {
      name: "popia_info_officer_email",
      label: "POPIA Information Officer email",
      type: "email",
    },
    { name: "ndpr_dpco_name", label: "NDPR DPCO (Nigeria)" },
    { name: "ndpr_dpco_email", label: "NDPR DPCO email", type: "email" },
    {
      name: "eu_odr_link",
      label: "EU ODR link",
      type: "url",
      placeholder: "https://ec.europa.eu/consumers/odr",
    },
    {
      name: "vsbg_statement",
      label: "VSBG § 36 statement",
      type: "select",
      options: [
        {
          value: "not_willing",
          label: "Not willing/obliged (default for events)",
        },
        { value: "willing_specified", label: "Willing — specified authority" },
        { value: "willing_general", label: "Willing — general" },
      ],
    },
  ],
  brand: [
    { name: "brand_name", label: "Brand name" },
    { name: "brand_tagline_en", label: "Tagline (EN)" },
    { name: "brand_tagline_de", label: "Tagline (DE)" },
    { name: "brand_tagline_fr", label: "Tagline (FR)" },
    {
      name: "logo_light_url",
      label: "Logo (light mode)",
      type: "asset",
      help: "Dark logo that reads well on a light background.",
    },
    {
      name: "logo_dark_url",
      label: "Logo (dark mode)",
      type: "asset",
      help: "Light logo that reads well on a dark background.",
    },
    { name: "logo_wordmark_url", label: "Wordmark", type: "asset" },
    { name: "favicon_url", label: "Favicon", type: "asset" },
    {
      name: "og_default_image_url",
      label: "Default OG / share image",
      type: "asset",
    },
    { name: "primary_color", label: "Primary color (hex)", type: "color" },
  ],
  social: [
    { name: "linkedin_url", label: "LinkedIn URL", type: "url" },
    { name: "instagram_url", label: "Instagram URL", type: "url" },
    { name: "facebook_url", label: "Facebook URL", type: "url" },
    { name: "whatsapp_url", label: "WhatsApp URL", type: "url" },
    { name: "youtube_url", label: "YouTube URL", type: "url" },
    { name: "twitter_url", label: "X / Twitter URL", type: "url" },
  ],
  seo: [
    { name: "seo_title_en", label: "Default title (EN)" },
    { name: "seo_title_de", label: "Default title (DE)" },
    { name: "seo_title_fr", label: "Default title (FR)" },
    {
      name: "seo_description_en",
      label: "Default description (EN)",
      type: "textarea",
    },
    {
      name: "seo_description_de",
      label: "Default description (DE)",
      type: "textarea",
    },
    {
      name: "seo_description_fr",
      label: "Default description (FR)",
      type: "textarea",
    },
    {
      name: "google_site_verification",
      label: "Google Search Console verification",
      help: "Paste the content value from Google Search Console > Settings > Ownership verification > HTML tag.",
    },
    {
      name: "bing_site_verification",
      label: "Bing Webmaster Tools verification",
      help: "Paste the content value from Bing Webmaster Tools > Settings > Verify ownership > HTML Meta Tag.",
    },
  ],
  banking: [
    { name: "bank_name", label: "Bank name" },
    { name: "account_holder", label: "Account holder" },
    { name: "iban", label: "IBAN" },
    { name: "bic", label: "BIC / SWIFT" },
  ],
};

export function CompanyInfoForm({ info }: { info: CompanyInfo }) {
  const [tab, setTab] = useState<Section>("legal");

  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-t-md border-b-2 px-4 py-2 text-sm font-medium ${
              tab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <SectionForm section={tab} info={info} fields={FIELDS[tab]} />
      </div>
    </div>
  );
}

function SectionForm({
  section,
  info,
  fields,
}: {
  section: Section;
  info: CompanyInfo;
  fields: FieldDef[];
}) {
  const [isPending, startTransition] = useTransition();
  const [assetValues, setAssetValues] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    for (const f of fields) {
      if (f.type === "asset") {
        out[String(f.name)] = (info[f.name] ?? "") as string;
      }
    }
    return out;
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateCompanyInfoSection(section, formData);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Saved.");
      }
    });
  }

  async function handleAssetUpload(field: BrandAssetField, file: File) {
    const result = await uploadBrandAsset(field, file);
    if ("error" in result && result.error) {
      throw new Error(result.error);
    }
    if ("url" in result && result.url) {
      setAssetValues((prev) => ({ ...prev, [field]: result.url }));
      toast.success("Asset uploaded.");
      return result.url;
    }
    throw new Error("Upload returned no URL.");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((f) => {
          const value = (info[f.name] ?? "") as string;

          if (f.type === "asset") {
            const field = String(f.name) as BrandAssetField;
            const current = assetValues[field] ?? value;
            return (
              <div
                key={String(f.name)}
                className="col-span-full grid gap-3 rounded-md border border-border p-4 md:grid-cols-[240px_1fr]"
              >
                <AssetUpload
                  value={current || null}
                  label={f.label}
                  description={f.help}
                  onUpload={(file) => handleAssetUpload(field, file)}
                  onChange={(url) =>
                    setAssetValues((prev) => ({ ...prev, [field]: url }))
                  }
                  onRemove={() =>
                    setAssetValues((prev) => ({ ...prev, [field]: "" }))
                  }
                />
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">
                    Or paste a CDN URL
                  </span>
                  <input
                    type="url"
                    name={String(f.name)}
                    value={current}
                    onChange={(e) =>
                      setAssetValues((prev) => ({
                        ...prev,
                        [field]: e.target.value,
                      }))
                    }
                    placeholder="https://…"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono"
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    The uploader writes the URL here automatically. Click Save to
                    commit a pasted URL.
                  </p>
                </label>
              </div>
            );
          }

          if (f.type === "checkbox") {
            return (
              <label
                key={String(f.name)}
                className="col-span-full flex items-start gap-3"
              >
                <input
                  type="checkbox"
                  name={String(f.name)}
                  defaultChecked={Boolean(info[f.name])}
                  className="mt-1 h-4 w-4 rounded border-border"
                />
                <span className="flex-1">
                  <span className="block text-sm font-medium">{f.label}</span>
                  {f.help && (
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {f.help}
                    </span>
                  )}
                </span>
              </label>
            );
          }

          if (f.type === "select") {
            return (
              <label key={String(f.name)} className="block">
                <span className="mb-1 block text-sm font-medium">{f.label}</span>
                <select
                  name={String(f.name)}
                  defaultValue={value}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="">—</option>
                  {(f.options ?? []).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {f.help && (
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {f.help}
                  </span>
                )}
              </label>
            );
          }

          if (f.type === "textarea") {
            return (
              <label key={String(f.name)} className="col-span-full block">
                <span className="mb-1 block text-sm font-medium">
                  {f.label}
                </span>
                <textarea
                  name={String(f.name)}
                  defaultValue={value}
                  placeholder={f.placeholder}
                  rows={3}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
                {f.help && (
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {f.help}
                  </span>
                )}
              </label>
            );
          }
          return (
            <label key={String(f.name)} className="block">
              <span className="mb-1 block text-sm font-medium">{f.label}</span>
              <input
                type={f.type || "text"}
                name={String(f.name)}
                defaultValue={value}
                placeholder={f.placeholder}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              {f.help && (
                <span className="mt-1 block text-xs text-muted-foreground">
                  {f.help}
                </span>
              )}
            </label>
          );
        })}
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
