"use client";

import * as React from "react";
import { Input, Label, FormField } from "./atoms";
import { DatePicker } from "./date-picker";
import { cn } from "./utils";
import {
  GENDER_VALUES,
  TITLE_VALUES,
  impliedGenderFromTitle,
  type Gender,
  type Title,
} from "./person-fields";

/* -------------------------------------------------------------------------- */
/*                                 NameFields                                 */
/* -------------------------------------------------------------------------- */

export interface NameFieldsProps {
  firstName?: string;
  lastName?: string;
  onFirstNameChange?: (value: string) => void;
  onLastNameChange?: (value: string) => void;
  firstNameLabel: string;
  lastNameLabel: string;
  firstNameName?: string;
  lastNameName?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  autoFocus?: boolean;
}

export function NameFields({
  firstName,
  lastName,
  onFirstNameChange,
  onLastNameChange,
  firstNameLabel,
  lastNameLabel,
  firstNameName = "first_name",
  lastNameName = "last_name",
  required,
  disabled,
  className,
  autoFocus,
}: NameFieldsProps) {
  const controlled = onFirstNameChange !== undefined || onLastNameChange !== undefined;
  return (
    <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", className)}>
      <FormField label={firstNameLabel} required={required}>
        <Input
          name={firstNameName}
          type="text"
          autoComplete="given-name"
          autoFocus={autoFocus}
          required={required}
          disabled={disabled}
          {...(controlled
            ? {
                value: firstName ?? "",
                onChange: (e) => onFirstNameChange?.(e.target.value),
              }
            : { defaultValue: firstName ?? "" })}
        />
      </FormField>
      <FormField label={lastNameLabel} required={required}>
        <Input
          name={lastNameName}
          type="text"
          autoComplete="family-name"
          required={required}
          disabled={disabled}
          {...(controlled
            ? {
                value: lastName ?? "",
                onChange: (e) => onLastNameChange?.(e.target.value),
              }
            : { defaultValue: lastName ?? "" })}
        />
      </FormField>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                            TitleGenderFields                               */
/* -------------------------------------------------------------------------- */

export interface TitleGenderFieldsProps {
  title?: Title | "";
  gender?: Gender | "";
  onTitleChange?: (title: Title | "") => void;
  onGenderChange?: (gender: Gender | "") => void;
  titleLabel: string;
  genderLabel: string;
  titleOptionLabels: Record<Title, string>;
  genderOptionLabels: Record<Gender, string>;
  titleName?: string;
  genderName?: string;
  className?: string;
  disabled?: boolean;
  allowEmpty?: boolean;
  emptyLabel?: string;
}

/**
 * Renders a coupled title + gender pair. If the user picks a gendered title
 * (mr / ms / mrs), the gender is forced to the implied value and the gender
 * control is locked. Neutral honorifics (dr, prof, mx, excellency, …) leave
 * the gender control free.
 */
export function TitleGenderFields({
  title,
  gender,
  onTitleChange,
  onGenderChange,
  titleLabel,
  genderLabel,
  titleOptionLabels,
  genderOptionLabels,
  titleName = "title",
  genderName = "gender",
  className,
  disabled,
  allowEmpty = true,
  emptyLabel = "—",
}: TitleGenderFieldsProps) {
  const controlled = onTitleChange !== undefined || onGenderChange !== undefined;
  const [localTitle, setLocalTitle] = React.useState<Title | "">(title ?? "");
  const [localGender, setLocalGender] = React.useState<Gender | "">(gender ?? "");
  const currentTitle = controlled ? title ?? "" : localTitle;
  const currentGender = controlled ? gender ?? "" : localGender;

  const implied = impliedGenderFromTitle(currentTitle === "" ? null : (currentTitle as Title));
  const effectiveGender: Gender | "" = implied ?? currentGender;
  const genderLocked = implied !== null;

  React.useEffect(() => {
    if (implied && currentGender !== implied) {
      if (onGenderChange) onGenderChange(implied);
      else setLocalGender(implied);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [implied]);

  return (
    <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", className)}>
      <FormField label={titleLabel}>
        <select
          name={titleName}
          value={currentTitle}
          disabled={disabled}
          onChange={(e) => {
            const next = (e.target.value || "") as Title | "";
            if (onTitleChange) onTitleChange(next);
            else setLocalTitle(next);
          }}
          className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        >
          {allowEmpty && <option value="">{emptyLabel}</option>}
          {TITLE_VALUES.map((v) => (
            <option key={v} value={v}>
              {titleOptionLabels[v]}
            </option>
          ))}
        </select>
      </FormField>
      <FormField
        label={genderLabel}
        hint={genderLocked ? undefined : undefined}
      >
        <select
          name={genderName}
          value={effectiveGender}
          disabled={disabled || genderLocked}
          onChange={(e) => {
            const next = (e.target.value || "") as Gender | "";
            if (onGenderChange) onGenderChange(next);
            else setLocalGender(next);
          }}
          className={cn(
            "h-11 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60",
            genderLocked && "cursor-not-allowed bg-muted"
          )}
        >
          {allowEmpty && <option value="">{emptyLabel}</option>}
          {GENDER_VALUES.map((v) => (
            <option key={v} value={v}>
              {genderOptionLabels[v]}
            </option>
          ))}
        </select>
      </FormField>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                BirthdayField                               */
/* -------------------------------------------------------------------------- */

export interface BirthdayFieldProps {
  value?: string | null;
  onChange?: (iso: string | null) => void;
  label: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  max?: string;
}

export function BirthdayField({
  value,
  onChange,
  label,
  name = "birthday",
  required,
  disabled,
  className,
  max,
}: BirthdayFieldProps) {
  const controlled = onChange !== undefined;
  const [local, setLocal] = React.useState<string>(value ?? "");
  const current = controlled ? value ?? "" : local;

  return (
    <div className={className}>
      <Label required={required}>{label}</Label>
      <DatePicker
        value={current}
        onChange={(iso) => {
          if (controlled) onChange?.(iso);
          else setLocal(iso ?? "");
        }}
        required={required}
        disabled={disabled}
        max={max}
      />
      <input type="hidden" name={name} value={current} />
    </div>
  );
}
