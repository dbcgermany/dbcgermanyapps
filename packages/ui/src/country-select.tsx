"use client";

import * as React from "react";
import { cn } from "./utils";

const COUNTRIES_ISO2: readonly string[] = [
  "AF","AL","DZ","AS","AD","AO","AI","AG","AR","AM","AW","AU","AT","AZ",
  "BS","BH","BD","BB","BY","BE","BZ","BJ","BM","BT","BO","BA","BW","BR",
  "IO","VG","BN","BG","BF","BI","CV","KH","CM","CA","KY","CF","TD","CL",
  "CN","CX","CC","CO","KM","CK","CR","CI","HR","CU","CW","CY","CZ","CD",
  "DK","DJ","DM","DO","EC","EG","SV","GQ","ER","EE","SZ","ET","FK","FO",
  "FJ","FI","FR","GF","PF","GA","GM","GE","DE","GH","GI","GR","GL","GD",
  "GP","GU","GT","GG","GN","GW","GY","HT","HN","HK","HU","IS","IN","ID",
  "IR","IQ","IE","IM","IL","IT","JM","JP","JE","JO","KZ","KE","KI","XK",
  "KW","KG","LA","LV","LB","LS","LR","LY","LI","LT","LU","MO","MG","MW",
  "MY","MV","ML","MT","MH","MQ","MR","MU","YT","MX","FM","MD","MC","MN",
  "ME","MS","MA","MZ","MM","NA","NR","NP","NL","NC","NZ","NI","NE","NG",
  "NU","NF","KP","MK","MP","NO","OM","PK","PW","PS","PA","PG","PY","PE",
  "PH","PN","PL","PT","PR","QA","CG","RE","RO","RU","RW","BL","SH","KN",
  "LC","MF","PM","VC","WS","SM","ST","SA","SN","RS","SC","SL","SG","SX",
  "SK","SI","SB","SO","ZA","KR","SS","ES","LK","SD","SR","SJ","SE","CH",
  "SY","TW","TJ","TZ","TH","TL","TG","TK","TO","TT","TN","TR","TM","TC",
  "TV","UG","UA","AE","GB","US","UY","UZ","VU","VA","VE","VN","WF","EH",
  "YE","ZM","ZW",
];

function buildOptions(locale: string): Array<{ code: string; name: string }> {
  let displayNames: Intl.DisplayNames | null = null;
  try {
    displayNames = new Intl.DisplayNames([locale], { type: "region" });
  } catch {
    displayNames = new Intl.DisplayNames(["en"], { type: "region" });
  }
  const options = COUNTRIES_ISO2.map((code) => ({
    code,
    name: displayNames?.of(code) ?? code,
  }));
  const collator = new Intl.Collator(locale, { sensitivity: "base" });
  options.sort((a, b) => collator.compare(a.name, b.name));
  return options;
}

export interface CountrySelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  /** BCP-47 locale for country-name display. Defaults to "en". */
  locale?: string;
  /** Placeholder shown when value is empty. */
  placeholder?: string;
  /** Visual size to match the Input atom. */
  size?: "sm" | "md";
}

/**
 * ISO-3166-1 alpha-2 country picker. Values are uppercase 2-letter codes.
 * Names are localized via Intl.DisplayNames and alphabetized by the same
 * locale's collator.
 */
export const CountrySelect = React.forwardRef<
  HTMLSelectElement,
  CountrySelectProps
>(function CountrySelect(
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
