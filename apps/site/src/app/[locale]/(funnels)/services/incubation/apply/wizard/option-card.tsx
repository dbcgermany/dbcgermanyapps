"use client";

import type { ReactNode } from "react";

// Big tappable choice card used by the wizard's single-choice and
// multi-select questions. Replaces traditional radio/checkbox inputs
// with a full-width press target (matches the 44 px min tap-target
// rule). Selected state highlights in DBC primary.
export function OptionCard({
  title,
  description,
  selected,
  onSelect,
  trailing,
  type = "button",
}: {
  title: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
  trailing?: ReactNode;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onSelect}
      aria-pressed={selected}
      className={`group relative flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all sm:p-5 ${
        selected
          ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary"
          : "border-border bg-card hover:border-primary/40 hover:bg-muted/40"
      }`}
    >
      <span
        aria-hidden
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          selected
            ? "border-primary bg-primary"
            : "border-border bg-transparent group-hover:border-primary/40"
        }`}
      >
        {selected ? (
          <span className="h-2 w-2 rounded-full bg-primary-foreground" />
        ) : null}
      </span>
      <span className="flex-1">
        <span className="block text-base font-semibold leading-tight text-foreground">
          {title}
        </span>
        {description ? (
          <span className="mt-1 block text-sm text-muted-foreground">
            {description}
          </span>
        ) : null}
      </span>
      {trailing}
    </button>
  );
}
