"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export interface SiteSettings {
  support_email: string;
  press_email: string;
  maintenance_mode: boolean;
  maintenance_message_en: string;
  maintenance_message_de: string;
  maintenance_message_fr: string;
  default_currency: string;
  updated_at: string;
}

export interface WebhookLogRow {
  id: string;
  source: string;
  processedAt: string;
}

export interface BuyerLookupRow {
  userId: string;
  email: string;
  displayName: string | null;
  createdAt: string | null;
  orderCount: number;
  ticketCount: number;
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function getRecentWebhooks(limit = 50): Promise<WebhookLogRow[]> {
  await requireRole("admin");
  const supabase = await createServerClient();

  const { data } = await supabase
    .from("processed_webhooks")
    .select("id, source, processed_at")
    .order("processed_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => ({
    id: row.id,
    source: row.source,
    processedAt: row.processed_at,
  }));
}

/**
 * Look up a buyer by email so a super admin can prepare a GDPR deletion.
 */
export async function lookupBuyer(
  email: string
): Promise<BuyerLookupRow | { error: string }> {
  await requireRole("super_admin");

  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return { error: "Enter an email." };

  const service = getServiceClient();

  // Search for the user via Supabase auth.
  const { data: usersList } = await service.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  const authUser = (usersList?.users ?? []).find(
    (u) => (u.email ?? "").toLowerCase() === trimmed
  );

  // They may also be a guest buyer (never created an auth.users row) — in that
  // case we rely on orders.recipient_email and tickets.attendee_email.
  const supabase = await createServerClient();

  if (authUser) {
    const [profileRes, ordersRes, ticketsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("display_name, created_at")
        .eq("id", authUser.id)
        .maybeSingle(),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .or(`buyer_id.eq.${authUser.id},recipient_email.eq.${trimmed}`),
      supabase
        .from("tickets")
        .select("id", { count: "exact", head: true })
        .or(`buyer_id.eq.${authUser.id},attendee_email.eq.${trimmed}`),
    ]);

    return {
      userId: authUser.id,
      email: trimmed,
      displayName: profileRes.data?.display_name ?? null,
      createdAt: profileRes.data?.created_at ?? authUser.created_at,
      orderCount: ordersRes.count ?? 0,
      ticketCount: ticketsRes.count ?? 0,
    };
  }

  // Guest buyer fallback.
  const [ordersRes, ticketsRes] = await Promise.all([
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("recipient_email", trimmed),
    supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("attendee_email", trimmed),
  ]);

  if ((ordersRes.count ?? 0) === 0 && (ticketsRes.count ?? 0) === 0) {
    return { error: "No records found for this email." };
  }

  return {
    userId: "",
    email: trimmed,
    displayName: null,
    createdAt: null,
    orderCount: ordersRes.count ?? 0,
    ticketCount: ticketsRes.count ?? 0,
  };
}

/**
 * GDPR data deletion. Rule 67: Super Admin only. Anonymises PII on
 * orders/tickets and deletes the auth user if present. Audit log is
 * intentionally preserved (rule 70: 2-year retention) but the
 * user_id reference becomes dangling once auth.users is deleted.
 */
export async function deleteBuyerPII(
  email: string
): Promise<{ success?: true; error?: string }> {
  const actor = await requireRole("super_admin");
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return { error: "Enter an email." };

  const supabase = await createServerClient();
  const service = getServiceClient();

  const { data: usersList } = await service.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  const authUser = (usersList?.users ?? []).find(
    (u) => (u.email ?? "").toLowerCase() === trimmed
  );

  const anonEmail = `deleted+${Date.now().toString(36)}@dbc-germany.local`;
  const anonName = "[GDPR deleted]";

  // Anonymise orders tied to this email or user id.
  const orderFilter = authUser
    ? `buyer_id.eq.${authUser.id},recipient_email.eq.${trimmed}`
    : `recipient_email.eq.${trimmed}`;

  await supabase
    .from("orders")
    .update({
      recipient_email: anonEmail,
      recipient_name: anonName,
      buyer_id: null,
    })
    .or(orderFilter);

  // Anonymise tickets.
  const ticketFilter = authUser
    ? `buyer_id.eq.${authUser.id},attendee_email.eq.${trimmed}`
    : `attendee_email.eq.${trimmed}`;

  await supabase
    .from("tickets")
    .update({
      attendee_email: anonEmail,
      attendee_name: anonName,
      buyer_id: null,
      notes: null,
    })
    .or(ticketFilter);

  // Delete auth user (if any) + cascade the profile via FK ON DELETE CASCADE.
  if (authUser) {
    await service.auth.admin.deleteUser(authUser.id);
  }

  await supabase.from("audit_log").insert({
    user_id: actor.userId,
    action: "gdpr_delete_buyer",
    entity_type: "profiles",
    entity_id: authUser?.id ?? null,
    details: {
      email_anonymised_from: trimmed,
      auth_user_deleted: Boolean(authUser),
    },
  });

  return { success: true };
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
  await requireRole("admin");
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("site_settings")
    .select(
      "support_email, press_email, maintenance_mode, maintenance_message_en, maintenance_message_de, maintenance_message_fr, default_currency, updated_at"
    )
    .eq("id", 1)
    .maybeSingle();
  return (data as SiteSettings | null) ?? null;
}

export async function updateSiteSettings(formData: FormData) {
  const user = await requireRole("admin");
  const supabase = await createServerClient();

  const patch = {
    support_email: ((formData.get("support_email") as string) || "").trim(),
    press_email: ((formData.get("press_email") as string) || "").trim(),
    maintenance_mode: formData.get("maintenance_mode") === "on",
    maintenance_message_en:
      ((formData.get("maintenance_message_en") as string) || "").trim(),
    maintenance_message_de:
      ((formData.get("maintenance_message_de") as string) || "").trim(),
    maintenance_message_fr:
      ((formData.get("maintenance_message_fr") as string) || "").trim(),
    default_currency:
      ((formData.get("default_currency") as string) || "EUR").trim(),
    updated_by: user.userId,
  };

  if (!patch.support_email.includes("@")) {
    return { error: "Support email must be a valid address." };
  }

  const { error } = await supabase
    .from("site_settings")
    .update(patch)
    .eq("id", 1);
  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "update_site_settings",
    entity_type: "site_settings",
    entity_id: "1",
    details: { maintenance_mode: patch.maintenance_mode },
  });

  // Revalidate every locale's root so maintenance-mode toggle shows up fast.
  revalidatePath("/", "layout");
  return { success: true };
}
