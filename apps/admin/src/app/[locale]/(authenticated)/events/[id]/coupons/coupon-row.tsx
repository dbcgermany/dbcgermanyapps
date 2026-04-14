"use client";

import { useActionState, useState } from "react";
import {
  updateCoupon,
  deleteCoupon,
  toggleCouponActive,
} from "@/actions/coupons";

type Coupon = {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  max_uses: number | null;
  times_used: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
};

function toLocal(iso: string | null) {
  return iso ? iso.slice(0, 16) : "";
}

export function CouponRow({
  coupon,
  eventId,
  locale,
}: {
  coupon: Coupon;
  eventId: string;
  locale: string;
}) {
  const [mode, setMode] = useState<"view" | "edit">("view");

  const [state, formAction, isPending] = useActionState(
    async (
      _prev: { error?: string; success?: boolean } | null,
      formData: FormData
    ) => {
      formData.set("event_id", eventId);
      formData.set("locale", locale);
      const result = await updateCoupon(coupon.id, formData);
      if (result.success) setMode("view");
      return result;
    },
    null
  );

  if (mode === "edit") {
    const displayValue =
      coupon.discount_type === "percentage"
        ? coupon.discount_value
        : (coupon.discount_value / 100).toFixed(2);
    return (
      <form
        action={formAction}
        className="rounded-lg border border-primary/50 bg-muted/30 p-4 space-y-3"
      >
        {state?.error && (
          <div className="rounded-md bg-red-50 p-2 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {state.error}
          </div>
        )}
        <div className="grid gap-2 sm:grid-cols-3">
          <input
            name="code"
            defaultValue={coupon.code}
            required
            placeholder="CODE"
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm font-mono uppercase"
          />
          <select
            name="discount_type"
            defaultValue={coupon.discount_type}
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          >
            <option value="percentage">Percentage (%)</option>
            <option value="fixed_amount">Fixed (€)</option>
          </select>
          <input
            name="discount_value"
            type="number"
            step="0.01"
            min="0"
            defaultValue={displayValue}
            required
            placeholder="Value"
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <input
            name="max_uses"
            type="number"
            min="1"
            defaultValue={coupon.max_uses ?? ""}
            placeholder="Max uses (empty=∞)"
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          />
          <input
            name="valid_from"
            type="datetime-local"
            defaultValue={toLocal(coupon.valid_from)}
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          />
          <input
            name="valid_until"
            type="datetime-local"
            defaultValue={toLocal(coupon.valid_until)}
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setMode("view")}
            className="rounded-md border border-input px-4 py-1.5 text-xs font-medium hover:bg-accent"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-4">
      <div>
        <div className="flex items-center gap-2">
          <code className="rounded bg-muted px-2 py-0.5 text-sm font-mono font-semibold">
            {coupon.code}
          </code>
          {!coupon.is_active && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
              Inactive
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {coupon.discount_type === "percentage"
            ? `${coupon.discount_value}% off`
            : `\u20AC${(coupon.discount_value / 100).toFixed(2)} off`}
          {" \u00B7 "}
          {coupon.times_used}
          {coupon.max_uses ? ` / ${coupon.max_uses}` : ""} used
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setMode("edit")}
          className="text-xs text-primary hover:text-primary/80"
        >
          Edit
        </button>
        <form
          action={async () => {
            await toggleCouponActive(coupon.id, eventId, locale);
          }}
        >
          <button
            type="submit"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {coupon.is_active ? "Deactivate" : "Activate"}
          </button>
        </form>
        <form
          action={async () => {
            if (!confirm(`Delete coupon "${coupon.code}"?`)) return;
            const r = await deleteCoupon(coupon.id, eventId, locale);
            if (r?.error) alert(r.error);
          }}
        >
          <button
            type="submit"
            className="text-xs text-red-500 hover:text-red-700"
          >
            Delete
          </button>
        </form>
      </div>
    </div>
  );
}
