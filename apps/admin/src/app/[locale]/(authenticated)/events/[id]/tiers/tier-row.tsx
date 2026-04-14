"use client";

import { useActionState, useState } from "react";
import { updateTier, toggleTierPublic, deleteTier } from "@/actions/tiers";

type Tier = {
  id: string;
  name_en: string;
  name_de: string | null;
  name_fr: string | null;
  description_en: string | null;
  description_de: string | null;
  description_fr: string | null;
  price_cents: number;
  max_quantity: number | null;
  quantity_sold: number;
  sales_start_at: string | null;
  sales_end_at: string | null;
  is_public: boolean;
  sort_order: number;
};

function toLocal(iso: string | null) {
  return iso ? iso.slice(0, 16) : "";
}

export function TierRow({
  tier,
  eventId,
  locale,
}: {
  tier: Tier;
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
      const result = await updateTier(tier.id, formData);
      if (result.success) setMode("view");
      return result;
    },
    null
  );

  if (mode === "edit") {
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
            name="name_en"
            defaultValue={tier.name_en}
            placeholder="Name (EN)"
            required
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          />
          <input
            name="name_de"
            defaultValue={tier.name_de ?? ""}
            placeholder="Name (DE)"
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          />
          <input
            name="name_fr"
            defaultValue={tier.name_fr ?? ""}
            placeholder="Name (FR)"
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={(tier.price_cents / 100).toFixed(2)}
            required
            placeholder="Price (€)"
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          />
          <input
            name="max_quantity"
            type="number"
            min="1"
            defaultValue={tier.max_quantity ?? ""}
            placeholder="Max qty (empty=∞)"
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          />
          <input
            name="sort_order"
            type="number"
            defaultValue={tier.sort_order}
            placeholder="Sort"
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            name="sales_start_at"
            type="datetime-local"
            defaultValue={toLocal(tier.sales_start_at)}
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          />
          <input
            name="sales_end_at"
            type="datetime-local"
            defaultValue={toLocal(tier.sales_end_at)}
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <textarea
            name="description_en"
            defaultValue={tier.description_en ?? ""}
            placeholder="Description (EN)"
            rows={2}
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          />
          <textarea
            name="description_de"
            defaultValue={tier.description_de ?? ""}
            placeholder="Description (DE)"
            rows={2}
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          />
          <textarea
            name="description_fr"
            defaultValue={tier.description_fr ?? ""}
            placeholder="Description (FR)"
            rows={2}
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
          <p className="font-medium">{tier.name_en}</p>
          {!tier.is_public && (
            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
              Hidden
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">
          &euro;{(tier.price_cents / 100).toFixed(2)} &middot; {tier.quantity_sold}
          {tier.max_quantity ? ` / ${tier.max_quantity}` : ""} sold
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
            await toggleTierPublic(tier.id, eventId, locale);
          }}
        >
          <button
            type="submit"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {tier.is_public ? "Hide" : "Publish"}
          </button>
        </form>
        <form
          action={async () => {
            if (!confirm(`Delete tier "${tier.name_en}"?`)) return;
            await deleteTier(tier.id, eventId, locale);
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
