"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, Card, ConfirmDialog } from "@dbc/ui";
import {
  CATERING_CATEGORIES,
  type CateringCategory,
  type CateringMenuItem,
  createCateringMenuItem,
  deleteCateringMenuItem,
  exportCateringSelections,
  toggleCateringMenuItemActive,
  updateCateringMenuItem,
} from "@/actions/catering";

const CATEGORY_LABEL: Record<CateringCategory, string> = {
  starter: "Starters",
  main: "Mains",
  dessert: "Desserts",
  drink_non_alcoholic: "Non-alcoholic drinks",
  drink_alcoholic: "Alcoholic drinks",
  snack: "Snacks",
};

export function CateringMenuClient({
  eventId,
  locale,
  items,
}: {
  eventId: string;
  locale: string;
  items: CateringMenuItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [addOpenForCategory, setAddOpenForCategory] =
    useState<CateringCategory | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const grouped = new Map<CateringCategory, CateringMenuItem[]>();
  for (const cat of CATERING_CATEGORIES) grouped.set(cat, []);
  for (const item of items) {
    grouped.get(item.category)!.push(item);
  }

  function handleAddSubmit(category: CateringCategory, formData: FormData) {
    setFormError(null);
    formData.set("category", category);
    startTransition(async () => {
      const res = await createCateringMenuItem(eventId, formData);
      if (res.error) {
        setFormError(res.error);
        return;
      }
      toast.success("Menu item added");
      setAddOpenForCategory(null);
      router.refresh();
    });
  }

  function handleEditSubmit(itemId: string, formData: FormData) {
    setFormError(null);
    startTransition(async () => {
      const res = await updateCateringMenuItem(itemId, formData);
      if (res.error) {
        setFormError(res.error);
        return;
      }
      toast.success("Saved");
      setEditingId(null);
      router.refresh();
    });
  }

  function handleDelete(itemId: string) {
    startTransition(async () => {
      const res = await deleteCateringMenuItem(itemId);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Deleted");
        router.refresh();
      }
    });
  }

  function handleToggle(itemId: string, currentlyActive: boolean) {
    startTransition(async () => {
      const res = await toggleCateringMenuItemActive(itemId, !currentlyActive);
      if (res.error) toast.error(res.error);
      else router.refresh();
    });
  }

  function handleExport() {
    startTransition(async () => {
      try {
        const rows = await exportCateringSelections(eventId);
        const header = [
          "ticketShortId",
          "attendeeName",
          "attendeeEmail",
          "tierName",
          "tierPurpose",
          "category",
          "itemName",
          "allergens",
          "dietary",
          "notes",
          "selectionCreatedAt",
        ];
        const lines = [header.join(",")];
        for (const r of rows) {
          const cells = [
            r.ticketShortId,
            r.attendeeName,
            r.attendeeEmail,
            r.tierName,
            r.tierPurpose ?? "",
            r.category,
            r.itemName,
            (r.allergens ?? []).join("|"),
            r.dietary,
            r.notes,
            r.selectionCreatedAt,
          ].map((v) => {
            const s = String(v ?? "");
            return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
          });
          lines.push(cells.join(","));
        }
        const csv = lines.join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `catering-${eventId.slice(0, 8)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast.success(`Exported ${rows.length} selection${rows.length === 1 ? "" : "s"}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Export failed");
      }
    });
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {items.length} item{items.length === 1 ? "" : "s"} in this event&apos;s menu
        </p>
        <Button onClick={handleExport} disabled={isPending}>
          Export selections (CSV)
        </Button>
      </div>

      {CATERING_CATEGORIES.map((category) => {
        const rows = grouped.get(category) ?? [];
        return (
          <section key={category}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {CATEGORY_LABEL[category]}
              </h2>
              <button
                type="button"
                onClick={() =>
                  setAddOpenForCategory(
                    addOpenForCategory === category ? null : category
                  )
                }
                className="text-xs font-medium text-primary hover:opacity-80"
              >
                {addOpenForCategory === category ? "Cancel" : "Add item"}
              </button>
            </div>

            {addOpenForCategory === category && (
              <Card padding="md" className="mt-3 rounded-lg">
                <form
                  action={(fd) => handleAddSubmit(category, fd)}
                  className="space-y-3"
                >
                  {formError && (
                    <div className="rounded-md bg-danger-soft p-3 text-sm text-danger">
                      {formError}
                    </div>
                  )}
                  <MenuItemFields locale={locale} />
                  <Button type="submit" disabled={isPending}>
                    Save item
                  </Button>
                </form>
              </Card>
            )}

            {rows.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                No items in this category yet.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {rows.map((item) => {
                  if (editingId === item.id) {
                    return (
                      <Card key={item.id} padding="md" className="rounded-lg border-primary/30">
                        <form
                          action={(fd) => handleEditSubmit(item.id, fd)}
                          className="space-y-3"
                        >
                          {formError && (
                            <div className="rounded-md bg-danger-soft p-3 text-sm text-danger">
                              {formError}
                            </div>
                          )}
                          <MenuItemFields locale={locale} item={item} />
                          <div className="flex gap-2">
                            <Button type="submit" disabled={isPending}>
                              Save
                            </Button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="rounded-md border border-input px-4 py-2 text-sm hover:bg-muted"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </Card>
                    );
                  }
                  return (
                    <Card key={item.id} padding="sm" className="rounded-lg">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium">
                            {item.name_de || item.name_en}
                            {!item.is_active && (
                              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                                Hidden
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.description_de || item.description_en || "—"}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1 text-[10px] uppercase tracking-wide">
                            {item.is_vegetarian && (
                              <span className="rounded bg-success-soft px-1.5 py-0.5 text-success">
                                Veg
                              </span>
                            )}
                            {item.is_vegan && (
                              <span className="rounded bg-success-soft px-1.5 py-0.5 text-success">
                                Vegan
                              </span>
                            )}
                            {item.is_halal && (
                              <span className="rounded bg-success-soft px-1.5 py-0.5 text-success">
                                Halal
                              </span>
                            )}
                            {(item.allergens ?? []).map((a) => (
                              <span
                                key={a}
                                className="rounded bg-warning-soft px-1.5 py-0.5 text-warning"
                              >
                                {a}
                              </span>
                            ))}
                          </div>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {item.selections_count} selected
                            {item.max_selections_per_event != null
                              ? ` / ${item.max_selections_per_event} cap`
                              : ""}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => {
                              setFormError(null);
                              setEditingId(item.id);
                            }}
                            className="text-primary hover:opacity-80"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggle(item.id, item.is_active)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            {item.is_active ? "Hide" : "Show"}
                          </button>
                          <ConfirmDialog
                            trigger={
                              <button type="button" className="text-danger hover:opacity-80">
                                Delete
                              </button>
                            }
                            title="Delete menu item"
                            description={`Permanently delete "${item.name_de || item.name_en}". Only allowed when no guest has selected it; otherwise hide instead.`}
                            variant="danger"
                            confirmLabel="Delete"
                            onConfirm={() => handleDelete(item.id)}
                          />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function MenuItemFields({
  item,
}: {
  locale: string;
  item?: CateringMenuItem;
}) {
  const inputClass =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">
            Name (EN)
          </label>
          <input
            name="name_en"
            type="text"
            required
            defaultValue={item?.name_en ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">
            Name (DE)
          </label>
          <input
            name="name_de"
            type="text"
            defaultValue={item?.name_de ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">
            Name (FR)
          </label>
          <input
            name="name_fr"
            type="text"
            defaultValue={item?.name_fr ?? ""}
            className={inputClass}
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">
            Description (EN)
          </label>
          <textarea
            name="description_en"
            defaultValue={item?.description_en ?? ""}
            rows={2}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">
            Description (DE)
          </label>
          <textarea
            name="description_de"
            defaultValue={item?.description_de ?? ""}
            rows={2}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">
            Description (FR)
          </label>
          <textarea
            name="description_fr"
            defaultValue={item?.description_fr ?? ""}
            rows={2}
            className={inputClass}
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">
            Allergens (comma-separated)
          </label>
          <input
            name="allergens"
            type="text"
            defaultValue={(item?.allergens ?? []).join(", ")}
            placeholder="gluten, nuts, soy"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">
            Max selections (blank = unlimited)
          </label>
          <input
            name="max_selections_per_event"
            type="number"
            min="0"
            defaultValue={item?.max_selections_per_event ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">
            Sort order
          </label>
          <input
            name="sort_order"
            type="number"
            defaultValue={item?.sort_order ?? 0}
            className={inputClass}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="hidden" name="is_vegetarian" value="false" />
          <input
            type="checkbox"
            name="is_vegetarian"
            value="true"
            defaultChecked={!!item?.is_vegetarian}
            className="accent-primary"
          />
          Vegetarian
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="hidden" name="is_vegan" value="false" />
          <input
            type="checkbox"
            name="is_vegan"
            value="true"
            defaultChecked={!!item?.is_vegan}
            className="accent-primary"
          />
          Vegan
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="hidden" name="is_halal" value="false" />
          <input
            type="checkbox"
            name="is_halal"
            value="true"
            defaultChecked={!!item?.is_halal}
            className="accent-primary"
          />
          Halal
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="hidden" name="is_active" value="false" />
          <input
            type="checkbox"
            name="is_active"
            value="true"
            defaultChecked={item ? item.is_active : true}
            className="accent-primary"
          />
          Active (shown to guests)
        </label>
      </div>
    </>
  );
}
