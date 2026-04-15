"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { LocaleSwitch, ThemeToggle } from "@dbc/ui";

const MARKETING_SITE_URL = "https://dbc-germany.com";
const LOGO_URL =
  "https://diambilaybusinesscenter.org/images/Logo_DB.png";

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
          aria-label="DBC Germany"
        >
          <Image
            src={LOGO_URL}
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
            referrerPolicy="no-referrer"
            priority
          />
          <span>DBC Germany</span>
        </a>

        <div className="flex items-center gap-2">
          <LocaleSwitch currentLocale={locale} />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
