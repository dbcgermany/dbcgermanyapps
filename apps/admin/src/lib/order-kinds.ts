// "Orders" in the product sense = tickets the buyer (or operator) actually
// transacted on. Internal allocations to team, speakers, or comp guests are
// NOT orders even though they share the orders table — they're allocations.
//
// Every KPI that counts orders or sold tickets must filter to the real-order
// acquisition types so internal allocations don't inflate sales numbers.

export type AcquisitionType = "purchased" | "invited" | "assigned" | "door_sale";

export const REAL_ORDER_ACQUISITION_TYPES = [
  "purchased",
  "door_sale",
] as const satisfies readonly AcquisitionType[];

export const ALLOCATION_ACQUISITION_TYPES = [
  "invited",
  "assigned",
] as const satisfies readonly AcquisitionType[];

export type RealOrderAcquisitionType = (typeof REAL_ORDER_ACQUISITION_TYPES)[number];
export type AllocationAcquisitionType = (typeof ALLOCATION_ACQUISITION_TYPES)[number];

export function isRealOrder(type: AcquisitionType | null | undefined): boolean {
  return type === "purchased" || type === "door_sale";
}

export function isAllocation(type: AcquisitionType | null | undefined): boolean {
  return type === "invited" || type === "assigned";
}
