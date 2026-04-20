import type { Metadata, Viewport } from "next";
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
  title: "DBC Germany Tickets",
  description:
    "Get your tickets for Richesses D'Afrique conferences and masterclasses by DBC Germany.",
  appleWebApp: {
    capable: true,
    title: "DBC Tickets",
    statusBarStyle: "default",
  },
  // Explicit icon list (see site/admin/tickets layouts) — guarantees
  // the right <link rel="icon"> tags and beats stale browser caches.
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
    shortcut: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
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
              title: "We use cookies",
              description:
                "We use cookies to improve your experience and analyze site usage.",
              accept: "Accept all",
              reject: "Reject non-essential",
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
