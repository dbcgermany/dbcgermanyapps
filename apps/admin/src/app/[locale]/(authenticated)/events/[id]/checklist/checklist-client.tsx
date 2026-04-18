"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@dbc/ui";
import {
  createChecklistItem,
  toggleChecklistStatus,
  deleteChecklistItem,
  populateChecklistFromTemplate,
  type ChecklistItem,
} from "@/actions/checklist";

const CATEGORIES = [
  "all",
  "venue",
  "marketing",
  "production",
  "finance",
  "logistics",
  "staffing",
  "content",
  "other",
] as const;

const STATUS_CYCLE: Record<string, "pending" | "in_progress" | "done"> = {
  pending: "in_progress",
  in_progress: "done",
  done: "pending",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "border-border",
  in_progress: "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10",
  done: "border-green-400 bg-green-50 dark:bg-green-900/10",
  skipped: "border-muted opacity-50",
};

interface Props {
  eventId: string;
  items: ChecklistItem[];
  progress: {
    total: number;
    done: number;
    overdue: number;
    categories: Record<string, { total: number; done: number; overdue: number }>;
    estimatedCostCents: number;
    actualCostCents: number;
  };
  staff: { id: string; name: string }[];
  locale: string;
  eventStartsAt: string;
}

export function ChecklistClient({
  eventId,
  items,
  progress,
  staff,
  locale,
  eventStartsAt,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeCategory, setActiveCategory] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const filtered =
    activeCategory === "all"
      ? items
      : items.filter((i) => i.category === activeCategory);

  const overdue = filtered.filter(
    (i) =>
      i.due_date &&
      i.due_date < today &&
      i.status !== "done" &&
      i.status !== "skipped"
  );
  const upcoming = filtered.filter(
    (i) => !overdue.includes(i) && i.status !== "done" && i.status !== "skipped"
  );
  const completed = filtered.filter(
    (i) => i.status === "done" || i.status === "skipped"
  );

  const pct =
    progress.total > 0
      ? Math.round((progress.done / progress.total) * 100)
      : 0;

  function handleToggle(item: ChecklistItem) {
    const next = STATUS_CYCLE[item.status] ?? "pending";
    startTransition(async () => {
      await toggleChecklistStatus(item.id, next, eventId, locale);
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this checklist item?")) return;
    startTransition(async () => {
      await deleteChecklistItem(id, eventId, locale);
      router.refresh();
    });
  }

  function handleAdd(formData: FormData) {
    formData.set("locale", locale);
    startTransition(async () => {
      const res = await createChecklistItem(eventId, formData);
      if (res.success) {
        setShowAddForm(false);
        router.refresh();
      }
    });
  }

  function handlePopulate() {
    if (
      !confirm(
        "Populate checklist from default template? This adds all template items."
      )
    )
      return;
    startTransition(async () => {
      await populateChecklistFromTemplate(eventId, eventStartsAt, locale);
      router.refresh();
    });
  }

  function fmtCost(cents: number) {
    return `\u20AC${(cents / 100).toLocaleString(locale, { maximumFractionDigits: 0 })}`;
  }

  return (
    <div className="mt-6 space-y-6">
      {/* Progress bar */}
      <div className="rounded-lg border border-border p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            {progress.done}/{progress.total} done
            {progress.overdue > 0 && (
              <span className="ml-2 text-red-500">
                {progress.overdue} overdue
              </span>
            )}
          </span>
          <span className="text-muted-foreground">{pct}%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        {(progress.estimatedCostCents > 0 || progress.actualCostCents > 0) && (
          <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
            <span>
              Budget: {fmtCost(progress.estimatedCostCents)}
            </span>
            <span>
              Actual: {fmtCost(progress.actualCostCents)}
            </span>
          </div>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1">
        {CATEGORIES.map((cat) => {
          const catProgress = progress.categories[cat];
          const label =
            cat === "all"
              ? `All (${progress.total})`
              : `${cat.charAt(0).toUpperCase() + cat.slice(1)}${catProgress ? ` (${catProgress.done}/${catProgress.total})` : ""}`;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Overdue items */}
      {overdue.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-red-500">
            Overdue ({overdue.length})
          </h3>
          <div className="mt-2 space-y-1">
            {overdue.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                today={today}
                onToggle={handleToggle}
                onDelete={handleDelete}
                isPending={isPending}
              />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming / in progress */}
      {upcoming.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            To do ({upcoming.length})
          </h3>
          <div className="mt-2 space-y-1">
            {upcoming.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                today={today}
                onToggle={handleToggle}
                onDelete={handleDelete}
                isPending={isPending}
              />
            ))}
          </div>
        </section>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Done ({completed.length})
          </h3>
          <div className="mt-2 space-y-1">
            {completed.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                today={today}
                onToggle={handleToggle}
                onDelete={handleDelete}
                isPending={isPending}
              />
            ))}
          </div>
        </section>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setShowAddForm((o) => !o)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Add item
        </button>
        {items.length === 0 && (
          <button
            type="button"
            onClick={handlePopulate}
            disabled={isPending}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            Populate from template
          </button>
        )}
      </div>

      {/* Add form */}
      {showAddForm && (
        <form
          action={handleAdd}
          className="rounded-lg border border-primary/50 bg-muted/30 p-4 space-y-3"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              name="title"
              placeholder="Task title"
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <select
              name="category"
              defaultValue="other"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {CATEGORIES.filter((c) => c !== "all").map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              name="due_date"
              type="date"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <input
              name="estimated_cost_eur"
              type="number"
              step="0.01"
              min="0"
              placeholder="Est. cost (\u20AC)"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <select
              name="assigned_to"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Unassigned</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isPending ? "Adding..." : "Add"}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded-md border border-input px-4 py-1.5 text-xs font-medium hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function ItemRow({
  item,
  today,
  onToggle,
  onDelete,
  isPending,
}: {
  item: ChecklistItem;
  today: string;
  onToggle: (item: ChecklistItem) => void;
  onDelete: (id: string) => void;
  isPending: boolean;
}) {
  const isOverdue =
    item.due_date &&
    item.due_date < today &&
    item.status !== "done" &&
    item.status !== "skipped";
  const threeDaysFromNow = new Date(new Date(today).getTime() + 3 * 86400000)
    .toISOString()
    .slice(0, 10);
  const isDueSoon =
    !isOverdue &&
    item.due_date &&
    item.due_date <= threeDaysFromNow &&
    item.status !== "done" &&
    item.status !== "skipped";

  return (
    <div
      className={`flex items-center gap-3 rounded-md border p-3 transition-colors ${STATUS_COLORS[item.status] ?? "border-border"}`}
    >
      <button
        type="button"
        onClick={() => onToggle(item)}
        disabled={isPending}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 text-xs transition-colors ${
          item.status === "done"
            ? "border-green-500 bg-green-500 text-white"
            : item.status === "in_progress"
              ? "border-yellow-500 bg-yellow-100"
              : "border-border hover:border-primary"
        }`}
        title={`Status: ${item.status} — click to cycle`}
      >
        {item.status === "done" && "\u2713"}
        {item.status === "in_progress" && "\u25CF"}
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-medium ${item.status === "done" ? "line-through text-muted-foreground" : ""}`}
        >
          {item.title}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="default">{item.category}</Badge>
          {item.due_date && (
            <span
              className={
                isOverdue
                  ? "font-semibold text-red-500"
                  : isDueSoon
                    ? "font-semibold text-yellow-600"
                    : ""
              }
            >
              {new Date(item.due_date + "T00:00:00").toLocaleDateString(
                undefined,
                { month: "short", day: "numeric" }
              )}
            </span>
          )}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(item as any).assignee?.display_name && (
            <span>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(item as any).assignee.display_name}
            </span>
          )}
          {item.estimated_cost_cents != null && item.estimated_cost_cents > 0 && (
            <span>
              {`\u20AC${(item.estimated_cost_cents / 100).toLocaleString()}`}
              {item.actual_cost_cents != null &&
                ` / \u20AC${(item.actual_cost_cents / 100).toLocaleString()}`}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onDelete(item.id)}
        disabled={isPending}
        className="shrink-0 text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}
