import { getRequestConfig } from "next-intl/server";
import { LOCALES, DEFAULT_LOCALE, type Locale } from "@dbc/types";

export async function loadMessages(
  locale: string
): Promise<Record<string, unknown>> {
  const safe = (LOCALES as readonly string[]).includes(locale)
    ? (locale as Locale)
    : DEFAULT_LOCALE;
  const mod = await import(`../messages/${safe}.json`);
  return mod.default as Record<string, unknown>;
}

// Entry point used by next-intl's plugin. We don't run next-intl's routing
// middleware (the apps have their own auth/locale middleware), so
// `requestLocale` may be undefined. Fall back to DEFAULT_LOCALE instead of
// calling notFound(); the [locale] layout already 404s on invalid locales.
export default getRequestConfig(async ({ requestLocale }) => {
  const incoming = await requestLocale;
  const locale: Locale = (LOCALES as readonly string[]).includes(incoming ?? "")
    ? (incoming as Locale)
    : DEFAULT_LOCALE;

  return {
    locale,
    messages: await loadMessages(locale),
    timeZone: "Europe/Berlin",
  };
});
