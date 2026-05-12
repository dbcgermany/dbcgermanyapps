"use client";

import { useMemo, useState, useTransition } from "react";
import {
  type CateringMenuItem,
  submitCateringSelection,
} from "@/actions/catering-selection";

type Lang = "en" | "de" | "fr";

const T = {
  en: {
    sectionStarter: "Starter",
    sectionMain: "Main course",
    sectionDessert: "Dessert",
    sectionNonAlc: "Non-alcoholic drinks",
    sectionAlc: "Alcoholic drinks",
    sectionSnack: "Snacks",
    pickOne: "Pick one",
    pickMulti: "Pick up to 3",
    notesLabel: "Allergies, intolerances or notes for the kitchen",
    notesPh: "e.g. severe nut allergy, lactose-free dish please",
    save: "Save my selection",
    saving: "Saving…",
    saved: "Saved. See you at the event.",
    soldOut: "Sold out",
    veg: "Vegetarian",
    vegan: "Vegan",
    halal: "Halal",
  },
  de: {
    sectionStarter: "Vorspeise",
    sectionMain: "Hauptgang",
    sectionDessert: "Dessert",
    sectionNonAlc: "Alkoholfreie Getränke",
    sectionAlc: "Alkoholische Getränke",
    sectionSnack: "Snacks",
    pickOne: "Wähle eines",
    pickMulti: "Wähle bis zu 3",
    notesLabel: "Allergien, Unverträglichkeiten oder Hinweise für die Küche",
    notesPh: "z. B. starke Nussallergie, bitte laktosefrei",
    save: "Auswahl speichern",
    saving: "Wird gespeichert…",
    saved: "Gespeichert. Wir sehen uns vor Ort.",
    soldOut: "Ausverkauft",
    veg: "Vegetarisch",
    vegan: "Vegan",
    halal: "Halal",
  },
  fr: {
    sectionStarter: "Entrée",
    sectionMain: "Plat principal",
    sectionDessert: "Dessert",
    sectionNonAlc: "Boissons sans alcool",
    sectionAlc: "Boissons alcoolisées",
    sectionSnack: "Snacks",
    pickOne: "Choisissez-en un",
    pickMulti: "Jusqu'à 3 choix",
    notesLabel:
      "Allergies, intolérances ou notes pour la cuisine",
    notesPh: "ex. forte allergie aux noix, sans lactose",
    save: "Enregistrer ma sélection",
    saving: "Enregistrement…",
    saved: "Enregistré. À très vite à l'événement.",
    soldOut: "Épuisé",
    veg: "Végétarien",
    vegan: "Végan",
    halal: "Halal",
  },
} as const;

const SINGLE_SELECT_CATS = new Set(["starter", "main", "dessert"]);
const DRINK_PICK_LIMIT = 3;

export function CateringForm({
  locale,
  token,
  menu,
  initialSelectedIds,
  initialNotes,
}: {
  locale: Lang;
  token: string;
  menu: CateringMenuItem[];
  initialSelectedIds: string[];
  initialNotes: string;
}) {
  const t = T[locale];
  const [selected, setSelected] = useState<Set<string>>(
    new Set(initialSelectedIds)
  );
  const [notes, setNotes] = useState(initialNotes);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const grouped = useMemo(() => {
    const m = new Map<string, CateringMenuItem[]>();
    for (const item of menu) {
      const list = m.get(item.category) ?? [];
      list.push(item);
      m.set(item.category, list);
    }
    return m;
  }, [menu]);

  function isSoldOut(item: CateringMenuItem) {
    if (item.max_selections_per_event == null) return false;
    if (selected.has(item.id)) return false;
    return item.selections_count >= item.max_selections_per_event;
  }

  function toggle(item: CateringMenuItem) {
    setError(null);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
        return next;
      }
      if (SINGLE_SELECT_CATS.has(item.category)) {
        // Remove any other items in the same category
        for (const m of menu) {
          if (m.category === item.category) next.delete(m.id);
        }
      } else if (
        item.category === "drink_non_alcoholic" ||
        item.category === "drink_alcoholic"
      ) {
        const currentDrinkCount = menu.filter(
          (mi) =>
            (mi.category === "drink_non_alcoholic" ||
              mi.category === "drink_alcoholic") &&
            next.has(mi.id)
        ).length;
        if (currentDrinkCount >= DRINK_PICK_LIMIT) {
          setError(
            locale === "de"
              ? `Maximal ${DRINK_PICK_LIMIT} Getränke wählbar.`
              : locale === "fr"
                ? `Maximum ${DRINK_PICK_LIMIT} boissons.`
                : `Pick at most ${DRINK_PICK_LIMIT} drinks.`
          );
          return prev;
        }
      }
      next.add(item.id);
      return next;
    });
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await submitCateringSelection({
        token,
        selectedItemIds: Array.from(selected),
        notes,
        honeypot: (formData.get("website") as string) || undefined,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      setSuccess(true);
    });
  }

  if (success) {
    return (
      <div className="mt-8 rounded-md border border-success-border bg-success-soft/30 p-4 text-sm text-success">
        {t.saved}{" "}
        <button
          type="button"
          onClick={() => setSuccess(false)}
          className="ml-2 underline"
        >
          {locale === "de" ? "Auswahl ändern" : locale === "fr" ? "Modifier" : "Edit selection"}
        </button>
      </div>
    );
  }

  function nameFor(item: CateringMenuItem) {
    if (locale === "de") return item.name_de || item.name_en;
    if (locale === "fr") return item.name_fr || item.name_en;
    return item.name_en;
  }
  function descFor(item: CateringMenuItem) {
    if (locale === "de") return item.description_de;
    if (locale === "fr") return item.description_fr;
    return item.description_en;
  }

  return (
    <form action={handleSubmit} className="mt-8 space-y-8">
      {/* Honeypot */}
      <div aria-hidden className="hidden">
        <label>
          Website (do not fill)
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {error && (
        <div className="rounded-md border border-danger-border bg-danger-soft/40 p-3 text-sm text-danger">
          {error}
        </div>
      )}

      {[
        { key: "starter", title: t.sectionStarter, helper: t.pickOne },
        { key: "main", title: t.sectionMain, helper: t.pickOne },
        { key: "dessert", title: t.sectionDessert, helper: t.pickOne },
        {
          key: "drink_non_alcoholic",
          title: t.sectionNonAlc,
          helper: t.pickMulti,
        },
        { key: "drink_alcoholic", title: t.sectionAlc, helper: t.pickMulti },
        { key: "snack", title: t.sectionSnack, helper: t.pickMulti },
      ].map(({ key, title, helper }) => {
        const items = grouped.get(key) ?? [];
        if (items.length === 0) return null;
        return (
          <section key={key}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {title}{" "}
              <span className="text-[11px] normal-case text-muted-foreground/70">
                · {helper}
              </span>
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {items.map((item) => {
                const out = isSoldOut(item);
                const picked = selected.has(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={out}
                    onClick={() => toggle(item)}
                    className={`rounded-lg border p-4 text-left transition-colors ${
                      picked
                        ? "border-primary bg-accent/10"
                        : out
                          ? "border-muted bg-muted/20 opacity-50"
                          : "border-border bg-background hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{nameFor(item)}</p>
                      {picked && (
                        <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] uppercase tracking-wide text-primary-foreground">
                          ✓
                        </span>
                      )}
                      {out && (
                        <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[10px] uppercase tracking-wide text-warning">
                          {t.soldOut}
                        </span>
                      )}
                    </div>
                    {descFor(item) && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {descFor(item)}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1 text-[10px] uppercase tracking-wide">
                      {item.is_vegetarian && (
                        <span className="rounded bg-success-soft px-1.5 py-0.5 text-success">
                          {t.veg}
                        </span>
                      )}
                      {item.is_vegan && (
                        <span className="rounded bg-success-soft px-1.5 py-0.5 text-success">
                          {t.vegan}
                        </span>
                      )}
                      {item.is_halal && (
                        <span className="rounded bg-success-soft px-1.5 py-0.5 text-success">
                          {t.halal}
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
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}

      <section>
        <label className="block text-sm font-medium">{t.notesLabel}</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t.notesPh}
          rows={3}
          maxLength={500}
          className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </section>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? t.saving : t.save}
      </button>
    </form>
  );
}
