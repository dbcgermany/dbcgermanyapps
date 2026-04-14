"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { LocaleSwitch } from "./locale-switch";
import { ThemeToggle } from "@dbc/ui";

export function SiteHeader({ locale }: { locale: string }) {
  const t = useTranslations("site.nav");
  const tTheme = useTranslations("site.theme");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const primary: Array<{ href: string; label: string }> = [
    { href: `/${locale}/services`, label: t("services") },
    { href: `/${locale}/events`, label: t("events") },
    { href: `/${locale}/about`, label: t("about") },
    { href: `/${locale}/contact`, label: t("contact") },
  ];

  const ticketsUrl =
    process.env.NEXT_PUBLIC_TICKETS_URL ?? "https://ticket.dbc-germany.com";

  return (
    <header
      className={`sticky top-0 z-40 transition-colors ${
        scrolled
          ? "border-b border-border bg-background/80 backdrop-blur"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 font-heading text-lg font-bold tracking-tight"
          aria-label="DBC Germany"
        >
          <span
            aria-hidden
            className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
          >
            DBC
          </span>
          <span>DBC Germany</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {primary.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle
            labels={{
              light: tTheme("light"),
              dark: tTheme("dark"),
              system: tTheme("system"),
            }}
          />
          <LocaleSwitch currentLocale={locale} />
          <a
            href={ticketsUrl}
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            {t("tickets")}
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground hover:bg-muted"
          aria-label={open ? t("close") : t("menu")}
          aria-expanded={open}
        >
          <span aria-hidden className="text-xl">
            {open ? "\u2715" : "\u2630"}
          </span>
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6">
            {primary.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
            <a
              href={ticketsUrl}
              className="mt-2 inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
            >
              {t("tickets")}
            </a>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <LocaleSwitch currentLocale={locale} />
              <ThemeToggle
                labels={{
                  light: tTheme("light"),
                  dark: tTheme("dark"),
                  system: tTheme("system"),
                }}
              />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
