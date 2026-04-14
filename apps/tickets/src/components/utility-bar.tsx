"use client";

import { LocaleSwitch, ThemeToggle } from "@dbc/ui";

export function UtilityBar({ locale }: { locale: string }) {
  return (
    <div className="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-full border border-border bg-background/80 px-1 py-1 shadow-sm backdrop-blur">
      <LocaleSwitch currentLocale={locale} className="border-0 bg-transparent" />
      <ThemeToggle className="border-0 bg-transparent" />
    </div>
  );
}
