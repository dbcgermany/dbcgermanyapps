import type { MetadataRoute } from "next";

// admin.dbc-germany.com is an operator-only dashboard — never index it.
// This served-at-/robots.txt file is defense #1; see layout.tsx (meta tag)
// + proxy.ts (X-Robots-Tag header) + sitemap.ts (empty) for the full stack.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
    // No sitemap entry on purpose — nothing here is public.
  };
}
