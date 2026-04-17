import { getAuditLog } from "@/actions/audit";
import { AuditLogClient } from "./audit-log-client";

const PAGE_SIZE = 100;

// Enumerated from existing audit_log inserts across actions/*.ts.
const AUDIT_LOG_ACTIONS = [
  "add_event_media",
  "assign_staff_to_event",
  "check_in_ticket",
  "create_coupon",
  "create_email_sequence",
  "create_event",
  "create_schedule_item",
  "create_tier",
  "delete_email_sequence",
  "delete_event",
  "delete_event_media",
  "delete_schedule_item",
  "delete_tier",
  "dispatch_email_sequence",
  "door_sale",
  "gdpr_delete_buyer",
  "invite_staff",
  "order_paid",
  "refund_order",
  "remove_staff",
  "reservation_released",
  "ticket_issued",
  "transfer_ticket",
  "unassign_staff_from_event",
  "update_event",
  "update_staff_role",
  "update_ticket_notes",
];

const AUDIT_LOG_ENTITY_TYPES = [
  "coupons",
  "event_email_sequences",
  "event_media",
  "event_schedule_items",
  "events",
  "orders",
  "profiles",
  "staff_event_assignments",
  "ticket_tiers",
  "tickets",
];

export default async function AuditLogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    action?: string;
    entity?: string;
    user?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;

  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const fromDate = sp.from ? `${sp.from}T00:00:00.000Z` : undefined;
  const toDate = sp.to ? `${sp.to}T23:59:59.999Z` : undefined;

  const result = await getAuditLog({
    action: sp.action,
    entityType: sp.entity,
    userEmailQuery: sp.user,
    fromDate,
    toDate,
    limit: PAGE_SIZE,
    offset,
  });

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold">
        {locale === "de"
          ? "Audit-Protokoll"
          : locale === "fr"
            ? "Journal d\u2019audit"
            : "Audit Log"}
      </h1>

      <AuditLogClient
        locale={locale}
        rows={result.rows}
        total={result.total}
        page={page}
        pageSize={PAGE_SIZE}
        actions={AUDIT_LOG_ACTIONS}
        entityTypes={AUDIT_LOG_ENTITY_TYPES}
        currentActionFilter={sp.action ?? ""}
        currentEntityFilter={sp.entity ?? ""}
        currentUserFilter={sp.user ?? ""}
        currentFromFilter={sp.from ?? ""}
        currentToFilter={sp.to ?? ""}
      />
    </div>
  );
}
