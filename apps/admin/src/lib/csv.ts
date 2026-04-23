// Tiny CSV builder shared across every department's Reports tab. Main
// requirement beyond `rows.join(",")`: round-trip safe for Excel-DE
// (UTF-8 BOM prevents mojibake on column headers like "Förderer") and
// for fields that contain commas, quotes, or line breaks (all properly
// escaped per RFC 4180).
//
// Output shape: a string ready to pipe into a Blob. The companion
// `csvResponse()` helper wraps it as a downloadable Response.

export type CsvRow = Record<string, string | number | null | undefined>;

export interface CsvOptions {
  /** Column headers in the order they should appear. Required so rows
   *  with missing keys emit the right number of empty fields. */
  columns: string[];
  /** Delimiter. Comma by default; some accountants prefer semicolon
   *  for Excel-DE compatibility (Excel's CSV import detects ; when
   *  the decimal separator is a comma). */
  delimiter?: "," | ";";
}

const CR = "\r\n"; // Excel expects CRLF between rows.
const BOM = "﻿";

function escape(value: unknown, delimiter: string): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (s.includes(delimiter) || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildCsv(rows: CsvRow[], opts: CsvOptions): string {
  const delimiter = opts.delimiter ?? ",";
  const header = opts.columns.map((c) => escape(c, delimiter)).join(delimiter);
  const body = rows
    .map((row) =>
      opts.columns.map((c) => escape(row[c], delimiter)).join(delimiter)
    )
    .join(CR);
  return BOM + header + CR + body + (rows.length > 0 ? CR : "");
}

/** Returns a Response ready to send from a route handler. */
export function csvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

/** ISO yyyy-mm-dd — for filenames that should sort naturally. */
export function isoDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}
