// Tickets-app JSON-LD helpers. The marketing site has its own copies in
// apps/site/src/lib/json-ld.tsx; we keep a small parallel set here rather
// than reach across the workspace because the helpers only need the
// fields the tickets app actually has access to (event row + funnel
// content) and importing across apps would pull the marketing-site
// company_info dependency we don't want here.

type JsonLdProps = { data: Record<string, unknown> };

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// Event schema (Google rich results: event card with date, location, offer).
// Mirrors the marketing-site eventJsonLd helper but kept local so this app
// stays decoupled from the site app's lib.
export function eventJsonLd(input: {
  name: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  imageUrl?: string | null;
  venueName?: string | null;
  city?: string | null;
  country?: string | null;
  organizerName: string;
  pageUrl: string;
  minPrice?: number | null;
  priceCurrency?: string | null;
}) {
  const location = input.venueName
    ? {
        "@type": "Place",
        name: input.venueName,
        address: {
          "@type": "PostalAddress",
          addressLocality: input.city ?? undefined,
          addressCountry: input.country ?? "DE",
        },
      }
    : undefined;

  const offers =
    input.minPrice != null
      ? {
          "@type": "Offer",
          url: input.pageUrl,
          price: input.minPrice,
          priceCurrency: input.priceCurrency ?? "EUR",
          availability: "https://schema.org/InStock",
        }
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: input.name,
    description: input.description ?? "",
    startDate: input.startsAt,
    endDate: input.endsAt,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    image: input.imageUrl ?? undefined,
    location,
    organizer: {
      "@type": "Organization",
      name: input.organizerName,
      url: "https://dbc-germany.com",
    },
    offers,
    url: input.pageUrl,
  };
}

// FAQPage schema for the funnel FAQ section. Google can surface these in
// rich-result accordion form when the page is genuinely about the FAQ.
export function faqJsonLd(
  faqs: Array<{ question: string; answer: string }>,
) {
  if (faqs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

// BreadcrumbList schema. Used on deep pages with a clear parent so Google
// shows the path under the page title instead of the raw URL.
export function breadcrumbJsonLd(
  items: Array<{ name: string; url: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
