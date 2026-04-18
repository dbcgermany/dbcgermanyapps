"use server";

import { createServerClient, requireRole } from "@dbc/supabase/server";
import { revalidatePath } from "next/cache";

const EXPENSE_COLUMNS =
  "id, event_id, category, description, amount_cents, currency, vendor_name, vendor_contact, paid_at, receipt_url, created_by, created_at" as const;

export async function getEventExpenses(eventId: string) {
  await requireRole("manager");
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("event_expenses")
    .select(EXPENSE_COLUMNS)
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const totalCents = (data ?? []).reduce(
    (sum, row) => sum + (row.amount_cents ?? 0),
    0
  );

  return { expenses: data ?? [], totalCents, count: (data ?? []).length };
}

export async function createExpense(eventId: string, formData: FormData) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const locale = formData.get("locale") as string;
  const description = (formData.get("description") as string).trim();

  const expenseData = {
    event_id: eventId,
    category: formData.get("category") as string,
    description,
    amount_cents: Math.round(
      parseFloat(formData.get("amount") as string) * 100
    ),
    currency: (formData.get("currency") as string) || "EUR",
    vendor_name: (formData.get("vendor_name") as string) || null,
    vendor_contact: (formData.get("vendor_contact") as string) || null,
    paid_at: (formData.get("paid_at") as string) || null,
    receipt_url: (formData.get("receipt_url") as string) || null,
    created_by: user.userId,
  };

  const { data, error } = await supabase
    .from("event_expenses")
    .insert(expenseData)
    .select("id")
    .single();

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "create_expense",
    entity_type: "event_expenses",
    entity_id: data.id,
    details: { description, event_id: eventId },
  });

  revalidatePath(`/${locale}/events/${eventId}/budget`);
  return { success: true };
}

export async function updateExpense(id: string, formData: FormData) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const eventId = formData.get("event_id") as string;
  const locale = formData.get("locale") as string;
  const description = (formData.get("description") as string).trim();

  const expenseData = {
    category: formData.get("category") as string,
    description,
    amount_cents: Math.round(
      parseFloat(formData.get("amount") as string) * 100
    ),
    currency: (formData.get("currency") as string) || "EUR",
    vendor_name: (formData.get("vendor_name") as string) || null,
    vendor_contact: (formData.get("vendor_contact") as string) || null,
    paid_at: (formData.get("paid_at") as string) || null,
    receipt_url: (formData.get("receipt_url") as string) || null,
  };

  const { error } = await supabase
    .from("event_expenses")
    .update(expenseData)
    .eq("id", id);

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "update_expense",
    entity_type: "event_expenses",
    entity_id: id,
    details: { description, event_id: eventId },
  });

  revalidatePath(`/${locale}/events/${eventId}/budget`);
  return { success: true };
}

export async function deleteExpense(
  id: string,
  eventId: string,
  locale: string
) {
  const user = await requireRole("manager");
  const supabase = await createServerClient();

  const { error } = await supabase
    .from("event_expenses")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    user_id: user.userId,
    action: "delete_expense",
    entity_type: "event_expenses",
    entity_id: id,
    details: { event_id: eventId },
  });

  revalidatePath(`/${locale}/events/${eventId}/budget`);
  return { success: true };
}
