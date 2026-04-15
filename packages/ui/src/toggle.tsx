"use client";

import * as React from "react";
import { cn } from "./utils";

export interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  id?: string;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Universal on/off switch. Use this instead of native checkboxes for any
 * setting that the user can flip. Accessible via role="switch" + space/enter.
 */
export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
  id,
  size = "md",
  className,
}: ToggleProps) {
  const autoId = React.useId();
  const switchId = id ?? autoId;
  const trackSize =
    size === "sm" ? "h-5 w-9" : "h-6 w-11";
  const thumbSize =
    size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const thumbOffset =
    size === "sm"
      ? checked
        ? "translate-x-4"
        : "translate-x-0.5"
      : checked
        ? "translate-x-5"
        : "translate-x-0.5";

  const control = (
    <button
      id={switchId}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        "relative inline-flex shrink-0 cursor-pointer rounded-full border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        trackSize,
        checked ? "bg-primary" : "bg-muted"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none inline-block translate-y-0.5 rounded-full bg-background shadow transition-transform",
          thumbSize,
          thumbOffset
        )}
      />
    </button>
  );

  if (!label && !description) {
    return <span className={className}>{control}</span>;
  }

  return (
    <div className={cn("flex items-start gap-3", className)}>
      {control}
      <label
        htmlFor={switchId}
        className={cn(
          "min-w-0 cursor-pointer select-none",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        {label && (
          <span className="block text-sm font-medium text-foreground">
            {label}
          </span>
        )}
        {description && (
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {description}
          </span>
        )}
      </label>
    </div>
  );
}
