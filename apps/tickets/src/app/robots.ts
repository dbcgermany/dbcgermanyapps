import type { MetadataRoute } from "next";

// tickets.dbc-germany.com is the public buy flow. We want event pages to
// be indexed (so people searching for "Richesses d'Afrique tickets" land
// here) but NOT the per-order confirmation, transfer, or order-history
// pages — those are buyer-private and may show PII.
export default function robots(): MetadataRoute.Robots {
  // On non-production deployments (preview), disallow everything so
  // search engines don't pick up staged event copy.
  if (
    process.env.VERCEL_ENV &&
    process.env.VERCEL_ENV !== "production"
  ) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/*/confirmation/",
          "/*/orders",
          "/*/transfer/",
          "/*/checkout/",
        ],
      },
    ],
    sitemap: "https://tickets.dbc-germany.com/sitemap.xml",
  };
}
