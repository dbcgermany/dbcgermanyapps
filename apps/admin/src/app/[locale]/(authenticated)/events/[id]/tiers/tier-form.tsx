"use client";

import { useActionState } from "react";
import { createTier } from "@/actions/tiers";

export function TierForm({
  eventId,
  locale,
}: {
  eventId: string;
  locale: string;
}) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      formData.set("event_id", eventId);
      formData.set("locale", locale);
      return createTier(formData);
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
          Tier created successfully.
        </div>
      )}

      {/* Names */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="name_en" className="block text-xs text-muted-foreground mb-1">
            Name (EN)
          </label>
          <input
            id="name_en"
            name="name_en"
            type="text"
            required
            placeholder="e.g., Early Bird"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="name_de" className="block text-xs text-muted-foreground mb-1">
            Name (DE)
          </label>
          <input
            id="name_de"
            name="name_de"
            type="text"
            placeholder="e.g., Fr\u00fchbucher"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="name_fr" className="block text-xs text-muted-foreground mb-1">
            Name (FR)
          </label>
          <input
            id="name_fr"
            name="name_fr"
            type="text"
            placeholder="e.g., Pr\u00e9vente"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Price & Quantity */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="price" className="block text-xs text-muted-foreground mb-1">
            Price (&euro;)
          </label>
          <input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="49.00"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="max_quantity" className="block text-xs text-muted-foreground mb-1">
            Max quantity (empty = unlimited)
          </label>
          <input
            id="max_quantity"
            name="max_quantity"
            type="number"
            min="1"
            placeholder="200"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="sort_order" className="block text-xs text-muted-foreground mb-1">
            Sort order
          </label>
          <input
            id="sort_order"
            name="sort_order"
            type="number"
            defaultValue="0"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Sale dates */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="sales_start_at" className="block text-xs text-muted-foreground mb-1">
            Sales start (optional)
          </label>
          <input
            id="sales_start_at"
            name="sales_start_at"
            type="datetime-local"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="sales_end_at" className="block text-xs text-muted-foreground mb-1">
            Sales end (optional)
          </label>
          <input
            id="sales_end_at"
            name="sales_end_at"
            type="datetime-local"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Visibility */}
      <div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="hidden"
            name="is_public"
            value="false"
          />
          <input
            type="checkbox"
            name="is_public"
            value="true"
            defaultChecked
            className="accent-primary"
          />
          Public tier (visible on event page)
        </label>
        <p className="ml-6 text-xs text-muted-foreground">
          Uncheck for invite-only / team / partner tiers
        </p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? "Adding..." : "Add Tier"}
      </button>
    </form>
  );
}
