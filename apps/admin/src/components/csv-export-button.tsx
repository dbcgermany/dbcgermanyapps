"use client";

import { useState } from "react";
import { Button } from "@dbc/ui";

type CellValue = string | number | boolean | null | undefined | Date;
type Row = Record<string, CellValue>;

function escapeCsv(value: CellValue): string {
  if (value == null) return "";
  let s: string;
  if (value instanceof Date) s = value.toISOString();
  else if (typeof value === "boolean") s = value ? "true" : "false";
  else s = String(value);
  // RFC 4180 — wrap in quotes when the value contains special chars,
  // escape embedded double-quotes by doubling them.
  if (/[",\n\r]/.test(s)) {
    s = `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCsv(
  rows: Row[],
  headers: { key: string; label: string }[]
): string {
  const head = headers.map((h) => escapeCsv(h.label)).join(",");
  const body = rows
    .map((row) => headers.map((h) => escapeCsv(row[h.key])).join(","))
    .join("\r\n");
  // Prepend UTF-8 BOM so Excel recognises umlauts / accents.
  return "\uFEFF" + head + "\r\n" + body;
}

export function CsvExportButton({
  rows,
  headers,
  filename,
  label = "Download CSV",
  disabled,
}: {
  rows: Row[];
  headers: { key: string; label: string }[];
  filename: string;
  label?: string;
  disabled?: boolean;
}) {
  const [isBusy, setBusy] = useState(false);

  function handleClick() {
    setBusy(true);
    try {
      const csv = toCsv(rows, headers);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={handleClick}
      disabled={disabled || isBusy || rows.length === 0}
      title={
        rows.length === 0 ? "No rows to export" : `Export ${rows.length} rows`
      }
    >
      {isBusy ? "Exporting…" : label}
    </Button>
  );
}
