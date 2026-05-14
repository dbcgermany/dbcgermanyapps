"use client";

import * as React from "react";
import { Input, FormField } from "./atoms";
import { CountrySelect } from "./country-select";
import {
  BirthdayField,
  NameFields,
  TitleGenderFields,
} from "./person-fields-inputs";
import type { Gender, Title } from "./person-fields";
import { cn } from "./utils";

/* -------------------------------------------------------------------------- */
/*                              AttendeeIdentity                              */
/* -------------------------------------------------------------------------- */

/**
 * Canonical shape for an attendee/contact identity collected at any DBC
 * touchpoint — public checkout, admin manual sale, future imports. Mirrors
 * the column shape on `contacts` + `tickets.attendee_*` so the two flows
 * produce byte-identical rows.
 */
export interface AttendeeIdentity {
  first_name: string;
  last_name: string;
  email: string;
  country: string;          // ISO-3166-1 alpha-2
  title: Title | "";
  gender: Gender | "";
  birthday: string;         // ISO YYYY-MM-DD (DatePicker emits this)
  occupation: string;
  address_line_1: string;
  address_line_2: string;
  postal_code: string;
  city: string;
}

export const EMPTY_ATTENDEE_IDENTITY: AttendeeIdentity = {
  first_name: "",
  last_name: "",
  email: "",
  country: "",
  title: "",
  gender: "",
  birthday: "",
  occupation: "",
  address_line_1: "",
  address_line_2: "",
  postal_code: "",
  city: "",
};

export interface AttendeeIdentityLabels {
  firstName: string;
  lastName: string;
  email: string;
  emailHint?: string;
  country: string;
  countryPlaceholder?: string;
  addOptional: string;
  hideOptional: string;
  optionalCaption?: string;
  title: string;
  gender: string;
  birthday: string;
  occupation: string;
  streetAddress: string;
  addressLine2: string;
  postalCode: string;
  city: string;
  titleOptions: Record<Title, string>;
  genderOptions: Record<Gender, string>;
}

export interface AttendeeIdentityFieldsProps {
  value: AttendeeIdentity;
  onChange: (next: AttendeeIdentity) => void;
  locale: string;
  showOptional: boolean;
  onShowOptionalChange: (next: boolean) => void;
  labels: AttendeeIdentityLabels;
  /** Default true. When false the four required fields drop their HTML5
   *  required attribute (used on edit forms that allow partial updates). */
  required?: boolean;
  className?: string;
  /** Autofocus the first-name input on mount. */
  autoFocus?: boolean;
}

/* -------------------------------------------------------------------------- */
/*                          AttendeeIdentityFields                            */
/* -------------------------------------------------------------------------- */

/**
 * SSOT molecule for collecting an attendee/contact identity. Used by the
 * public ticket checkout AND the admin door/advance-sale form so the two
 * flows expose the same fields, in the same order, with the same atoms —
 * and the resulting `contacts` row + `tickets.attendee_*` columns are
 * indistinguishable from each other.
 *
 * The molecule is i18n-agnostic: callers pass their localized strings via
 * the `labels` prop (same convention as `NameFields` / `AddressFields`).
 * The atoms write their own `name="..."` hidden inputs (first_name,
 * last_name, title, gender, birthday) so a plain `<form action={...}>`
 * submit delivers the right FormData keys without extra wiring. Multi-
 * attendee forms (public checkout) read controlled state directly off
 * `value` and ignore the hidden inputs.
 */
export function AttendeeIdentityFields({
  value,
  onChange,
  locale,
  showOptional,
  onShowOptionalChange,
  labels,
  required = true,
  className,
  autoFocus,
}: AttendeeIdentityFieldsProps) {
  const set = React.useCallback(
    <K extends keyof AttendeeIdentity>(field: K) =>
      (next: AttendeeIdentity[K]) =>
        onChange({ ...value, [field]: next }),
    [value, onChange]
  );

  return (
    <div className={cn("space-y-4", className)}>
      {/* Country — required, always visible, single canonical picker. */}
      <FormField label={labels.country} required={required}>
        <CountrySelect
          name="country"
          locale={locale}
          value={value.country}
          required={required}
          autoComplete="country"
          placeholder={labels.countryPlaceholder ?? "—"}
          onChange={(e) => set("country")(e.target.value)}
        />
      </FormField>

      {/* First + last name — required. Default name="first_name|last_name". */}
      <NameFields
        firstNameLabel={labels.firstName}
        lastNameLabel={labels.lastName}
        firstName={value.first_name}
        lastName={value.last_name}
        onFirstNameChange={set("first_name")}
        onLastNameChange={set("last_name")}
        required={required}
        autoFocus={autoFocus}
      />

      {/* Email — required, with optional hint below. */}
      <FormField label={labels.email} hint={labels.emailHint} required={required}>
        <Input
          type="email"
          name="email"
          autoComplete="email"
          required={required}
          value={value.email}
          onChange={(e) => set("email")(e.target.value)}
        />
      </FormField>

      {/* Optional details — collapsed by default. Mirrors the public
          checkout's `+ More details (optional)` toggle exactly. */}
      <div>
        <button
          type="button"
          onClick={() => onShowOptionalChange(!showOptional)}
          className="text-sm font-medium text-primary hover:underline"
        >
          {showOptional ? labels.hideOptional : labels.addOptional}
        </button>
        {showOptional && (
          <div className="mt-3 space-y-4 rounded-md border border-border bg-muted/20 p-4">
            {labels.optionalCaption && (
              <p className="text-[11px] leading-snug text-muted-foreground">
                {labels.optionalCaption}
              </p>
            )}
            <TitleGenderFields
              title={value.title}
              gender={value.gender}
              onTitleChange={set("title")}
              onGenderChange={set("gender")}
              titleLabel={labels.title}
              genderLabel={labels.gender}
              titleOptionLabels={labels.titleOptions}
              genderOptionLabels={labels.genderOptions}
            />
            <BirthdayField
              value={value.birthday}
              onChange={(iso) => set("birthday")(iso ?? "")}
              label={labels.birthday}
            />
            <FormField label={labels.occupation}>
              <Input
                type="text"
                name="occupation"
                value={value.occupation}
                onChange={(e) => set("occupation")(e.target.value)}
              />
            </FormField>
            <FormField label={labels.streetAddress}>
              <Input
                type="text"
                name="address_line_1"
                autoComplete="address-line1"
                value={value.address_line_1}
                onChange={(e) => set("address_line_1")(e.target.value)}
              />
            </FormField>
            <FormField label={labels.addressLine2}>
              <Input
                type="text"
                name="address_line_2"
                autoComplete="address-line2"
                value={value.address_line_2}
                onChange={(e) => set("address_line_2")(e.target.value)}
              />
            </FormField>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label={labels.postalCode}>
                <Input
                  type="text"
                  name="postal_code"
                  autoComplete="postal-code"
                  value={value.postal_code}
                  onChange={(e) => set("postal_code")(e.target.value)}
                />
              </FormField>
              <FormField label={labels.city}>
                <Input
                  type="text"
                  name="city"
                  autoComplete="address-level2"
                  value={value.city}
                  onChange={(e) => set("city")(e.target.value)}
                />
              </FormField>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
