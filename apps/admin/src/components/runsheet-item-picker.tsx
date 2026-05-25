"use client";

import { Select } from "@dbc/ui";
import type { RunsheetPickerOption } from "@/actions/checklist";

// Shared "Link to runsheet item" picker. Used by:
//   - Checklist add + edit forms (links a prep item to the runsheet row it serves)
//   - Budget expense form (links a spend line to the runsheet row it pays for)
//
// One component so both call sites format times + groupings the same way and
// future field additions land everywhere at once (SSOT, per
// feedback_ssot_cross_link_pattern).

const T = {
  en: {
    label: "Link to run-sheet item",
    hint: "Pick the run-sheet row this prep / spend serves so the day-of view shows the connection.",
    none: "— Not linked —",
    publicGroup: "On the public agenda",
    internalGroup: "Internal operations",
  },
  de: {
    label: "Mit Ablaufplan-Eintrag verknüpfen",
    hint: "Wähle den Ablauf-Eintrag, auf den sich diese Vorbereitung / Ausgabe bezieht — die Tagesansicht zeigt die Verbindung dann an.",
    none: "— Nicht verknüpft —",
    publicGroup: "Öffentliches Programm",
    internalGroup: "Interner Ablauf",
  },
  fr: {
    label: "Lier à un élément de la feuille de route",
    hint: "Choisis la ligne de la feuille de route à laquelle se rattache cette préparation / dépense pour que le jour J affiche le lien.",
    none: "— Pas de lien —",
    publicGroup: "Programme public",
    internalGroup: "Opérations internes",
  },
} as const;

export function RunsheetItemPicker({
  name = "runsheet_item_id",
  defaultValue,
  options,
  locale,
}: {
  name?: string;
  defaultValue?: string | null;
  options: RunsheetPickerOption[];
  locale: string;
}) {
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];

  const publicOpts = options.filter((o) => o.is_public);
  const internalOpts = options.filter((o) => !o.is_public);

  function timeLabel(iso: string) {
    return new Date(iso).toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <Select name={name} defaultValue={defaultValue ?? ""}>
      <option value="">{t.none}</option>
      {publicOpts.length > 0 && (
        <optgroup label={t.publicGroup}>
          {publicOpts.map((o) => (
            <option key={o.id} value={o.id}>
              {timeLabel(o.starts_at)} — {o.title}
            </option>
          ))}
        </optgroup>
      )}
      {internalOpts.length > 0 && (
        <optgroup label={t.internalGroup}>
          {internalOpts.map((o) => (
            <option key={o.id} value={o.id}>
              {timeLabel(o.starts_at)} — {o.title}
            </option>
          ))}
        </optgroup>
      )}
    </Select>
  );
}

export function runsheetItemPickerHint(locale: string): string {
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];
  return t.hint;
}

export function runsheetItemPickerLabel(locale: string): string {
  const t = T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof T];
  return t.label;
}
