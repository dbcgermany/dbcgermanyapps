import type { Metadata } from "next";
import { Montserrat, Ubuntu, DM_Sans } from "next/font/google";
import { ThemeProvider, CookieConsent } from "@dbc/ui";
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

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://dbc-germany.com"
  ),
  title: {
    default: "DBC Germany — Africa's Top Business Group",
    template: "%s — DBC Germany",
  },
  description:
    "Diambilay Business Center Germany: incubation, courses, investments, mentorship and Richesses d'Afrique events for entrepreneurs with African roots.",
  openGraph: {
    type: "website",
    siteName: "DBC Germany",
    locale: "en_US",
    alternateLocale: ["de_DE", "fr_FR"],
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${montserrat.variable} ${ubuntu.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-body">
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
      </body>
    </html>
  );
}
