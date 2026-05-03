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
    "@dbc/legal",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "diambilaybusinesscenter.org",
        pathname: "/images/**",
      },
      {
        protocol: "https",
        hostname: "rcqgsexfuaoiiuqcqeka.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
      ],
    },
    {
      source: "/:path*.(jpg|jpeg|png|webp|avif|svg|ico|woff2)",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
  ],
};

export default withSentryConfig(withNextIntl(nextConfig), {
  org: "dbc-germany",
  project: "dbc-site",
  silent: !process.env.CI,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  disableLogger: true,
  automaticVercelMonitors: true,
});
