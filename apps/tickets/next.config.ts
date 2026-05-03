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
};

export default withSentryConfig(withNextIntl(nextConfig), {
  org: "dbc-germany",
  project: "dbc-tickets",
  silent: !process.env.CI,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  disableLogger: true,
  automaticVercelMonitors: true,
});
