import type { Metadata } from "next";
import { Montserrat, Ubuntu, DM_Sans } from "next/font/google";
import { ThemeProvider } from "@dbc/ui";
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
