"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@dbc/ui";
import { recordManualCateringSelection } from "@/actions/catering";
import {
  searchAttendees,
  type AttendeeSearchResult,
} from "@/actions/tickets";
import {
  CATERING_CATEGORIES,
  type CateringCategory,
  type CateringMenuItem,
} from "@/lib/catering-types";

const SINGLE_SELECT_CATS = new Set<CateringCategory>([
  "starter",
  "main",
  "dessert",
]);

/**
 * Admin-side picker for logging a guest's catering choices manually
 * (e.g. they confirmed by phone, didn't use the public form). Reuses the
 * existing `searchAttendees` action for the contact picker — same one the
 * scan page uses — and posts through `recordManualCateringSelection` which
 * runs the same diff-based upsert + single-select-per-category rule as the
 * public form. No duplicated logic between admin + public paths.
 */
export function ManualCateringEntry({
  eventId,
  locale,
  menu,
}: {
  eventId: string;
  locale: string;
  menu: CateringMenuItem[];
}) {
  const t = useTranslations("admin.catering.manual");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<AttendeeSearchResult[]>([]);
  const [selectedAttendee, setSelectedAttendee] =
    useState<AttendeeSearchResult | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(
    new Set()
  );
  const [notes, setNotes] = useState("");

  // Debounced search — 300 ms idle before firing. The lint rule
  // (react-hooks/set-state-in-effect) bans synchronous setState from inside
  // an effect, so the short-query "clear" path also runs inside the timer.
  useEffect(() => {
    const q = search.trim();
    const handle = setTimeout(async () => {
      if (q.length < 2) {
        setResults([]);
        return;
      }
      const res = await searchAttendees({ query: q, eventId, limit: 8 });
      setResults(res);
    }, 300);
    return () => clearTimeout(handle);
  }, [search, eventId]);

  function pickAttendee(a: AttendeeSearchResult) {
    setSelectedAttendee(a);
    setSearch(a.attendee_name);
    setResults([]);
    setSelectedItemIds(new Set());
    setNotes("");
  }

  function toggle(item: CateringMenuItem) {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
        return next;
      }
      // Single-select per starter/main/dessert (mirrors public form).
      if (SINGLE_SELECT_CATS.has(item.category)) {
        for (const m of menu) {
          if (m.category === item.category) next.delete(m.id);
        }
      }
      next.add(item.id);
      return next;
    });
  }

  function submit() {
    if (!selectedAttendee) return;
    startTransition(async () => {
      const res = await recordManualCateringSelection({
        ticketId: selectedAttendee.ticket_id,
        selectedItemIds: Array.from(selectedItemIds),
        notes: notes || undefined,
      });
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(t("savedToast"));
      setSelectedAttendee(null);
      setSelectedItemIds(new Set());
      setNotes("");
      setSearch("");
      router.refresh();
    });
  }

  // Group menu by category, in canonical category order.
  const grouped = new Map<CateringCategory, CateringMenuItem[]>();
  for (const cat of CATERING_CATEGORIES) grouped.set(cat, []);
  for (const item of menu) {
    if (item.is_active) grouped.get(item.category)!.push(item);
  }

  function nameFor(item: CateringMenuItem) {
    if (locale === "de") return item.name_de || item.name_en;
    if (locale === "fr") return item.name_fr || item.name_en;
    return item.name_en;
  }

  return (
    <section className="rounded-lg border border-border bg-muted/10 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {t("title")}
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">{t("hint")}</p>

      {/* Attendee picker */}
      <div className="mt-3">
        <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("attendee")}
        </label>
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (selectedAttendee) setSelectedAttendee(null);
          }}
          placeholder={t("searchPlaceholder")}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        {results.length > 0 && !selectedAttendee && (
          <ul className="mt-1 max-h-56 overflow-y-auto rounded-md border border-border bg-background">
            {results.map((r) => (
              <li key={r.ticket_id}>
                <button
                  type="button"
                  onClick={() => pickAttendee(r)}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-muted/40"
                >
                  <span className="font-medium">{r.attendee_name}</span>{" "}
                  <span className="text-xs text-muted-foreground">
                    · {r.attendee_email} · {r.tier_name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedAttendee && (
        <>
          {/* Dish picker */}
          <div className="mt-4 space-y-4">
            {CATERING_CATEGORIES.map((cat) => {
              const items = grouped.get(cat) ?? [];
              if (items.length === 0) return null;
              return (
                <div key={cat}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t(`categories.${cat}`)}
                    {SINGLE_SELECT_CATS.has(cat) ? (
                      <span className="ml-2 text-[10px] normal-case text-muted-foreground/70">
                        · {t("pickOne")}
                      </span>
                    ) : (
                      <span className="ml-2 text-[10px] normal-case text-muted-foreground/70">
                        · {t("pickAny")}
                      </span>
                    )}
                  </p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {items.map((item) => {
                      const picked = selectedItemIds.has(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggle(item)}
                          className={`rounded-md border px-3 py-2 text-left text-xs transition-colors ${
                            picked
                              ? "border-primary bg-accent/10"
                              : "border-border bg-background hover:border-primary/50"
                          }`}
                        >
                          <span className="font-medium">{nameFor(item)}</span>
                          {(item.is_vegan || item.is_vegetarian || item.is_halal) && (
                            <span className="ml-1 text-[10px] uppercase text-success">
                              {item.is_vegan
                                ? "vegan"
                                : item.is_vegetarian
                                  ? "veg"
                                  : "halal"}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4">
            <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("notes")}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder={t("notesPlaceholder")}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedAttendee(null);
                setSelectedItemIds(new Set());
                setSearch("");
                setNotes("");
              }}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
            >
              {t("cancel")}
            </button>
            <Button
              type="button"
              disabled={isPending || selectedItemIds.size === 0}
              onClick={submit}
            >
              {isPending ? t("saving") : t("save")}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
