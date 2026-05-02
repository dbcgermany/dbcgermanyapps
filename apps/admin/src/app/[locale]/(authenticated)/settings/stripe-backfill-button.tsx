"use client";

import { useState, useTransition } from "react";
import { backfillStripeIds } from "@/actions/stripe-backfill";

interface BackfillResult {
  tiers: { ok: number; fail: number; skipped: number };
  coupons: { ok: number; fail: number; skipped: number };
}

export function StripeBackfillButton() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<BackfillResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function run() {
    setError(null);
    setResult(null);
    startTransition(async () => {
      try {
        const r = await backfillStripeIds();
        setResult(r);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Backfill failed");
      }
    });
  }

  return (
    <section className="rounded-lg border border-border p-6">
      <h2 className="font-heading text-lg font-semibold">Stripe sync</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Mirror every ticket tier and coupon to Stripe so checkout uses durable
        Product/Price IDs and discount URLs auto-apply. Idempotent — safe to
        rerun. Already-synced rows are skipped.
      </p>
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="mt-4 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
      >
        {pending ? "Syncing…" : "Backfill Stripe IDs"}
      </button>
      {error && (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {result && (
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Tiers</dt>
          <dd>
            {result.tiers.ok} synced · {result.tiers.skipped} skipped ·{" "}
            {result.tiers.fail} failed
          </dd>
          <dt className="text-muted-foreground">Coupons</dt>
          <dd>
            {result.coupons.ok} synced · {result.coupons.skipped} skipped ·{" "}
            {result.coupons.fail} failed
          </dd>
        </dl>
      )}
    </section>
  );
}
