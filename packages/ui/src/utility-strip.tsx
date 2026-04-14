"use client";

import { LocaleSwitch } from "./locale-switch";
import { ThemeToggle } from "./theme-toggle";

type Labels = { light: string; dark: string; system: string };

/**
 * Shared "user preferences" strip: locale switcher + theme toggle.
 * Use this anywhere the two belong together (site header, tickets top bar,
 * admin shell). Single SSOT for the chrome; if you change the look or order,
 * change it here and every surface updates.
 */
export function UtilityStrip({
  currentLocale,
  themeLabels,
  locales,
  className = "",
}: {
  currentLocale: string;
  themeLabels?: Labels;
  locales?: readonly string[];
  className?: string;
}) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <LocaleSwitch currentLocale={currentLocale} locales={locales} />
      <ThemeToggle labels={themeLabels} />
    </div>
  );
}
