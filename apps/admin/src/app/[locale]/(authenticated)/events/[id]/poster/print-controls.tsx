"use client";

import { useEffect } from "react";

export function PosterPrintControls({ autoPrint }: { autoPrint: boolean }) {
  useEffect(() => {
    if (autoPrint) {
      const timer = window.setTimeout(() => window.print(), 400);
      return () => window.clearTimeout(timer);
    }
  }, [autoPrint]);

  return (
    <div className="mt-2 flex items-center gap-3">
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Print poster
      </button>
      <p className="text-xs text-muted-foreground">
        Tip: print on A4 at 100% scale. The QR at this size is scannable from
        ~1.5 m away.
      </p>
    </div>
  );
}
