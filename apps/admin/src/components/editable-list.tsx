import type { ReactNode } from "react";
import { EmptyState } from "@/components/empty-state";

/**
 * Container for InlineEditRow children. Standardizes spacing + empty state
 * across editable lists (tiers, coupons, sponsors, schedule, runsheet, ...).
 *
 * For drag-and-drop variants, wrap your <SortableList> render output in
 * <EditableList> by passing the SortableList itself as children.
 *
 * Usage:
 *   <EditableList isEmpty={items.length === 0} emptyMessage={t("noItems")}>
 *     {items.map((item) => <InlineEditRow key={item.id} ... />)}
 *   </EditableList>
 */
export function EditableList({
  children,
  isEmpty,
  emptyMessage,
  emptyCta,
  className,
}: {
  children: ReactNode;
  isEmpty?: boolean;
  emptyMessage?: string;
  emptyCta?: { label: string; href: string };
  className?: string;
}) {
  if (isEmpty && emptyMessage) {
    return <EmptyState message={emptyMessage} cta={emptyCta} className={className} />;
  }
  return <div className={`space-y-3 ${className ?? ""}`}>{children}</div>;
}
