import type { Locale } from "@dbc/types";
import { LOCALES } from "@dbc/types";
import { loadMessages } from "@dbc/i18n";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { createServerClient } from "@dbc/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const revalidate = 30;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!LOCALES.includes(locale as Locale)) {
    notFound();
  }

  const messages = await loadMessages(locale);

  // Maintenance mode gate — query site_settings and, if on, render the
  // translated maintenance screen in place of children.
  const supabase = await createServerClient();
  const { data: settings } = await supabase
    .from("site_settings")
    .select(
      "maintenance_mode, maintenance_message_en, maintenance_message_de, maintenance_message_fr"
    )
    .eq("id", 1)
    .maybeSingle();

  if (settings?.maintenance_mode) {
    const key =
      `maintenance_message_${locale}` as
        | "maintenance_message_en"
        | "maintenance_message_de"
        | "maintenance_message_fr";
    const message =
      (settings[key] as string | undefined) ??
      settings.maintenance_message_en;
    return (
      <NextIntlClientProvider locale={locale} messages={messages}>
        <main className="flex min-h-screen items-center justify-center bg-background px-6 py-24 text-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              {locale === "de"
                ? "Wartungsarbeiten"
                : locale === "fr"
                  ? "Maintenance en cours"
                  : "Maintenance in progress"}
            </p>
            <h1 className="mt-4 font-heading text-3xl font-bold sm:text-4xl">
              DBC Germany
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              {message}
            </p>
          </div>
        </main>
      </NextIntlClientProvider>
    );
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <SiteHeader locale={locale} />
      <main className="flex-1">{children}</main>
      <SiteFooter locale={locale} />
    </NextIntlClientProvider>
  );
}
