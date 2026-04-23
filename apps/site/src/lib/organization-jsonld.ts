// Builds the Organization JSON-LD payload rendered on /about. Declares
// the parent-org relationship structurally (not in body copy, per brand
// voice rule), pulls socials from company_info, and exposes logo + url
// so Google's knowledge panel has something concrete to latch onto.

export interface OrgJsonLdInput {
  siteUrl: string;        // https://dbc-germany.com
  name: string;           // "DBC Germany"
  legalName?: string | null;
  logoUrl?: string | null;
  tagline?: string | null;
  primaryEmail?: string | null;
  officeAddress?: {
    streetAddress?: string | null;
    postalCode?: string | null;
    addressLocality?: string | null;
    addressCountry?: string | null;
  } | null;
  sameAs: string[];       // socials that aren't null/empty
  parentName?: string | null;
  parentUrl?: string | null;
}

export function buildOrganizationJsonLd(
  input: OrgJsonLdInput
): Record<string, unknown> {
  const address = input.officeAddress;
  const hasAddress =
    address &&
    (address.streetAddress ||
      address.postalCode ||
      address.addressLocality ||
      address.addressCountry);

  const out: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: input.name,
    url: input.siteUrl,
  };
  if (input.legalName) out.legalName = input.legalName;
  if (input.tagline) out.description = input.tagline;
  if (input.logoUrl) out.logo = input.logoUrl;
  if (input.primaryEmail) out.email = input.primaryEmail;
  if (hasAddress) {
    out.address = {
      "@type": "PostalAddress",
      ...(address.streetAddress && { streetAddress: address.streetAddress }),
      ...(address.postalCode && { postalCode: address.postalCode }),
      ...(address.addressLocality && { addressLocality: address.addressLocality }),
      ...(address.addressCountry && { addressCountry: address.addressCountry }),
    };
  }
  if (input.sameAs.length > 0) out.sameAs = input.sameAs;
  if (input.parentName && input.parentUrl) {
    out.parentOrganization = {
      "@type": "Organization",
      name: input.parentName,
      url: input.parentUrl,
    };
  }
  return out;
}
