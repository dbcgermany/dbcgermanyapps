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
      className={`inline-flex items-center gap-1 rounded-full border border-border bg-background/60 p-1 text-xs font-medium ${className}`}
    >
      {locales.map((l) => {
        const active = l === currentLocale;
        return (
          <Link
            key={l}
            href={hrefFor(l)}
            aria-label={`Switch language to ${l.toUpperCase()}`}
            aria-current={active ? "page" : undefined}
            className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 transition-colors ${
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <span aria-hidden className="text-sm leading-none">
              {FLAGS[l] ?? ""}
            </span>
            <span className="uppercase tracking-wider">{l}</span>
          </Link>
        );
      })}
    </div>
  );
}
