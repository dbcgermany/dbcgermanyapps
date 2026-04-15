import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Montserrat, Ubuntu, DM_Sans } from "next/font/google";
import { ThemeProvider, NO_FLASH_THEME_SCRIPT } from "@dbc/ui";
import { Toaster } from "sonner";
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
  title: "DBC Germany Admin",
  description: "Admin dashboard for DBC Germany event management",
  robots: "noindex, nofollow",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("dbc-theme")?.value;
  const initialTheme =
    themeCookie === "light" || themeCookie === "dark" || themeCookie === "system"
      ? themeCookie
      : "system";

  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-theme={initialTheme === "dark" ? "dark" : "light"}
      className={`${initialTheme === "dark" ? "dark " : ""}${montserrat.variable} ${ubuntu.variable} ${dmSans.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_THEME_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-body">
        <ThemeProvider initialTheme={initialTheme}>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{ duration: 4000 }}
            closeButton
            richColors
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
