import type { Metadata, Viewport } from "next";
import { Montserrat, Ubuntu, DM_Sans } from "next/font/google";
import { ThemeProvider, CookieConsent } from "@dbc/ui";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getCompanyInfo } from "@/lib/company-info";
import { JsonLd, organizationJsonLd, websiteJsonLd } from "@/lib/json-ld";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

const ubuntu = Ubuntu({
  variable: "--font-ubuntu",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const company = await getCompanyInfo();
  const verification: Metadata["verification"] = {};
  if (company?.google_site_verification)
    verification.google = company.google_site_verification;
  if (company?.bing_site_verification)
    verification.other = { "msvalidate.01": company.bing_site_verification };

  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://dbc-germany.com"
    ),
    // Plain string — NOT a { default, template } object, because the
    // template would then wrap every child's already-branded title and
    // produce "… — DBC Germany — DBC Germany". Each page calls
    // buildPageMetadata() which returns a fully-formed title with the
    // brand baked in.
    title: company?.brand_name ?? "DBC Germany",
    description:
      company?.seo_description_en ??
      company?.brand_tagline_en ??
      undefined,
    openGraph: {
      type: "website",
      siteName: company?.brand_name ?? "DBC Germany",
      locale: "en_US",
      alternateLocale: ["de_DE", "fr_FR"],
      images: company?.og_default_image_url
        ? [{ url: company.og_default_image_url }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
    },
    appleWebApp: {
      capable: true,
      title: company?.brand_name ?? "DBC Germany",
      statusBarStyle: "default",
    },
    // Explicit icon list — Next's convention-based detection should pick
    // up app/icon.{svg,png}, but stating it here guarantees the right
    // <link rel="icon"> tags in the HTML head and beats any browser
    // cache that's holding on to the default globe.
    icons: {
      icon: [
        { url: "/icon.svg", type: "image/svg+xml" },
        { url: "/icon.png", sizes: "32x32", type: "image/png" },
      ],
      apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
      shortcut: "/favicon.ico",
    },
    verification,
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const company = await getCompanyInfo();
  const orgSchema = organizationJsonLd(company);
  const siteSchema = websiteJsonLd();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${montserrat.variable} ${ubuntu.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-body">
        {orgSchema && <JsonLd data={orgSchema} />}
        <JsonLd data={siteSchema} />
        <ThemeProvider defaultTheme="system">
          {children}
          <CookieConsent
            translations={{
              title: "We value your privacy",
              description:
                "We use cookies to enhance browsing, serve personalised content, and analyse traffic. Read our Cookie Policy.",
              accept: "Accept all",
              reject: "Reject non-essential",
            }}
          />
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
