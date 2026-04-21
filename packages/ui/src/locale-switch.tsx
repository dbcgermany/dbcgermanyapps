"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const FLAGS: Record<string, string> = {
  en: "\uD83C\uDDEC\uD83C\uDDE7", // 🇬🇧
  de: "\uD83C\uDDE9\uD83C\uDDEA", // 🇩🇪
  fr: "\uD83C\uDDEB\uD83C\uDDF7", // 🇫🇷
};

export function LocaleSwitch({
  currentLocale,
  locales = ["en", "de", "fr"],
  className = "",
}: {
  currentLocale: string;
  locales?: readonly string[];
  className?: string;
}) {
  const pathname = usePathname() ?? "/";

  function hrefFor(locale: string) {
    const segments = pathname.split("/");
    if (segments.length > 1) {
      segments[1] = locale;
    } else {
      return `/${locale}`;
    }
    return segments.join("/") || `/${locale}`;
  }

  return (
    <div
      role="group"
      aria-label="Language"
      className={`inline-flex items-center gap-2 ${className}`}
    >
      {locales.map((l) => {
        const active = l === currentLocale;
        return (
          <Link
            key={l}
            href={hrefFor(l)}
            aria-label={`Switch language to ${l.toUpperCase()}`}
            aria-current={active ? "page" : undefined}
            title={l.toUpperCase()}
            className={`inline-flex items-center justify-center text-base leading-none transition-opacity ${
              active ? "opacity-100" : "opacity-50 hover:opacity-100"
            }`}
          >
            <span aria-hidden>{FLAGS[l] ?? l.toUpperCase()}</span>
          </Link>
        );
      })}
    </div>
  );
}
