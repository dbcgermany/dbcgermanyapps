import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  transpilePackages: [
    "@dbc/supabase",
    "@dbc/types",
    "@dbc/i18n",
    "@dbc/ui",
    "@dbc/email",
    // @dbc/legal ships raw TypeScript (exports point at ./src/*.ts). The news
    // create/update actions call sanitizeRichHtml via a dynamic
    // import("@dbc/legal/server"); without transpiling the package, that import
    // throws at runtime under Turbopack and every article save fails silently
    // before the DB write. Team edits work because they don't sanitize HTML.
    "@dbc/legal",
  ],
  images: {
    // Admin needs to render next/image tags pointing at Supabase Storage
    // (avatars, team photos, event covers, sponsor logos, newsletter covers,
    // news covers, media) and the Diambilay parent-org CDN. Without these
    // remotePatterns next/image returns a hard error ("this website could
    // not be found") when the uploader hands back the public URL and the
    // UI tries to preview it.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "rcqgsexfuaoiiuqcqeka.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "diambilaybusinesscenter.org",
        pathname: "/images/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      // Admin uploads photos (avatars, team, event covers, sponsor logos,
      // newsletter cover, news covers, media) via Server Actions. The
      // default cap is 1 MB; bump to 50 MB so users can drop in raw
      // phone photos or retina screenshots. The server re-encodes every
      // raster input to WebP at quality 85 via @/lib/webp before it hits
      // Supabase storage, so the stored file is typically < 500 KB.
      bodySizeLimit: "50mb",
      // Server-action IDs are pinned via the NEXT_SERVER_ACTIONS_ENCRYPTION_KEY
      // env var (set on Vercel for Production / Preview / Development on
      // every app in the ecosystem). Without it, Next regenerates a fresh
      // key per build and any browser still holding an older bundle dies on
      // submit with "Server Action … was not found on the server". Nothing
      // to wire here — Next reads the env var directly at runtime.
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

// Sentry wrapper: uploads source maps at build time (when SENTRY_AUTH_TOKEN
// + SENTRY_ORG + SENTRY_PROJECT are set), creates a release per Vercel
// deploy, and routes browser-side events through /monitoring so ad-blockers
// don't drop them. With no DSN env set the SDK no-ops at runtime — safe
// for first deploys before Sentry projects exist.
export default withSentryConfig(withNextIntl(nextConfig), {
  org: "dbc-germany",
  project: "dbc-admin",
  silent: !process.env.CI,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  // tunnelRoute removed: Sentry v10's auto-generated tunnel handler isn't
  // emitted on Next 16 App Router as of this version. SDK posts directly
  // to ingest.de.sentry.io instead — uBlock Origin will block some events
  // but that's acceptable for a pre-launch operator tool. Re-evaluate when
  // Sentry's Next.js plugin picks up first-class Next 16 tunnel support.
  disableLogger: true,
  automaticVercelMonitors: true,
});
