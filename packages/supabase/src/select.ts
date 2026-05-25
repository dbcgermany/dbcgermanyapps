// Typed column-list builders for Supabase `.select(...)`.
//
// Why: `.select("col1, col2")` is a runtime-parsed string. Local `tsc`
// won't catch typos or removed columns — prod 500s with "Error digest"
// (see feedback-postgrest-column-drift; we lived this on 2026-05-25
// with contacts.full_name). These helpers move column validation to
// compile time: TS errors when a column doesn't exist on the table's
// Row type.
//
// Usage:
//   import { cols } from "@dbc/supabase";
//   await supabase.from("contacts")
//     .select(cols("contacts", ["id", "first_name", "last_name", "email"]));
//
// For joins use `joinCols`:
//   .select([
//     cols("event_runsheet_items", ["id", "title", "starts_at"]),
//     joinCols("contacts", "contact", ["id", "first_name", "last_name"]),
//   ].join(", "))
//
// Both helpers return plain strings — same wire format Supabase already
// sends to PostgREST. Zero runtime cost. Zero behavioural change.

import type { Database } from "@dbc/types";

type PublicTables = Database["public"]["Tables"];
type TableName = keyof PublicTables;
type ColumnsOf<T extends TableName> = keyof PublicTables[T]["Row"];

/**
 * Comma-joined column list for `.select(...)`, validated at compile time
 * against the table's generated Row type.
 *
 *   cols("contacts", ["id", "first_name"]) // "id, first_name"
 *   cols("contacts", ["full_name"])        // TS ERROR — column doesn't exist
 */
export function cols<T extends TableName>(
  _table: T,
  columns: readonly ColumnsOf<T>[]
): string {
  return columns.join(", ");
}

/**
 * Join projection for `.select(...)`:
 *   joinCols("speakers", "speaker", ["id", "first_name", "last_name"], { fk: "event_runsheet_items_speaker_id_fkey" })
 *   //  → "speaker:speakers!event_runsheet_items_speaker_id_fkey(id, first_name, last_name)"
 *
 * `alias` is the property name the joined row appears under in the
 * response. `fk` is optional but recommended when the table has more
 * than one FK to the joined table — PostgREST throws a 300 otherwise.
 */
export function joinCols<T extends TableName>(
  table: T,
  alias: string,
  columns: readonly ColumnsOf<T>[],
  options: { fk?: string; inner?: boolean } = {}
): string {
  const tableExpr = options.fk
    ? `${String(table)}!${options.fk}`
    : String(table);
  const innerSuffix = options.inner ? "!inner" : "";
  return `${alias}:${tableExpr}${innerSuffix}(${columns.join(", ")})`;
}
