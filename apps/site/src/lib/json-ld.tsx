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

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.trade_name ?? company.legal_name,
    legalName: company.legal_name,
    url: "https://dbc-germany.com",
    logo: company.logo_light_url ?? undefined,
    description: company.seo_description_en ?? undefined,
    sameAs,
    address: company.registered_address
      ? {
          "@type": "PostalAddress",
          streetAddress: company.registered_address,
          addressLocality: company.registered_city ?? undefined,
          postalCode: company.registered_postal_code ?? undefined,
          addressCountry: company.registered_country ?? "DE",
        }
      : undefined,
    contactPoint: {
      "@type": "ContactPoint",
      email: company.primary_email,
      contactType: "customer service",
      availableLanguage: ["English", "German", "French"],
    },
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
