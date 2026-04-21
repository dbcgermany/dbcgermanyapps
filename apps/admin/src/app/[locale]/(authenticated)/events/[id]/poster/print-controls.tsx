"use client";

import { useEffect } from "react";
import { Button } from "@dbc/ui";

export function PosterPrintControls({ autoPrint }: { autoPrint: boolean }) {
  useEffect(() => {
    if (autoPrint) {
      const timer = window.setTimeout(() => window.print(), 400);
      return () => window.clearTimeout(timer);
    }
  }, [autoPrint]);

  return (
    <div className="mt-2 flex items-center gap-3">
      <Button type="button" onClick={() => window.print()}>
        Print poster
      </Button>
      <p className="text-xs text-muted-foreground">
        Tip: print on A4 at 100% scale. The QR at this size is scannable from
        ~1.5 m away.
      </p>
    </div>
  );
}
