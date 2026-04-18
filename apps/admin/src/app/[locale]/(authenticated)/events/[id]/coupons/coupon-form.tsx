"use client";

import { useActionState } from "react";
import { createCoupon } from "@/actions/coupons";

export function CouponForm({
  eventId,
  locale,
  tiers,
}: {
  eventId: string;
  locale: string;
  tiers: { id: string; name: string }[];
}) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      formData.set("event_id", eventId);
      formData.set("locale", locale);
      return createCoupon(formData);
    },
    null
  );

  return (
    <form action={formAction} className="mt-4 space-y-4">
      {state?.error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
          Coupon created successfully.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="code" className="block text-xs text-muted-foreground mb-1">
            Code
          </label>
          <input
            id="code"
            name="code"
            type="text"
            required
            placeholder="EARLYBIRD20"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="discount_type" className="block text-xs text-muted-foreground mb-1">
            Type
          </label>
          <select
            id="discount_type"
            name="discount_type"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="percentage">Percentage (%)</option>
            <option value="fixed_amount">Fixed amount (&euro;)</option>
          </select>
        </div>
        <div>
          <label htmlFor="discount_value" className="block text-xs text-muted-foreground mb-1">
            Value
          </label>
          <input
            id="discount_value"
            name="discount_value"
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="20"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="max_uses" className="block text-xs text-muted-foreground mb-1">
            Max uses (empty = unlimited)
          </label>
          <input
            id="max_uses"
            name="max_uses"
            type="number"
            min="1"
            placeholder="100"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="valid_from" className="block text-xs text-muted-foreground mb-1">
            Valid from (optional)
          </label>
          <input
            id="valid_from"
            name="valid_from"
            type="datetime-local"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="valid_until" className="block text-xs text-muted-foreground mb-1">
            Valid until (optional)
          </label>
          <input
            id="valid_until"
            name="valid_until"
            type="datetime-local"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {tiers.length > 0 && (
        <div>
          <label className="mb-1.5 block text-xs text-muted-foreground">
            Applies to tiers
            <span className="ml-1 text-muted-foreground/70">
              (leave empty = all tiers)
            </span>
          </label>
          <div className="grid gap-2 rounded-md border border-input bg-background p-3 sm:grid-cols-2">
            {tiers.map((t) => (
              <label
                key={t.id}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  name="applicable_tier_ids"
                  value={t.id}
                  className="accent-primary"
                />
                {t.name}
              </label>
            ))}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? "Creating..." : "Create Coupon"}
      </button>
    </form>
  );
}
