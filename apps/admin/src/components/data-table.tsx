import type { ReactNode } from "react";

/**
 * SSOT data table shell for admin list pages.
 * Enforces consistent header styling (muted bg, uppercase tracking, xs font).
 *
 * Usage:
 *   <DataTable columns={["Name", "Status", "Date"]} empty={<EmptyState ... />}>
 *     {rows.map(r => (
 *       <DataTable.Row key={r.id}>
 *         <DataTable.Cell>{r.name}</DataTable.Cell>
 *         <DataTable.Cell><Badge variant="success">Active</Badge></DataTable.Cell>
 *         <DataTable.Cell align="right">{r.date}</DataTable.Cell>
 *       </DataTable.Row>
 *     ))}
 *   </DataTable>
 */
export function DataTable({
  columns,
  children,
  empty,
  className,
}: {
  columns: Array<string | { label: string; align?: "left" | "right" | "center" }>;
  children: ReactNode;
  empty?: ReactNode;
  className?: string;
}) {
  const hasRows = Array.isArray(children)
    ? children.filter(Boolean).length > 0
    : Boolean(children);

  if (!hasRows && empty) return <>{empty}</>;

  return (
    <div className={`overflow-hidden rounded-lg border border-border ${className ?? ""}`}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            {columns.map((col, i) => {
              const label = typeof col === "string" ? col : col.label;
              const align = typeof col === "string" ? "left" : (col.align ?? "left");
              return (
                <th
                  key={i}
                  className={`px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground ${
                    align === "right"
                      ? "text-right"
                      : align === "center"
                        ? "text-center"
                        : "text-left"
                  }`}
                >
                  {label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Row({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${className ?? ""}`}
      {...props}
    >
      {children}
    </tr>
  );
}

function Cell({
  children,
  align = "left",
  mono,
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement> & {
  align?: "left" | "right" | "center";
  mono?: boolean;
}) {
  return (
    <td
      className={`px-4 py-3 ${
        align === "right"
          ? "text-right"
          : align === "center"
            ? "text-center"
            : ""
      } ${mono ? "font-mono" : ""} ${className ?? ""}`}
      {...props}
    >
      {children}
    </td>
  );
}

DataTable.Row = Row;
DataTable.Cell = Cell;
