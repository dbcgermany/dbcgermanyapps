import type { Metadata } from "next";
import { Montserrat, Ubuntu, DM_Sans } from "next/font/google";
import { ThemeProvider, CookieConsent } from "@dbc/ui";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getCompanyInfo } from "@/lib/company-info";
import { JsonLd, organizationJsonLd } from "@/lib/json-ld";
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
    title: {
      default:
        company?.seo_title_en ??
        (company?.brand_tagline_en
          ? `${company?.brand_name ?? "DBC Germany"} — ${company.brand_tagline_en}`
          : company?.brand_name ?? "DBC Germany"),
      template: `%s — ${company?.brand_name ?? "DBC Germany"}`,
    },
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
    verification,
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const company = await getCompanyInfo();
  const orgSchema = organizationJsonLd(company);

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${montserrat.variable} ${ubuntu.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-body">
        {orgSchema && <JsonLd data={orgSchema} />}
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
