"use client";

import { useState } from "react";

// Plain, accessible disclosure list. Native <details>/<summary> would work
// too, but this gives us full control over the chevron animation and the
// style alignment with the rest of the funnel's DBC-branded chrome.
export function FunnelFaq({
  title,
  items,
}: {
  title: string;
  items: { q: string; a: string }[];
}) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="bg-neutral-50 py-16 dark:bg-neutral-900/30 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 className="font-heading text-3xl font-bold leading-tight sm:text-4xl">
          {title}
        </h2>
        <ul className="mt-8 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {items.map((item, idx) => {
            const isOpen = open === idx;
            return (
              <li key={idx}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-base font-semibold text-foreground transition-colors hover:bg-muted/50"
                >
                  <span>{item.q}</span>
                  <span
                    aria-hidden
                    className={`shrink-0 text-xl leading-none text-muted-foreground transition-transform ${isOpen ? "rotate-45" : ""}`}
                  >
                    +
                  </span>
                </button>
                {isOpen ? (
                  <div className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
