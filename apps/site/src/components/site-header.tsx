"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { BRAND, LocaleSwitch, ThemeToggle } from "@dbc/ui";

export function SiteHeader({ locale }: { locale: string }) {
  const t = useTranslations("site.nav");
  const tTheme = useTranslations("site.theme");
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const primary: Array<{ href: string; label: string }> = [
    { href: `/${locale}/services`, label: t("services") },
    { href: `/${locale}/events`, label: t("events") },
    { href: `/${locale}/news`, label: t("news") },
    { href: `/${locale}/about`, label: t("about") },
    { href: `/${locale}/team`, label: t("team") },
    { href: `/${locale}/contact`, label: t("contact") },
  ];

  const ticketsUrl =
    process.env.NEXT_PUBLIC_TICKETS_URL ?? "https://tickets.dbc-germany.com";

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
          aria-label={BRAND.wordmarkAlt}
        >
          <Image
            src={BRAND.logoSrc}
            alt=""
            width={96}
            height={30}
            className="h-5 w-auto"
            priority
          />
          <span>Germany</span>
          {/* sr-only mirror so crawlers that flatten <img alt=""> still
              see the full "DBC Germany" phrase in the DOM. */}
          <span className="sr-only">DBC</span>
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
            }}
          />
          <LocaleSwitch currentLocale={locale} />
          <Link
            href={`/${locale}/services/incubation/apply`}
            className="group relative inline-flex items-center overflow-hidden rounded-full bg-linear-to-r from-primary to-accent px-5 py-2 text-sm font-semibold text-white shadow-[0_0_0_0_rgba(212,160,23,0)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-6px_rgba(212,160,23,0.55)] active:translate-y-0"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-12 bg-linear-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-[400%]"
            />
            <span className="relative">{t("apply")}</span>
          </Link>
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
          className="md:hidden inline-flex h-12 w-12 items-center justify-center rounded-md text-foreground hover:bg-muted"
          aria-label={open ? t("close") : t("menu")}
          aria-expanded={open}
        >
          {open ? (
            <X className="h-7 w-7" strokeWidth={1.75} aria-hidden />
          ) : (
            <Menu className="h-7 w-7" strokeWidth={1.75} aria-hidden />
          )}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6">
            {primary.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={`/${locale}/services/incubation/apply`}
              onClick={() => setOpen(false)}
              className="group relative mt-2 inline-flex items-center justify-center overflow-hidden rounded-full bg-linear-to-r from-primary to-accent px-5 py-3 text-sm font-semibold text-white shadow-[0_6px_20px_-8px_rgba(212,160,23,0.55)]"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-12 bg-linear-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-[400%]"
              />
              <span className="relative">{t("apply")}</span>
            </Link>
            <a
              href={ticketsUrl}
              onClick={() => setOpen(false)}
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
                }}
              />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
