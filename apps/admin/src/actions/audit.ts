"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { createClient } from "@supabase/supabase-js";

export interface AuditLogEntry {
  id: number;
  createdAt: string;
  userId: string | null;
  userEmail: string | null;
  userDisplayName: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, unknown>;
  ipAddress: string | null;
}

export interface AuditLogPage {
  rows: AuditLogEntry[];
  total: number;
  limit: number;
  offset: number;
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function getAuditLog(opts: {
  action?: string;
  entityType?: string;
  userEmailQuery?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}): Promise<AuditLogPage> {
  await requireRole("super_admin");
  const supabase = await createServerClient();
  const service = getServiceClient();

  const limit = opts.limit ?? 100;
  const offset = opts.offset ?? 0;

  // If filtering by user email, resolve matching auth.users ids first.
  let restrictUserIds: string[] | null = null;
  if (opts.userEmailQuery && opts.userEmailQuery.trim()) {
    const q = opts.userEmailQuery.trim().toLowerCase();
    const { data: usersList } = await service.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    restrictUserIds = (usersList?.users ?? [])
      .filter((u) => (u.email ?? "").toLowerCase().includes(q))
      .map((u) => u.id);

    if (restrictUserIds.length === 0) {
      return { rows: [], total: 0, limit, offset };
    }
  }

  let query = supabase
    .from("audit_log")
    .select(
      "id, user_id, action, entity_type, entity_id, details, ip_address, created_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (opts.action) query = query.eq("action", opts.action);
  if (opts.entityType) query = query.eq("entity_type", opts.entityType);
  if (opts.fromDate) query = query.gte("created_at", opts.fromDate);
  if (opts.toDate) query = query.lte("created_at", opts.toDate);
  if (restrictUserIds) query = query.in("user_id", restrictUserIds);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  // Resolve user_id -> email + display_name for the rows on this page.
  const userIds = [
    ...new Set(
      (data ?? []).map((r) => r.user_id).filter((id): id is string => !!id)
    ),
  ];

  const profileMap = new Map<string, string | null>();
  const emailMap = new Map<string, string | null>();

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", userIds);
    for (const p of profiles ?? []) {
      profileMap.set(p.id, p.display_name);
    }

    await Promise.all(
      userIds.map(async (id) => {
        const { data: u } = await service.auth.admin.getUserById(id);
        emailMap.set(id, u.user?.email ?? null);
      })
    );
  }

  const rows: AuditLogEntry[] = (data ?? []).map((r) => ({
    id: r.id,
    createdAt: r.created_at,
    userId: r.user_id,
    userEmail: r.user_id ? emailMap.get(r.user_id) ?? null : null,
    userDisplayName: r.user_id ? profileMap.get(r.user_id) ?? null : null,
    action: r.action,
    entityType: r.entity_type,
    entityId: r.entity_id,
    details: (r.details ?? {}) as Record<string, unknown>,
    ipAddress: r.ip_address,
  }));

  return { rows, total: count ?? 0, limit, offset };
}
