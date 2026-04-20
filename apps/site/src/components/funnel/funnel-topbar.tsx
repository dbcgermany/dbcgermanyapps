"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { BRAND, LocaleSwitch } from "@dbc/ui";

// Minimal funnel topbar. No nav links, no CTAs other than the logo.
// The logo links to the marketing home in a new tab so a social-ad
// visitor who clicks it doesn't lose the landing page they came for.
export function FunnelTopBar({ locale }: { locale: string }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-colors ${
        scrolled
          ? "border-b border-border bg-background/85 backdrop-blur"
          : "bg-transparent"
      }`}
      data-funnel-topbar
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 font-heading text-base font-bold tracking-tight"
          aria-label={BRAND.wordmarkAlt}
        >
          <Image
            src={BRAND.logoSrc}
            alt=""
            width={88}
            height={28}
            className="h-7 w-auto"
            priority
            unoptimized
          />
          <span className="hidden sm:inline">Germany</span>
          <span className="sr-only">DBC</span>
        </Link>
        <LocaleSwitch currentLocale={locale} />
      </div>
    </header>
  );
}
