import type { PublicCompanyInfo } from "@/lib/company-info";

type JsonLdProps = { data: Record<string, unknown> };

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function organizationJsonLd(company: PublicCompanyInfo | null) {
  if (!company) return null;
  const sameAs = [
    company.linkedin_url,
    company.instagram_url,
    company.facebook_url,
    company.youtube_url,
    company.twitter_url,
  ].filter((u): u is string => !!u);

  // Prefer the staffed office address (Düsseldorf) over the registered address
  // for the PostalAddress block — that's what Google Business Profile, Maps,
  // and sitelinks anchor to. Fall back to registered_address if office fields
  // aren't populated yet.
  const addressStreet =
    company.office_line1 ??
    company.office_address ??
    company.registered_address ??
    null;
  const addressCity = company.office_city ?? company.registered_city ?? null;
  const addressPostal =
    company.office_postal_code ?? company.registered_postal_code ?? null;
  const addressCountry =
    company.office_country ?? company.registered_country ?? "DE";

  const hasPhysicalAddress = !!addressStreet;
  const hasOffice = !!company.office_line1;

  // Upgrade to LocalBusiness when the public office address is known — it
  // unlocks Google knowledge-panel / Maps eligibility for the brand.
  const type = hasOffice ? "LocalBusiness" : "Organization";

  return {
    "@context": "https://schema.org",
    "@type": type,
    "@id": "https://dbc-germany.com/#organization",
    name: company.brand_name ?? company.legal_name,
    legalName: company.legal_name,
    url: "https://dbc-germany.com",
    logo: company.logo_light_url ?? undefined,
    image: company.og_default_image_url ?? company.logo_light_url ?? undefined,
    description:
      company.seo_description_en ??
      company.brand_tagline_en ??
      undefined,
    sameAs,
    telephone: company.phone ?? undefined,
    email: company.primary_email ?? undefined,
    priceRange: hasOffice ? "€€" : undefined,
    address: hasPhysicalAddress
      ? {
          "@type": "PostalAddress",
          streetAddress: addressStreet ?? undefined,
          addressLocality: addressCity ?? undefined,
          postalCode: addressPostal ?? undefined,
          addressCountry,
        }
      : undefined,
    contactPoint: {
      "@type": "ContactPoint",
      email: company.primary_email ?? undefined,
      telephone: company.phone ?? undefined,
      contactType: "customer service",
      availableLanguage: ["English", "German", "French"],
      areaServed: ["DE", "EU", "Africa"],
    },
  };
}

/**
 * WebSite schema with a SearchAction so Google is eligible to show a
 * sitelinks search box under "DBC Germany" queries. The target URL
 * points at /news which has the most frequently updated content;
 * `{search_term_string}` is substituted by Google at runtime.
 */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://dbc-germany.com/#website",
    url: "https://dbc-germany.com",
    name: "DBC Germany",
    inLanguage: ["en", "de", "fr"],
    publisher: { "@id": "https://dbc-germany.com/#organization" },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate:
          "https://dbc-germany.com/en/news?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function personJsonLd(person: {
  name: string;
  role: string | null;
  bio: string | null;
  imageUrl: string | null;
  slug: string;
  email: string | null;
  linkedinUrl: string | null;
  locale: "en" | "de" | "fr";
}) {
  const sameAs = person.linkedinUrl ? [person.linkedinUrl] : undefined;
  const description =
    person.bio && person.bio.length > 300
      ? person.bio.slice(0, 297) + "…"
      : person.bio ?? undefined;
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: person.name,
    jobTitle: person.role ?? undefined,
    description,
    image: person.imageUrl ?? undefined,
    email: person.email ?? undefined,
    url: `https://dbc-germany.com/${person.locale}/team/${person.slug}`,
    worksFor: { "@id": "https://dbc-germany.com/#organization" },
    sameAs,
  };
}

export function jobPostingJsonLd(job: {
  id: string;
  title: string;
  description: string;
  location: string | null;
  employmentType: string | null;
  postedAt: string;
  validThrough?: string | null;
  publisher: string;
  publisher_logo: string | null;
}) {
  const employmentTypeMap: Record<string, string> = {
    full_time: "FULL_TIME",
    part_time: "PART_TIME",
    freelance: "CONTRACTOR",
    internship: "INTERN",
  };
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    datePosted: job.postedAt,
    validThrough: job.validThrough ?? undefined,
    employmentType: job.employmentType
      ? employmentTypeMap[job.employmentType] ?? job.employmentType.toUpperCase()
      : undefined,
    hiringOrganization: {
      "@type": "Organization",
      name: job.publisher,
      sameAs: "https://dbc-germany.com",
      logo: job.publisher_logo ?? undefined,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.location ?? "Düsseldorf",
        addressCountry: "DE",
      },
    },
    directApply: true,
    url: `https://dbc-germany.com/en/careers/${job.id}`,
  };
}

export function serviceJsonLd(service: {
  name: string;
  description: string;
  url: string;
  image?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    description: service.description,
    url: service.url,
    image: service.image ?? undefined,
    provider: { "@id": "https://dbc-germany.com/#organization" },
    areaServed: [
      { "@type": "Country", name: "Germany" },
      { "@type": "Country", name: "France" },
      { "@type": "Place", name: "African diaspora in Europe" },
    ],
  };
}

export function itemListJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: item.url,
    })),
  };
}

export function breadcrumbJsonLd(
  items: Array<{ name: string; url: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function eventJsonLd(event: {
  title: string;
  description: string;
  slug: string;
  starts_at: string;
  ends_at: string;
  venue_name: string | null;
  city: string | null;
  country: string | null;
  cover_image_url: string | null;
  min_price?: number | null;
  currency?: string;
  organizer: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description,
    startDate: event.starts_at,
    endDate: event.ends_at,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    image: event.cover_image_url ?? undefined,
    location: event.venue_name
      ? {
          "@type": "Place",
          name: event.venue_name,
          address: {
            "@type": "PostalAddress",
            addressLocality: event.city ?? undefined,
            addressCountry: event.country ?? "DE",
          },
        }
      : undefined,
    organizer: {
      "@type": "Organization",
      name: event.organizer,
      url: "https://dbc-germany.com",
    },
    offers: event.min_price != null
      ? {
          "@type": "Offer",
          url: `https://tickets.dbc-germany.com/en/events/${event.slug}`,
          price: event.min_price,
          priceCurrency: event.currency ?? "EUR",
          availability: "https://schema.org/InStock",
        }
      : undefined,
  };
}

export function articleJsonLd(article: {
  title: string;
  description: string;
  slug: string;
  published_at: string;
  updated_at: string;
  author_name: string | null;
  cover_image_url: string | null;
  publisher: string;
  publisher_logo: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.description,
    datePublished: article.published_at,
    dateModified: article.updated_at,
    image: article.cover_image_url ?? undefined,
    author: article.author_name
      ? { "@type": "Person", name: article.author_name }
      : { "@type": "Organization", name: article.publisher },
    publisher: {
      "@type": "Organization",
      name: article.publisher,
      logo: article.publisher_logo
        ? { "@type": "ImageObject", url: article.publisher_logo }
        : undefined,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://dbc-germany.com/en/news/${article.slug}`,
    },
  };
}

export function faqJsonLd(
  items: Array<{ question: string; answer: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
