import type { MetadataRoute } from "next";

// Intentionally empty. admin.dbc-germany.com publishes nothing to search.
// A well-formed empty sitemap is friendlier to automated probes than a 404.
export default function sitemap(): MetadataRoute.Sitemap {
  return [];
}
