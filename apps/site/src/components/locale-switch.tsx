"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALES } from "@dbc/types";

export function LocaleSwitch({ currentLocale }: { currentLocale: string }) {
  const pathname = usePathname();

  function hrefFor(locale: string) {
    const segments = pathname.split("/");
    segments[1] = locale;
    return segments.join("/") || `/${locale}`;
  }

  return (
    <div className="flex items-center gap-1 rounded-full border border-border px-1 py-0.5 text-xs font-medium">
      {LOCALES.map((l) => {
        const active = l === currentLocale;
        return (
          <Link
            key={l}
            href={hrefFor(l)}
            aria-label={`Switch language to ${l.toUpperCase()}`}
            className={`rounded-full px-2 py-1 uppercase tracking-wider transition-colors ${
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {l}
          </Link>
        );
      })}
    </div>
  );
}
