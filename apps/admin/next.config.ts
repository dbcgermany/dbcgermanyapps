import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  transpilePackages: [
    "@dbc/supabase",
    "@dbc/types",
    "@dbc/i18n",
    "@dbc/ui",
    "@dbc/email",
  ],
  experimental: {
    serverActions: {
      // Admin uploads photos (avatars, team, event covers, sponsor logos,
      // newsletter cover, news covers, media) via Server Actions. The
      // default cap is 1 MB; bump to 50 MB so users can drop in raw
      // phone photos or retina screenshots. The server re-encodes every
      // raster input to WebP at quality 85 via @/lib/webp before it hits
      // Supabase storage, so the stored file is typically < 500 KB.
      bodySizeLimit: "50mb",
    },
  },
  // admin.dbc-germany.com is the operator dashboard — invisible to search.
  // Pair with proxy.ts (dynamic responses), robots.ts, and the meta tag in
  // layout.tsx for defense in depth; this covers static assets too.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive, nosnippet, noimageindex",
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
