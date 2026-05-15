"use client";

import { Button } from "@dbc/ui";

/**
 * Print button — wraps window.print() so the print dialog opens with the
 * report ready to "Save as PDF". The `no-print` class hides the button itself
 * from the printed output (CSS rule lives on the parent print page).
 */
export function PrintControls({ printLabel }: { printLabel: string }) {
  return (
    <div className="no-print mb-4 flex justify-end">
      <Button type="button" onClick={() => window.print()}>
        {printLabel}
      </Button>
    </div>
  );
}
