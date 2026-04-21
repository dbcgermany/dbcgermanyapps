"use client";

import * as React from "react";
import { cn } from "./utils";

export interface DatePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size" | "value" | "onChange"> {
  value?: string | null; // ISO-8601 YYYY-MM-DD or null
  onChange?: (iso: string | null) => void;
  size?: "sm" | "md";
  min?: string;
  max?: string;
}

/**
 * Calendar-based date input. Wraps the native <input type="date"> so we get
 * OS-level pickers on iOS/Android and desktop. Stores + emits ISO-8601 date
 * strings (YYYY-MM-DD) or null.
 */
export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  function DatePicker({ className, value, onChange, size = "md", min, max, ...props }, ref) {
    const sizeClass = size === "sm" ? "h-9 text-xs" : "h-11 text-sm";
    return (
      <input
        ref={ref}
        type="date"
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value || null)}
        min={min}
        max={max}
        className={cn(
          // min-w-0 stops the native calendar-icon widget (iOS Safari in
          // particular) from giving the input an intrinsic width bigger
          // than its flex/grid cell, which was pushing the field past
          // the container edge on mobile.
          "w-full min-w-0 rounded-md border border-input bg-background px-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50",
          sizeClass,
          className
        )}
        {...props}
      />
    );
  }
);
