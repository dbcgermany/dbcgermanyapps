"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { BRAND, LocaleSwitch, ThemeToggle } from "@dbc/ui";

const MARKETING_SITE_URL = "https://dbc-germany.com";

export function TicketsHeader({ locale }: { locale: string }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-colors ${
        scrolled
          ? "border-b border-border bg-background/80 backdrop-blur"
          : "border-b border-transparent bg-background/60 backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <a
          href={MARKETING_SITE_URL}
          className="flex items-center gap-2 font-heading text-lg font-bold tracking-tight"
          aria-label={BRAND.wordmarkAlt}
        >
          <Image
            src={BRAND.logoSrc}
            alt=""
            width={96}
            height={30}
            className="h-7 w-auto"
            priority
          />
          <span>Germany</span>
          <span className="sr-only">DBC</span>
        </a>

        <div className="flex items-center gap-2">
          <LocaleSwitch currentLocale={locale} />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
