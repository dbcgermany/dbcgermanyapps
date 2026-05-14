// Pure data export — no server dependencies — so client components can
// import it without dragging the server render path (marked + jsdom +
// supabase server client) into the browser bundle.

export const TEMPLATE_VARIABLES: ReadonlyArray<{
  key: string;
  description: string;
}> = [
  { key: "legal_name_with_form", description: "DBC Germany UG" },
  { key: "legal_name", description: "DBC Germany" },
  { key: "legal_form", description: "UG" },
  { key: "trade_name", description: "Trading-as name" },
  { key: "brand_name", description: "Brand display name" },
  { key: "registered_address", description: "Registered office (one line)" },
  { key: "office_address", description: "Operational office (one line)" },
  { key: "fr_address", description: "French entity address (one line)" },
  { key: "parent_address", description: "Parent organisation address" },
  { key: "primary_email", description: "Primary contact email" },
  { key: "privacy_email", description: "Privacy / DPO email" },
  { key: "legal_email", description: "Legal / disputes email" },
  { key: "support_email", description: "Customer support email" },
  { key: "phone", description: "Phone number" },
  { key: "vat_id", description: "USt-IdNr / VAT ID" },
  { key: "tax_id", description: "Steuernummer" },
  { key: "hrb", description: "Handelsregister entry (HRB + court)" },
  { key: "managing_directors", description: "Geschäftsführer name(s)" },
  { key: "responsible_person", description: "MStV-responsible person" },
  { key: "supervisory_authority", description: "Aufsichtsbehörde" },
  { key: "marketing_site_url", description: "Marketing site URL" },
  { key: "tickets_site_url", description: "Tickets app URL" },
  { key: "privacy_url", description: "Link to /privacy" },
  { key: "cookies_url", description: "Link to /cookies" },
  { key: "terms_url", description: "Link to /terms" },
  { key: "imprint_url", description: "Link to /imprint" },
];
