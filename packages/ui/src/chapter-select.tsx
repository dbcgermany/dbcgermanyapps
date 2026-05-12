"use client";

import * as React from "react";
import { cn } from "./utils";

// Constrained ISO-3166-1 alpha-2 list — only the 10 countries where a DBC
// chapter currently exists. Update here when chapters are added so the
// chapter-delegate registration form, admin filters, and reports all stay
// in sync.
export const DBC_CHAPTER_COUNTRY_CODES = [
  "DE", // Germany
  "FR", // France
  "CA", // Canada
  "BE", // Belgium
  "GA", // Gabon
  "CD", // Democratic Republic of the Congo
  "SN", // Senegal
  "US", // United States
  "ZA", // South Africa
  "CI", // Ivory Coast
] as const;

export type DbcChapterCountry = (typeof DBC_CHAPTER_COUNTRY_CODES)[number];

/**
 * Build the "DBC <Country>" label for a chapter code. Single source of truth
 * for every place chapter names render — admin filters, dropdowns, list cells,
 * email subjects, scanner badges. If you ever rename a chapter, do it here.
 */
export function dbcChapterLabel(code: string, locale = "en"): string {
  let displayNames: Intl.DisplayNames | null = null;
  try {
    displayNames = new Intl.DisplayNames([locale], { type: "region" });
  } catch {
    displayNames = new Intl.DisplayNames(["en"], { type: "region" });
  }
  const country = displayNames?.of(code.toUpperCase()) ?? code.toUpperCase();
  return `DBC ${country}`;
}

/**
 * Flag emoji for an ISO-3166 alpha-2 code (purely visual, no semantic role).
 */
export function chapterFlag(code: string | null): string {
  if (!code) return "";
  const upper = code.toUpperCase();
  if (upper.length !== 2) return "";
  return upper
    .split("")
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join("");
}

function buildOptions(locale: string) {
  const options = DBC_CHAPTER_COUNTRY_CODES.map((code) => ({
    code,
    name: dbcChapterLabel(code, locale),
  }));
  const collator = new Intl.Collator(locale, { sensitivity: "base" });
  options.sort((a, b) => collator.compare(a.name, b.name));
  return options;
}

export interface ChapterSelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  locale?: string;
  placeholder?: string;
  size?: "sm" | "md";
}

export const ChapterSelect = React.forwardRef<
  HTMLSelectElement,
  ChapterSelectProps
>(function ChapterSelect(
  { className, locale = "en", placeholder, size = "md", ...props },
  ref
) {
  const options = React.useMemo(() => buildOptions(locale), [locale]);
  const sizeClass = size === "sm" ? "h-9 text-xs" : "h-11 text-sm";
  return (
    <select
      ref={ref}
      className={cn(
        "w-full rounded-md border border-input bg-background px-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50",
        sizeClass,
        className
      )}
      {...props}
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.code} value={o.code}>
          {o.name}
        </option>
      ))}
    </select>
  );
});
