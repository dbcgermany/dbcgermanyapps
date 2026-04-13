import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";
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

// Entry point used by next-intl's plugin. Reads the locale that routing
// matched ({locale}) and returns the message dictionary + defaults.
export default getRequestConfig(async ({ requestLocale }) => {
  const incoming = await requestLocale;
  const locale = (LOCALES as readonly string[]).includes(incoming ?? "")
    ? (incoming as Locale)
    : null;
  if (!locale) notFound();

  return {
    locale,
    messages: await loadMessages(locale),
    timeZone: "Europe/Berlin",
  };
});
