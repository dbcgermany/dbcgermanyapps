"use client";

import * as React from "react";
import { cn } from "./utils";
import { CountrySelect } from "./country-select";

export interface Address {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string; // ISO-3166-1 alpha-2
}

export const EMPTY_ADDRESS: Address = {
  line1: "",
  line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "",
};

export interface AddressFieldsProps {
  value: Address;
  onChange: (next: Address) => void;
  /** BCP-47 locale used to localize country names + label text. */
  locale?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

const LABELS = {
  en: {
    line1: "Address line 1",
    line2: "Address line 2 (optional)",
    city: "City",
    state: "State / region",
    postal_code: "Postal code",
    country: "Country",
  },
  de: {
    line1: "Stra\u00dfe und Hausnummer",
    line2: "Adresszusatz (optional)",
    city: "Stadt",
    state: "Bundesland / Region",
    postal_code: "PLZ",
    country: "Land",
  },
  fr: {
    line1: "Adresse (ligne 1)",
    line2: "Adresse (ligne 2, optionnelle)",
    city: "Ville",
    state: "R\u00e9gion / d\u00e9partement",
    postal_code: "Code postal",
    country: "Pays",
  },
} as const;

/**
 * Google/Stripe-style address composite. Emits one Address object. Country is
 * stored as an ISO-3166-1 alpha-2 code via the shared CountrySelect.
 */
export function AddressFields({
  value,
  onChange,
  locale = "en",
  disabled,
  required,
  className,
}: AddressFieldsProps) {
  const key = (locale === "de" || locale === "fr" ? locale : "en") as
    | "en"
    | "de"
    | "fr";
  const t = LABELS[key];

  const set =
    <K extends keyof Address>(field: K) =>
    (raw: string) =>
      onChange({ ...value, [field]: raw });

  const inputClass =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50";

  return (
    <div className={cn("grid gap-3", className)}>
      <Field label={t.line1} required={required}>
        <input
          type="text"
          autoComplete="address-line1"
          value={value.line1}
          disabled={disabled}
          required={required}
          onChange={(e) => set("line1")(e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label={t.line2}>
        <input
          type="text"
          autoComplete="address-line2"
          value={value.line2}
          disabled={disabled}
          onChange={(e) => set("line2")(e.target.value)}
          className={inputClass}
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t.city} required={required}>
          <input
            type="text"
            autoComplete="address-level2"
            value={value.city}
            disabled={disabled}
            required={required}
            onChange={(e) => set("city")(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label={t.state}>
          <input
            type="text"
            autoComplete="address-level1"
            value={value.state}
            disabled={disabled}
            onChange={(e) => set("state")(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t.postal_code} required={required}>
          <input
            type="text"
            autoComplete="postal-code"
            value={value.postal_code}
            disabled={disabled}
            required={required}
            onChange={(e) => set("postal_code")(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label={t.country} required={required}>
          <CountrySelect
            locale={key}
            value={value.country}
            disabled={disabled}
            required={required}
            autoComplete="country"
            placeholder="—"
            onChange={(e) => set("country")(e.target.value)}
          />
        </Field>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}
