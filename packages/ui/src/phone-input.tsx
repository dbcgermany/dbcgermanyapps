"use client";

import * as React from "react";
import { cn } from "./utils";

/**
 * Minimal E.164 phone input. No external dep — keeps bundle light.
 * Users type with or without the leading "+"; on blur we normalize to
 * "+<digits>" and validate length (8–15 digits per ITU-T E.164). Invalid
 * values bubble up via the `onValidityChange` callback so parent forms
 * can gate submit.
 */
export interface PhoneInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "onChange" | "value" | "type" | "size"
  > {
  value: string;
  onChange: (e164: string) => void;
  onValidityChange?: (valid: boolean) => void;
  size?: "sm" | "md";
}

function normalizeE164(raw: string): string {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return "";
  return `+${digits}`;
}

function isValidE164(v: string): boolean {
  if (!v) return true; // empty = valid (optional field)
  return /^\+[1-9]\d{7,14}$/.test(v);
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  function PhoneInput(
    { className, value, onChange, onValidityChange, size = "md", onBlur, ...props },
    ref
  ) {
    const sizeClass = size === "sm" ? "h-9 text-xs" : "h-11 text-sm";

    return (
      <input
        ref={ref}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="+49 30 12345678"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => {
          const normalized = normalizeE164(e.target.value);
          if (normalized !== e.target.value) onChange(normalized);
          onValidityChange?.(isValidE164(normalized));
          onBlur?.(e);
        }}
        className={cn(
          "w-full rounded-md border border-input bg-background px-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50",
          sizeClass,
          className
        )}
        {...props}
      />
    );
  }
);

export { isValidE164, normalizeE164 };
