"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALES } from "@dbc/types";
import { ThemeToggle } from "@dbc/ui";

export function UtilityBar({ locale }: { locale: string }) {
  const pathname = usePathname();

  function hrefFor(l: string) {
    const segments = pathname.split("/");
    segments[1] = l;
    return segments.join("/") || `/${l}`;
  }

  return (
    <div className="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-full border border-border bg-background/80 px-2 py-1 shadow-sm backdrop-blur">
      <div className="flex items-center gap-1 text-xs font-medium">
        {LOCALES.map((l) => {
          const active = l === locale;
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
      <ThemeToggle />
    </div>
  );
}
